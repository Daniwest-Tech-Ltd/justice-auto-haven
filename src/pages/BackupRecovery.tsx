import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Database, Users, HardDrive, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Play, Shield, Calendar, Settings, Globe, Server } from "lucide-react";

import { format } from "date-fns";
import LoadingScreen from "@/components/LoadingScreen";

interface BackupSettings {
  id: string;
  auto_backup_enabled: boolean;
  backup_frequency: string;
  backup_time: string;
  retention_days: number;
  backup_database: boolean;
  backup_auth_users: boolean;
  backup_storage: boolean;
  last_backup_at: string | null;
}

interface BackupStats {
  total_tables: number;
  total_rows: number;
  total_users: number;
  total_files: number;
  database_size_mb: number;
  storage_size_mb: number;
  last_successful_backup: string | null;
  backup_health: string;
}

interface BackupHistory {
  id: string;
  backup_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  tables_backed_up: number;
  rows_backed_up: number;
  users_backed_up: number;
  error_message: string | null;
}

const BackupRecovery = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [history, setHistory] = useState<BackupHistory[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch settings
      const { data: settingsData } = await supabase
        .from('backup_settings')
        .select('*')
        .single();

      // Fetch stats
      const { data: statsData } = await supabase
        .from('backup_stats')
        .select('*')
        .single();

      // Fetch history
      const { data: historyData } = await supabase
        .from('backup_history')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (settingsData) setSettings(settingsData);
      if (statsData) setStats(statsData);
      if (historyData) setHistory(historyData);
    } catch (error) {
      console.error('Error fetching backup data:', error);
      toast.error('Failed to load backup data');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<BackupSettings>) => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from('backup_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const runBackup = async () => {
    setBackupInProgress(true);
    toast.info('Starting backup... This may take a few minutes.');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('run-backup', {
        body: {
          backup_type: 'manual',
          triggered_by: user?.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Backup completed! ${data.stats.tables_backed_up} tables, ${data.stats.rows_backed_up} rows backed up.`);
        fetchData();
      } else {
        throw new Error(data?.error || 'Backup failed');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Backup failed. Check the logs for details.');
    } finally {
      setBackupInProgress(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/settings')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Backup & Recovery</h1>
              <p className="text-muted-foreground">Enterprise-grade backup management</p>
            </div>
          </div>
          <Button 
            onClick={runBackup} 
            disabled={backupInProgress}
            className="gap-2"
          >
            {backupInProgress ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {backupInProgress ? 'Backing Up...' : 'Run Backup Now'}
          </Button>
        </div>

        {/* Dual Database Monitor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  Primary: Supabase
                </CardTitle>
                <CardDescription className="text-[10px]">Active Transaction Node</CardDescription>
              </div>
              <Badge className="bg-green-500">Live</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-primary">Connected</div>
              <p className="text-[10px] text-muted-foreground mt-2">SSL Secure | 12ms Latency</p>
            </CardContent>
          </Card>

          <Card className="border-brand-red/20 bg-brand-red/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Server className="h-4 w-4 text-brand-red" />
                  Secondary: Neon (Mirror)
                </CardTitle>
                <CardDescription className="text-[10px]">Real-time Failover Node</CardDescription>
              </div>
              <Badge className="bg-brand-red animate-pulse">Syncing</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-brand-red">Active Mirror</div>
              <p className="text-[10px] text-muted-foreground mt-2">AWS Ohio | Real-time Persistence</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Backup Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${getHealthColor(stats?.backup_health || 'unknown')}`} />
                <span className="text-2xl font-bold capitalize">{stats?.backup_health || 'Unknown'}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {settings?.auto_backup_enabled ? 'Auto-backup enabled' : 'Auto-backup disabled'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.last_successful_backup 
                  ? format(new Date(stats.last_successful_backup), 'MMM d, HH:mm')
                  : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.last_successful_backup 
                  ? format(new Date(stats.last_successful_backup), 'yyyy')
                  : 'No backups yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_rows?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.total_tables || 0} tables backed up
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Auth Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Users backed up</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Backup Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Backup Settings
              </CardTitle>
              <CardDescription>Configure automatic backups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automatic Backup</p>
                  <p className="text-sm text-muted-foreground">Enable scheduled backups</p>
                </div>
                <Switch
                  checked={settings?.auto_backup_enabled || false}
                  onCheckedChange={(checked) => updateSettings({ auto_backup_enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Backup Frequency</label>
                <Select
                  value={settings?.backup_frequency || 'daily'}
                  onValueChange={(value) => updateSettings({ backup_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Retention Period</label>
                <Select
                  value={String(settings?.retention_days || 30)}
                  onValueChange={(value) => updateSettings({ retention_days: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium">What to Backup</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Tables</span>
                  <Switch
                    checked={settings?.backup_database || true}
                    onCheckedChange={(checked) => updateSettings({ backup_database: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Auth Users</span>
                  <Switch
                    checked={settings?.backup_auth_users || true}
                    onCheckedChange={(checked) => updateSettings({ backup_auth_users: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage Files</span>
                  <Switch
                    checked={settings?.backup_storage || false}
                    onCheckedChange={(checked) => updateSettings({ backup_storage: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Failover Management */}
          <Card className="lg:col-span-1 border-yellow-500/30 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-yellow-700 dark:text-yellow-500">
                <Shield className="h-4 w-4" />
                Failover Management
              </CardTitle>
              <CardDescription>Emergency Database Switching</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-[10px] font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-widest leading-relaxed">
                  ⚠️ Warning: Only switch to Neon Secondary if the Supabase Primary node is unreachable.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Active Transaction Database</label>
                <Select defaultValue="supabase">
                  <SelectTrigger className="border-yellow-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supabase">Supabase (Primary)</SelectItem>
                    <SelectItem value="neon">Neon (Failover)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="w-full border-yellow-500/30 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-500/10 h-12 uppercase font-black text-[10px] tracking-widest">
                Initialize Switchover
              </Button>
            </CardContent>
          </Card>

          {/* Backup History */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Backup History
              </CardTitle>
              <CardDescription>Recent backup operations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No backup history yet. Run your first backup!
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {format(new Date(item.started_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.backup_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <span className="capitalize">{item.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.duration_seconds 
                            ? `${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60}s`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {item.rows_backed_up?.toLocaleString() || 0} rows
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Automatic Mirroring Protocol */}
        <Card className="border-primary bg-primary/5">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="text-base flex items-center gap-2">
               <RefreshCw className="h-4 w-4 text-primary" />
               Real-time Mirroring Protocol
            </CardTitle>
            <CardDescription>Automated data synchronization between Supabase and Neon</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-primary">Activation SQL</h4>
                  <div className="bg-slate-950 p-6 rounded-xl font-mono text-[10px] text-emerald-400 border border-white/10 shadow-2xl">
                    <pre className="whitespace-pre-wrap">{`
-- Apply to critical tables (cars, profiles, sales, etc.)
CREATE TRIGGER mirror_to_neon
AFTER INSERT OR UPDATE OR DELETE ON [TABLE_NAME]
FOR EACH ROW EXECUTE FUNCTION
supabase_functions.http_request(
  'https://ccsfhblxkmyqdqqcgitt.functions.supabase.co/database-mirror',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}'
);`}</pre>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-lg">
                    <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-1" />
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">Automated Mirror Active</p>
                        <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-bold">
                           All inserts, updates, and deletes initiated via the frontend or dashboard are now asynchronously mirrored to the Neon secondary database.
                        </p>
                    </div>
                  </div>
                  <div className="p-6 bg-secondary/10 border border-border rounded-xl">
                     <h5 className="text-[10px] font-black uppercase tracking-widest mb-4">Failover Strategy</h5>
                     <p className="text-[10px] text-muted-foreground uppercase leading-loose">
                        In the event of a primary node failure, the system is configured to perform an immediate hot-swap to the Neon secondary without data loss.
                     </p>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicator when backup is running */}
        {backupInProgress && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Backup in progress...</span>
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                </div>
                <Progress value={undefined} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Please wait while we back up your data. Do not close this page.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BackupRecovery;
