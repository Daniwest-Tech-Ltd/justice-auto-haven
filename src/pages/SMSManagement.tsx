import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, RefreshCw, MessageSquare, Settings, History, Phone, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface SMSSettings {
  id: string;
  sms_enabled: boolean;
  sandbox_mode: boolean;
  sender_name: string;
  otp_expiry_minutes: number;
  notify_on_new_order: boolean;
  notify_on_new_lead: boolean;
  notify_on_registration: boolean;
  admin_phone: string | null;
}

interface SMSLog {
  id: string;
  phone: string;
  message: string;
  sms_type: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

const SMSManagement = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SMSSettings | null>(null);
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("sms_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching SMS settings:", error);
      toast.error("Failed to load SMS settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("sms_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching SMS logs:", error);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("sms_settings")
        .update({
          sms_enabled: settings.sms_enabled,
          sandbox_mode: settings.sandbox_mode,
          sender_name: settings.sender_name,
          otp_expiry_minutes: settings.otp_expiry_minutes,
          notify_on_new_order: settings.notify_on_new_order,
          notify_on_new_lead: settings.notify_on_new_lead,
          notify_on_registration: settings.notify_on_registration,
          admin_phone: settings.admin_phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("SMS settings saved successfully");
    } catch (error) {
      console.error("Error saving SMS settings:", error);
      toast.error("Failed to save SMS settings");
    } finally {
      setSaving(false);
    }
  };

  const sendTestSMS = async () => {
    if (!testPhone) {
      toast.error("Please enter a phone number");
      return;
    }

    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: {
          phone: testPhone,
          message: "This is a test SMS from Justice Ultimate Automobiles SMS system. If you received this, SMS is working correctly!",
          sms_type: "test",
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Test SMS sent successfully!");
        fetchLogs();
      } else {
        toast.error(data.error || "Failed to send test SMS");
      }
    } catch (error: any) {
      console.error("Error sending test SMS:", error);
      toast.error(error.message || "Failed to send test SMS");
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500">Sent</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSMSTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      otp: "bg-blue-500",
      order_confirmation: "bg-purple-500",
      registration: "bg-green-500",
      password_reset: "bg-orange-500",
      staff_alert: "bg-red-500",
      test: "bg-gray-500",
      general: "bg-slate-500",
    };

    return (
      <Badge className={colors[type] || "bg-slate-500"}>
        {type.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              SMS Management
            </h1>
            <p className="text-muted-foreground">Configure SMS notifications using Brevo SMS API</p>
          </div>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Test SMS
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure SMS system behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms_enabled">Enable SMS</Label>
                      <p className="text-sm text-muted-foreground">Turn SMS notifications on/off</p>
                    </div>
                    <Switch
                      id="sms_enabled"
                      checked={settings?.sms_enabled || false}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => (prev ? { ...prev, sms_enabled: checked } : null))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sandbox_mode">Sandbox Mode</Label>
                      <p className="text-sm text-muted-foreground">Test without sending real SMS</p>
                    </div>
                    <Switch
                      id="sandbox_mode"
                      checked={settings?.sandbox_mode || false}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => (prev ? { ...prev, sandbox_mode: checked } : null))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sender_name">Sender Name</Label>
                    <Input
                      id="sender_name"
                      value={settings?.sender_name || ""}
                      onChange={(e) =>
                        setSettings((prev) => (prev ? { ...prev, sender_name: e.target.value } : null))
                      }
                      maxLength={11}
                      placeholder="JUA_AUTOS"
                    />
                    <p className="text-xs text-muted-foreground">Max 11 characters, no spaces</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp_expiry">OTP Expiry (minutes)</Label>
                    <Input
                      id="otp_expiry"
                      type="number"
                      min={1}
                      max={30}
                      value={settings?.otp_expiry_minutes || 5}
                      onChange={(e) =>
                        setSettings((prev) =>
                          prev ? { ...prev, otp_expiry_minutes: parseInt(e.target.value) || 5 } : null
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_phone">Admin Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin_phone"
                        value={settings?.admin_phone || ""}
                        onChange={(e) =>
                          setSettings((prev) => (prev ? { ...prev, admin_phone: e.target.value } : null))
                        }
                        placeholder="0722827458"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Receives staff alerts and notifications</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Triggers</CardTitle>
                  <CardDescription>Choose when to send SMS notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Orders</Label>
                      <p className="text-sm text-muted-foreground">SMS on new purchase/rental/trade-in</p>
                    </div>
                    <Switch
                      checked={settings?.notify_on_new_order || false}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => (prev ? { ...prev, notify_on_new_order: checked } : null))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Leads</Label>
                      <p className="text-sm text-muted-foreground">SMS when contact form submitted</p>
                    </div>
                    <Switch
                      checked={settings?.notify_on_new_lead || false}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => (prev ? { ...prev, notify_on_new_lead: checked } : null))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Registrations</Label>
                      <p className="text-sm text-muted-foreground">Welcome SMS to new customers</p>
                    </div>
                    <Switch
                      checked={settings?.notify_on_registration || false}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => (prev ? { ...prev, notify_on_registration: checked } : null))
                      }
                    />
                  </div>

                  <Button onClick={saveSettings} disabled={saving} className="w-full mt-4">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Send Test SMS</CardTitle>
                <CardDescription>Test your SMS configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test_phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="test_phone"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="0722827458"
                      className="max-w-xs"
                    />
                    <Button onClick={sendTestSMS} disabled={sendingTest}>
                      {sendingTest ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Test SMS
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter a Kenyan phone number (e.g., 0722827458 or 722827458)
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Test Message Preview:</p>
                  <p className="text-sm text-muted-foreground">
                    "This is a test SMS from Justice Ultimate Automobiles SMS system. If you received this,
                    SMS is working correctly!"
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>SMS Logs</CardTitle>
                  <CardDescription>View sent and failed SMS messages</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLogs}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No SMS logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(log.created_at), "MMM d, HH:mm")}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{log.phone}</TableCell>
                            <TableCell>{getSMSTypeBadge(log.sms_type)}</TableCell>
                            <TableCell className="max-w-xs truncate" title={log.message}>
                              {log.message}
                            </TableCell>
                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SMSManagement;
