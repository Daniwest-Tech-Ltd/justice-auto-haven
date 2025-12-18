import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let backupId: string | null = null;

  try {
    // Initialize main Supabase client
    const mainUrl = Deno.env.get('SUPABASE_URL')!;
    const mainServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const main = createClient(mainUrl, mainServiceKey);

    // Initialize backup Supabase client
    const backupUrl = Deno.env.get('SUPABASE_BACKUP_URL');
    const backupServiceKey = Deno.env.get('SUPABASE_BACKUP_SERVICE_ROLE_KEY');

    if (!backupUrl || !backupServiceKey) {
      throw new Error('Backup project credentials not configured');
    }

    const backup = createClient(backupUrl, backupServiceKey);

    // Get request body
    const { backup_type = 'manual', triggered_by } = await req.json().catch(() => ({}));

    // Create backup history record
    const { data: historyRecord, error: historyError } = await main
      .from('backup_history')
      .insert({
        backup_type,
        status: 'in_progress',
        triggered_by,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (historyError) {
      console.error('Failed to create backup history:', historyError);
    } else {
      backupId = historyRecord.id;
    }

    // Tables to backup
    const tables = [
      'profiles', 'cars', 'sales', 'messages', 'reviews', 'trade_ins',
      'rental_cars', 'rental_bookings', 'orders', 'notifications',
      'blogs', 'brands', 'staff', 'attendance', 'job_cards', 'crm_leads',
      'crm_interactions', 'badges', 'wishlists', 'car_comparisons'
    ];

    let tablesBackedUp = 0;
    let totalRowsBackedUp = 0;
    let usersBackedUp = 0;
    let filesBackedUp = 0;

    console.log('Starting database backup...');

    // Backup each table
    for (const table of tables) {
      try {
        const { data, error } = await main.from(table).select('*');
        
        if (error) {
          console.log(`Table ${table} not found or error:`, error.message);
          continue;
        }

        if (data && data.length > 0) {
          // Try to delete existing data in backup
          await backup.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          
          // Insert new data
          const { error: insertError } = await backup.from(table).insert(data);
          
          if (insertError) {
            console.log(`Failed to backup table ${table}:`, insertError.message);
          } else {
            tablesBackedUp++;
            totalRowsBackedUp += data.length;
            console.log(`Backed up ${data.length} rows from ${table}`);
          }
        }
      } catch (tableError) {
        console.log(`Error backing up table ${table}:`, tableError);
      }
    }

    // Backup auth users
    console.log('Starting auth users backup...');
    try {
      const { data: authData, error: authError } = await main.auth.admin.listUsers();
      
      if (!authError && authData?.users) {
        const usersToBackup = authData.users.map(u => ({
          id: u.id,
          email: u.email,
          phone: u.phone,
          user_metadata: u.user_metadata,
          app_metadata: u.app_metadata,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at
        }));

        // Try to backup to backup_auth_users table
        await backup.from('backup_auth_users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error: userInsertError } = await backup.from('backup_auth_users').insert(usersToBackup);
        
        if (!userInsertError) {
          usersBackedUp = usersToBackup.length;
          console.log(`Backed up ${usersBackedUp} auth users`);
        }
      }
    } catch (authBackupError) {
      console.log('Auth backup error:', authBackupError);
    }

    // Calculate duration
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    // Update backup history
    if (backupId) {
      await main.from('backup_history').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        tables_backed_up: tablesBackedUp,
        rows_backed_up: totalRowsBackedUp,
        users_backed_up: usersBackedUp,
        files_backed_up: filesBackedUp
      }).eq('id', backupId);
    }

    // Update backup settings with last backup time
    await main.from('backup_settings').update({
      last_backup_at: new Date().toISOString()
    }).neq('id', '00000000-0000-0000-0000-000000000000');

    // Update backup stats
    await main.from('backup_stats').update({
      total_tables: tablesBackedUp,
      total_rows: totalRowsBackedUp,
      total_users: usersBackedUp,
      last_successful_backup: new Date().toISOString(),
      backup_health: 'healthy',
      updated_at: new Date().toISOString()
    }).neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Backup completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Backup completed successfully',
      stats: {
        tables_backed_up: tablesBackedUp,
        rows_backed_up: totalRowsBackedUp,
        users_backed_up: usersBackedUp,
        duration_seconds: durationSeconds
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Backup failed:', error);

    // Update backup history with failure
    if (backupId) {
      const mainUrl = Deno.env.get('SUPABASE_URL')!;
      const mainServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const main = createClient(mainUrl, mainServiceKey);

      await main.from('backup_history').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round((Date.now() - startTime) / 1000),
        error_message: String(error)
      }).eq('id', backupId);

      await main.from('backup_stats').update({
        backup_health: 'failed',
        updated_at: new Date().toISOString()
      }).neq('id', '00000000-0000-0000-0000-000000000000');
    }

    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
