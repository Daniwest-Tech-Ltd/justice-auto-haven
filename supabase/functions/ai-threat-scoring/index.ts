import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent security events
    const { data: securityEvents, error: eventsError } = await supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (eventsError) throw eventsError;

    // Fetch failed logins
    const { data: failedLogins, error: loginsError } = await supabase
      .from('failed_logins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (loginsError) throw loginsError;

    // Fetch blocked IPs
    const { data: blockedIps, error: ipsError } = await supabase
      .from('blocked_ips')
      .select('*')
      .eq('active', true);

    if (ipsError) throw ipsError;

    // Prepare data summary for AI analysis
    const dataSummary = {
      totalSecurityEvents: securityEvents?.length || 0,
      criticalEvents: securityEvents?.filter(e => e.severity === 'critical').length || 0,
      highSeverityEvents: securityEvents?.filter(e => e.severity === 'high').length || 0,
      failedLoginAttempts: failedLogins?.length || 0,
      blockedIpsCount: blockedIps?.length || 0,
      recentEvents: securityEvents?.slice(0, 10).map(e => ({
        type: e.event_type,
        severity: e.severity,
        title: e.title,
        source_ip: e.source_ip,
      })),
      failedLoginPatterns: failedLogins?.slice(0, 10).map(l => ({
        email: l.email,
        ip: l.ip,
        reason: l.reason,
      })),
    };

    console.log('Analyzing security data with AI:', dataSummary);

    // Call Lovable AI for threat scoring
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a cybersecurity threat analyst. Analyze security event data and provide:
1. Overall threat score (0-100)
2. Risk level (low/medium/high/critical)
3. Top 3 threats identified
4. Immediate recommendations

Respond in JSON format:
{
  "threatScore": number,
  "riskLevel": string,
  "threats": [{"title": string, "severity": string, "description": string}],
  "recommendations": [string]
}`
          },
          {
            role: 'user',
            content: `Analyze this security data from Justice Ultimate Automobiles system:

Security Events Summary:
- Total Events: ${dataSummary.totalSecurityEvents}
- Critical: ${dataSummary.criticalEvents}
- High Severity: ${dataSummary.highSeverityEvents}
- Failed Login Attempts: ${dataSummary.failedLoginAttempts}
- Active Blocked IPs: ${dataSummary.blockedIpsCount}

Recent Security Events:
${JSON.stringify(dataSummary.recentEvents, null, 2)}

Recent Failed Logins:
${JSON.stringify(dataSummary.failedLoginPatterns, null, 2)}

Provide threat score and analysis.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '{}';
    
    console.log('AI Response:', aiContent);

    // Parse AI response
    let analysis;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback analysis
      analysis = {
        threatScore: 50,
        riskLevel: 'medium',
        threats: [
          {
            title: 'Failed Login Attempts',
            severity: 'medium',
            description: `${dataSummary.failedLoginAttempts} failed login attempts detected`
          }
        ],
        recommendations: [
          'Enable multi-factor authentication for all accounts',
          'Review and update security policies',
          'Monitor blocked IPs for persistent threats'
        ]
      };
    }

    return new Response(
      JSON.stringify({
        ...analysis,
        timestamp: new Date().toISOString(),
        dataAnalyzed: {
          eventsCount: dataSummary.totalSecurityEvents,
          failedLoginsCount: dataSummary.failedLoginAttempts,
          blockedIpsCount: dataSummary.blockedIpsCount,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-threat-scoring:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        threatScore: 0,
        riskLevel: 'unknown'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});