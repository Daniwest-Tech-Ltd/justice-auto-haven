import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { startDate, endDate, format = 'json' } = await req.json();
    
    console.log('Exporting security report:', { startDate, endDate, format });

    // Fetch security events
    const { data: events, error: eventsError } = await supabaseClient
      .from('security_events')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    // Fetch blocked IPs
    const { data: blockedIps, error: ipsError } = await supabaseClient
      .from('blocked_ips')
      .select('*')
      .gte('blocked_at', startDate)
      .lte('blocked_at', endDate);

    if (ipsError) throw ipsError;

    // Calculate statistics
    const stats = {
      totalEvents: events?.length || 0,
      criticalEvents: events?.filter(e => e.severity === 'critical').length || 0,
      highEvents: events?.filter(e => e.severity === 'high').length || 0,
      mediumEvents: events?.filter(e => e.severity === 'medium').length || 0,
      lowEvents: events?.filter(e => e.severity === 'low').length || 0,
      acknowledgedEvents: events?.filter(e => e.acknowledged).length || 0,
      blockedIpsCount: blockedIps?.length || 0,
      eventsByType: {} as { [key: string]: number }
    };

    events?.forEach(event => {
      stats.eventsByType[event.event_type] = (stats.eventsByType[event.event_type] || 0) + 1;
    });

    const report = {
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      statistics: stats,
      events,
      blockedIps,
    };

    if (format === 'csv') {
      // Generate CSV format
      let csv = 'Security Events Report\n\n';
      csv += `Generated: ${new Date().toLocaleString()}\n`;
      csv += `Period: ${startDate} to ${endDate}\n\n`;
      
      csv += 'Summary Statistics\n';
      csv += `Total Events,${stats.totalEvents}\n`;
      csv += `Critical,${stats.criticalEvents}\n`;
      csv += `High,${stats.highEvents}\n`;
      csv += `Medium,${stats.mediumEvents}\n`;
      csv += `Low,${stats.lowEvents}\n`;
      csv += `Acknowledged,${stats.acknowledgedEvents}\n`;
      csv += `Blocked IPs,${stats.blockedIpsCount}\n\n`;
      
      csv += 'Event Details\n';
      csv += 'Timestamp,Severity,Type,Title,Description,Source IP,User ID,Acknowledged\n';
      
      events?.forEach(event => {
        csv += `${event.created_at},${event.severity},${event.event_type},"${event.title}","${event.description || ''}",${event.source_ip || ''},${event.user_id || ''},${event.acknowledged}\n`;
      });

      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="security-report-${startDate}-to-${endDate}.csv"`
        }
      });
    }

    // Return JSON by default
    return new Response(
      JSON.stringify(report, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="security-report-${startDate}-to-${endDate}.json"`
        }
      }
    );
  } catch (error: any) {
    console.error('Error exporting security report:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
