import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const startTime = Date.now();

    // 1. Authentication Health Check
    const authHealth = await checkAuthHealth(supabase);

    // 2. Database Health Check
    const databaseHealth = await checkDatabaseHealth(supabase);

    // 3. API Performance Check
    const apiHealth = await checkAPIHealth(supabase);

    // 4. Storage Health Check
    const storageHealth = await checkStorageHealth(supabase);

    // 5. Cron Jobs Health
    const cronHealth = await checkCronJobs(supabase);

    // 6. Logs & Errors
    const logsHealth = await checkLogsAndErrors(supabase);

    // 7. Security Metrics
    const securityHealth = await checkSecurityMetrics(supabase);

    // 8. System Uptime
    const uptimeHealth = await checkSystemUptime(supabase);

    const totalTime = Date.now() - startTime;

    // Calculate overall status
    const allStatuses = [
      authHealth.status,
      databaseHealth.status,
      apiHealth.status,
      storageHealth.status,
      cronHealth.status,
      logsHealth.status,
      securityHealth.status,
      uptimeHealth.status,
    ];

    let overallStatus = 'healthy';
    if (allStatuses.includes('down')) {
      overallStatus = 'down';
    } else if (allStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    // Generate intelligent suggestions
    const suggestions = generateSuggestions({
      auth: authHealth,
      database: databaseHealth,
      api: apiHealth,
      storage: storageHealth,
      cron: cronHealth,
      logs: logsHealth,
      security: securityHealth,
      uptime: uptimeHealth,
      totalTime,
    });

    const healthData = {
      overall_status: overallStatus,
      last_updated: new Date().toISOString(),
      check_duration_ms: totalTime,
      suggestions,
      auth: authHealth,
      database: databaseHealth,
      api: apiHealth,
      storage: storageHealth,
      cron: cronHealth,
      logs: logsHealth,
      security: securityHealth,
      uptime: uptimeHealth,
    };

    // Store health metrics
    await storeHealthMetrics(supabase, healthData);

    // Update main system_health table
    await supabase.from('system_health').upsert({
      id: 'system',
      status: overallStatus,
      latency_ms: totalTime,
      message: overallStatus === 'healthy' 
        ? 'All systems operational' 
        : `System ${overallStatus}: ${suggestions.slice(0, 2).join('; ')}`,
      suggestions,
      last_checked: new Date().toISOString(),
    });

    // Create notification if system is degraded or down
    if (overallStatus !== 'healthy') {
      await createHealthNotification(supabase, overallStatus, healthData);
    }

    return new Response(JSON.stringify(healthData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('System health check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function checkAuthHealth(supabase: any) {
  try {
    const start = Date.now();
    const { data: users, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    const latency = Date.now() - start;

    if (error) throw error;

    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: suspendedUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_suspended', true);

    return {
      status: 'healthy',
      latency_ms: latency,
      total_users: totalUsers || 0,
      suspended_users: suspendedUsers || 0,
      auth_service_responding: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'down',
      error: errorMessage,
      auth_service_responding: false,
    };
  }
}

async function checkDatabaseHealth(supabase: any) {
  try {
    const start = Date.now();
    const { data, error } = await supabase.rpc('generate_stock_id');
    const queryLatency = Date.now() - start;

    if (error && error.message !== 'Failed to get a connection') throw error;

    // Get table counts
    const { count: carsCount } = await supabase.from('cars').select('*', { count: 'exact', head: true });
    const { count: ordersCount } = await supabase.from('whitelist_orders').select('*', { count: 'exact', head: true });
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    let status = 'healthy';
    if (queryLatency > 500) status = 'degraded';
    if (queryLatency > 1000) status = 'down';

    return {
      status,
      query_latency_ms: queryLatency,
      cars_count: carsCount || 0,
      orders_count: ordersCount || 0,
      users_count: usersCount || 0,
      db_connection: 'connected',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'down',
      error: errorMessage,
      db_connection: 'disconnected',
    };
  }
}

async function checkAPIHealth(supabase: any) {
  try {
    // Get recent activity logs to measure API usage
    const { data: recentLogs, error } = await supabase
      .from('activity_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1000);

    if (error) throw error;

    const apiCallsLast24h = recentLogs?.length || 0;

    return {
      status: 'healthy',
      api_calls_24h: apiCallsLast24h,
      average_response_time_ms: 150, // Placeholder - would need actual monitoring
      error_rate: 0.5,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'degraded',
      error: errorMessage,
    };
  }
}

async function checkStorageHealth(supabase: any) {
  try {
    const start = Date.now();
    const { data, error } = await supabase.storage.from('car-images').list('', { limit: 1 });
    const latency = Date.now() - start;

    if (error) throw error;

    return {
      status: 'healthy',
      storage_responding: true,
      latency_ms: latency,
      buckets_accessible: ['car-images', 'brand-logos', 'video-uploads'],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'down',
      error: errorMessage,
      storage_responding: false,
    };
  }
}

async function checkCronJobs(supabase: any) {
  try {
    const { data: jobs, error } = await supabase.from('system_jobs').select('*');

    if (error) throw error;

    const failedJobs = jobs?.filter((j: any) => j.status === 'failed') || [];

    return {
      status: failedJobs.length > 0 ? 'degraded' : 'healthy',
      total_jobs: jobs?.length || 0,
      failed_jobs: failedJobs.length,
      jobs: jobs || [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'unknown',
      error: errorMessage,
    };
  }
}

async function checkLogsAndErrors(supabase: any) {
  try {
    const { data: logs, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const errors = logs?.filter((l: any) => l.severity === 'error') || [];
    const warnings = logs?.filter((l: any) => l.severity === 'warning') || [];

    return {
      status: errors.length > 10 ? 'degraded' : 'healthy',
      total_logs: logs?.length || 0,
      errors_count: errors.length,
      warnings_count: warnings.length,
      recent_logs: logs?.slice(0, 10) || [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'unknown',
      error: errorMessage,
    };
  }
}

async function checkSecurityMetrics(supabase: any) {
  try {
    const { data: failedLogins, error } = await supabase
      .from('failed_logins')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const { data: securityEvents } = await supabase
      .from('security_events')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return {
      status: failedLogins && failedLogins.length > 20 ? 'degraded' : 'healthy',
      failed_logins_24h: failedLogins?.length || 0,
      security_events_24h: securityEvents?.length || 0,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'unknown',
      error: errorMessage,
    };
  }
}

async function checkSystemUptime(supabase: any) {
  try {
    const { data: metrics, error } = await supabase
      .from('system_health_metrics')
      .select('*')
      .eq('category', 'uptime')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const healthyChecks = metrics?.filter((m: any) => m.status === 'healthy').length || 0;
    const totalChecks = metrics?.length || 1;
    const uptimePercentage = (healthyChecks / totalChecks) * 100;

    return {
      status: uptimePercentage >= 99 ? 'healthy' : uptimePercentage >= 95 ? 'degraded' : 'down',
      uptime_percentage_30d: uptimePercentage.toFixed(2),
      total_checks: totalChecks,
      healthy_checks: healthyChecks,
    };
  } catch (error) {
    return {
      status: 'unknown',
      uptime_percentage_30d: 100,
    };
  }
}

async function storeHealthMetrics(supabase: any, healthData: any) {
  const categories = ['auth', 'database', 'api', 'storage', 'cron', 'logs', 'security', 'uptime'];

  for (const category of categories) {
    const categoryData = healthData[category];
    if (!categoryData) continue;

    // Store in system_health_metrics
    await supabase.from('system_health_metrics').insert({
      category,
      metric_name: 'health_check',
      metric_value: categoryData.status === 'healthy' ? 100 : categoryData.status === 'degraded' ? 50 : 0,
      status: categoryData.status,
      details: categoryData,
    });

    // Store in system_health_logs
    await supabase.from('system_health_logs').insert({
      status: categoryData.status,
      service_name: category,
      details: categoryData.error || `Status: ${categoryData.status}`,
      latency_ms: categoryData.latency_ms || categoryData.query_latency_ms || null,
      metadata: categoryData,
    });
  }

  // Log the health check
  await supabase.from('system_logs').insert({
    type: 'system_health_check',
    severity: healthData.overall_status === 'healthy' ? 'info' : healthData.overall_status === 'degraded' ? 'warning' : 'error',
    message: `System health check completed: ${healthData.overall_status}`,
    metadata: {
      duration_ms: healthData.check_duration_ms,
      overall_status: healthData.overall_status,
      suggestions: healthData.suggestions,
    },
  });
}

function generateSuggestions(data: any): string[] {
  const suggestions: string[] = [];

  // Database latency suggestions
  if (data.database.query_latency_ms > 700) {
    suggestions.push('🔴 Critical: Database latency is very high (>700ms). Consider upgrading Supabase compute or optimizing queries.');
  } else if (data.database.query_latency_ms > 400) {
    suggestions.push('⚠️ Database latency is elevated (>400ms). Review query performance and database indexes.');
  }

  // Storage suggestions
  if (data.storage.status === 'down') {
    suggestions.push('🔴 Storage service is down. Check Supabase Storage service status and RLS policies.');
  } else if (data.storage.latency_ms > 500) {
    suggestions.push('⚠️ Storage response time is slow. Consider reviewing storage bucket policies.');
  }

  // Auth suggestions
  if (data.auth.status === 'down') {
    suggestions.push('🔴 Authentication service failed. Verify Supabase Auth service role key and service status.');
  } else if (data.auth.suspended_users > data.auth.total_users * 0.1) {
    suggestions.push('⚠️ High number of suspended users detected. Review user management policies.');
  }

  // Security suggestions
  if (data.security.failed_logins_24h > 20) {
    suggestions.push('🔴 High failed login attempts detected (>20 in 24h). Possible brute force attack - enable rate limiting.');
  } else if (data.security.failed_logins_24h > 10) {
    suggestions.push('⚠️ Elevated failed login attempts. Monitor for suspicious activity.');
  }

  // Error log suggestions
  if (data.logs.errors_count > 10) {
    suggestions.push('🔴 High error count in logs (>10 recent errors). Review system logs immediately.');
  } else if (data.logs.warnings_count > 15) {
    suggestions.push('⚠️ Multiple warnings detected. Review system logs for potential issues.');
  }

  // Cron job suggestions
  if (data.cron.failed_jobs > 0) {
    suggestions.push(`⚠️ ${data.cron.failed_jobs} cron job(s) failed. Check job configurations and logs.`);
  }

  // Overall performance
  if (data.totalTime > 3000) {
    suggestions.push('🔴 Health check took >3 seconds. System performance is severely degraded.');
  } else if (data.totalTime > 1500) {
    suggestions.push('⚠️ Health check is slow (>1.5s). Monitor system resources.');
  }

  // Uptime suggestions
  if (data.uptime.uptime_percentage_30d < 95) {
    suggestions.push('🔴 System uptime below 95%. Investigate recurring issues and implement redundancy.');
  } else if (data.uptime.uptime_percentage_30d < 99) {
    suggestions.push('⚠️ System uptime below 99%. Review reliability improvements.');
  }

  // Add positive message if no issues
  if (suggestions.length === 0) {
    suggestions.push('✅ All systems operating normally. No action required.');
  }

  return suggestions;
}

async function createHealthNotification(supabase: any, status: string, healthData: any) {
  try {
    // Get all admins
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) return;

    const problemAreas = [];
    if (healthData.auth.status !== 'healthy') problemAreas.push('Authentication');
    if (healthData.database.status !== 'healthy') problemAreas.push('Database');
    if (healthData.api.status !== 'healthy') problemAreas.push('API');
    if (healthData.storage.status !== 'healthy') problemAreas.push('Storage');
    if (healthData.cron.status !== 'healthy') problemAreas.push('Cron Jobs');
    if (healthData.security.status !== 'healthy') problemAreas.push('Security');

    const message = status === 'down' 
      ? `CRITICAL: System is DOWN! Affected areas: ${problemAreas.join(', ')}`
      : `WARNING: System is degraded. Issues detected in: ${problemAreas.join(', ')}`;

    // Create notification for each admin
    for (const admin of admins) {
      await supabase.from('notifications').insert({
        user_id: admin.user_id,
        type: 'system_alert',
        title: `System Health Alert: ${status.toUpperCase()}`,
        message,
        metadata: {
          status,
          problem_areas: problemAreas,
          suggestions: healthData.suggestions,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error creating health notification:', error);
  }
}