import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RequestSchema = z.object({
  userId: z.string().uuid("Invalid user ID format").optional(),
  ip: z.string().ip("Invalid IP address format").max(45, "IP address too long"),
  action: z.string()
    .min(1, "Action cannot be empty")
    .max(50, "Action must be less than 50 characters")
    .regex(/^[a-z_]+$/, "Action must contain only lowercase letters and underscores")
});

interface RateLimitRequest {
  userId?: string;
  ip: string;
  action: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    
    // Validate input with zod
    const validationResult = RequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { userId, ip, action } = validationResult.data;
    
    console.log('Rate limit check:', { userId, ip, action });

    // Define rate limits per action
    const rateLimits: { [key: string]: { maxAttempts: number; windowMinutes: number } } = {
      'login': { maxAttempts: 5, windowMinutes: 15 },
      'api_call': { maxAttempts: 100, windowMinutes: 1 },
      'message_send': { maxAttempts: 20, windowMinutes: 5 },
      'review_submit': { maxAttempts: 3, windowMinutes: 60 },
    };

    const limit = rateLimits[action] || { maxAttempts: 50, windowMinutes: 10 };
    const windowStart = new Date(Date.now() - limit.windowMinutes * 60 * 1000).toISOString();

    // Check recent attempts
    let query = supabaseClient
      .from('security_events')
      .select('id', { count: 'exact' })
      .eq('event_type', action)
      .gte('created_at', windowStart);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('source_ip', ip);
    }

    const { count, error } = await query;

    if (error) {
      throw error;
    }

    const isRateLimited = (count || 0) >= limit.maxAttempts;

    // If rate limited, log security event
    if (isRateLimited) {
      await supabaseClient.from('security_events').insert({
        event_type: 'rate_limit_exceeded',
        severity: 'high',
        title: `Rate Limit Exceeded - ${action}`,
        description: `User exceeded rate limit for ${action}. ${count} attempts in ${limit.windowMinutes} minutes.`,
        source_ip: ip,
        user_id: userId || null,
        metadata: { action, attempts: count, limit: limit.maxAttempts }
      });

      // Auto-suspend if login attempts exceeded
      if (action === 'login' && userId) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('login_attempts, is_suspended, email')
          .eq('user_id', userId)
          .single();

        if (profile && !profile.is_suspended && (profile.login_attempts || 0) >= limit.maxAttempts) {
          // Generate activation code
          const { data: codeData } = await supabaseClient.rpc('generate_activation_code');
          const activationCode = codeData || Math.random().toString(36).substring(2, 10).toUpperCase();

          await supabaseClient.from('profiles').update({
            is_suspended: true,
            suspended_at: new Date().toISOString(),
            suspended_reason: 'Auto-suspended due to excessive failed login attempts',
            activation_code: activationCode
          }).eq('user_id', userId);

          // Send suspension notification
          if (profile.email) {
            await supabaseClient.functions.invoke('send-suspension-notification', {
              body: {
                email: profile.email,
                reason: 'Auto-suspended due to excessive failed login attempts',
                activationCode
              }
            });
          }

          console.log('User auto-suspended:', userId);
        }
      }
    }

    return new Response(
      JSON.stringify({
        rateLimited: isRateLimited,
        attempts: count || 0,
        limit: limit.maxAttempts,
        windowMinutes: limit.windowMinutes,
        resetsAt: new Date(Date.now() + limit.windowMinutes * 60 * 1000).toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error checking rate limit:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
