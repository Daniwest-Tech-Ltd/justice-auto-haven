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

    // Fetch user sessions for anomaly detection
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('login_at', { ascending: false })
      .limit(100);

    if (sessionsError) throw sessionsError;

    // Fetch profiles with login patterns
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, login_attempts, last_login_attempt, is_suspended, last_seen')
      .order('last_seen', { ascending: false })
      .limit(50);

    if (profilesError) throw profilesError;

    // Fetch activity logs
    const { data: activityLogs, error: logsError } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (logsError) throw logsError;

    // Analyze patterns
    const userSessionCounts = sessions?.reduce((acc: Record<string, number>, session) => {
      acc[session.user_id] = (acc[session.user_id] || 0) + 1;
      return acc;
    }, {});

    const suspiciousUsers = profiles?.filter(p => p.login_attempts > 3 || p.is_suspended) || [];
    
    const ipFrequency = sessions?.reduce((acc: Record<string, number>, session) => {
      const ip = session.client_info?.ip || 'unknown';
      acc[ip] = (acc[ip] || 0) + 1;
      return acc;
    }, {});

    const dataSummary = {
      totalSessions: sessions?.length || 0,
      uniqueUsers: Object.keys(userSessionCounts || {}).length,
      suspiciousUserCount: suspiciousUsers.length,
      activityLogCount: activityLogs?.length || 0,
      topIPs: Object.entries(ipFrequency || {})
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([ip, count]) => ({ ip, count })),
      recentSessions: sessions?.slice(0, 10).map(s => ({
        user_id: s.user_id,
        login_at: s.login_at,
        last_activity: s.last_activity_at,
        ip: s.client_info?.ip || 'unknown',
      })),
      suspiciousProfiles: suspiciousUsers.slice(0, 5).map(p => ({
        user_id: p.user_id,
        login_attempts: p.login_attempts,
        is_suspended: p.is_suspended,
      })),
    };

    console.log('Analyzing anomalies with AI:', dataSummary);

    // Call Lovable AI for anomaly detection
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
            content: `You are a cybersecurity anomaly detection specialist. Analyze user behavior and session data to identify anomalies and suspicious patterns.

Respond in JSON format:
{
  "anomaliesDetected": number,
  "severityLevel": "low"|"medium"|"high"|"critical",
  "anomalies": [
    {
      "type": string,
      "description": string,
      "severity": string,
      "affectedEntities": string[],
      "indicators": string[]
    }
  ],
  "patterns": [
    {
      "pattern": string,
      "frequency": string,
      "risk": string
    }
  ],
  "recommendations": string[]
}`
          },
          {
            role: 'user',
            content: `Analyze this session and activity data from Justice Ultimate Automobiles:

Session Analysis:
- Total Sessions: ${dataSummary.totalSessions}
- Unique Users: ${dataSummary.uniqueUsers}
- Suspicious User Count: ${dataSummary.suspiciousUserCount}
- Activity Logs: ${dataSummary.activityLogCount}

Top IPs by Session Count:
${JSON.stringify(dataSummary.topIPs, null, 2)}

Recent Sessions:
${JSON.stringify(dataSummary.recentSessions, null, 2)}

Suspicious User Profiles:
${JSON.stringify(dataSummary.suspiciousProfiles, null, 2)}

Identify anomalies, suspicious patterns, and behavioral deviations.`
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
        anomaliesDetected: dataSummary.suspiciousUserCount,
        severityLevel: dataSummary.suspiciousUserCount > 5 ? 'high' : 'medium',
        anomalies: [
          {
            type: 'Suspicious Login Patterns',
            description: `${dataSummary.suspiciousUserCount} users with suspicious login behavior`,
            severity: 'medium',
            affectedEntities: ['user_accounts'],
            indicators: ['Multiple failed login attempts', 'Account suspensions']
          }
        ],
        patterns: [
          {
            pattern: 'High IP concentration',
            frequency: 'detected',
            risk: 'medium'
          }
        ],
        recommendations: [
          'Review accounts with multiple failed login attempts',
          'Implement IP-based rate limiting',
          'Enable behavioral analytics for user sessions'
        ]
      };
    }

    // Store anomalies in anomaly_baselines table for tracking
    if (analysis.anomalies && analysis.anomalies.length > 0) {
      const { error: insertError } = await supabase
        .from('anomaly_baselines')
        .upsert({
          entity_type: 'system',
          entity_id: 'global',
          baseline_data: {
            timestamp: new Date().toISOString(),
            analysis,
            dataSummary,
          },
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'entity_type,entity_id'
        });

      if (insertError) {
        console.error('Failed to store anomaly baseline:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        ...analysis,
        timestamp: new Date().toISOString(),
        dataAnalyzed: {
          sessionsCount: dataSummary.totalSessions,
          uniqueUsers: dataSummary.uniqueUsers,
          suspiciousUsers: dataSummary.suspiciousUserCount,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-anomaly-detection:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        anomaliesDetected: 0,
        severityLevel: 'unknown'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});