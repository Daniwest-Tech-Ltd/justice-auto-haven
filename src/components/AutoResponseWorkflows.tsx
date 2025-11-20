import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Zap, Plus, Play, Pause, Trash, Edit, CheckCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger_conditions: any;
  actions: any;
  execution_count: number;
  success_count: number;
  failure_count: number;
  last_executed: string;
}

export const AutoResponseWorkflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    trigger_type: "severity",
    trigger_value: "critical",
    action_type: "block_ip",
    enabled: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadWorkflows();
    subscribeToExecutions();
  }, []);

  const loadWorkflows = async () => {
    const { data, error } = await supabase
      .from("security_playbooks")
      .select("*")
      .order("name");

    if (data) setWorkflows(data);
    if (error) console.error("Error loading workflows:", error);
  };

  const subscribeToExecutions = () => {
    const channel = supabase
      .channel("workflow-executions")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "security_playbooks"
      }, (payload) => {
        setWorkflows(prev => prev.map(w => 
          w.id === payload.new.id ? payload.new as Workflow : w
        ));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createWorkflow = async () => {
    const { data: user } = await supabase.auth.getUser();
    
    const workflow = {
      name: newWorkflow.name,
      description: newWorkflow.description,
      enabled: newWorkflow.enabled,
      trigger_conditions: {
        type: newWorkflow.trigger_type,
        value: newWorkflow.trigger_value
      },
      actions: {
        type: newWorkflow.action_type,
        steps: getActionSteps(newWorkflow.action_type)
      },
      created_by: user.user?.id
    };

    const { error } = await supabase
      .from("security_playbooks")
      .insert(workflow);

    if (!error) {
      toast({ title: "Workflow created successfully" });
      setIsCreating(false);
      setNewWorkflow({
        name: "",
        description: "",
        trigger_type: "severity",
        trigger_value: "critical",
        action_type: "block_ip",
        enabled: true
      });
      loadWorkflows();
    } else {
      toast({ title: "Error", description: "Failed to create workflow", variant: "destructive" });
    }
  };

  const getActionSteps = (actionType: string) => {
    const steps: Record<string, string[]> = {
      block_ip: [
        "Extract source IP from event",
        "Add IP to blocked_ips table",
        "Update firewall rules",
        "Log blocking action",
        "Send notification to admins"
      ],
      suspend_user: [
        "Identify user from event",
        "Update user profile to suspended",
        "Terminate active sessions",
        "Send suspension notification",
        "Log suspension action"
      ],
      increase_monitoring: [
        "Identify affected resources",
        "Enable detailed logging",
        "Increase check frequency",
        "Alert security team",
        "Monitor for 24 hours"
      ],
      create_incident: [
        "Generate incident number",
        "Create incident record",
        "Assign to security team",
        "Gather forensic data",
        "Send incident report"
      ]
    };
    return steps[actionType] || [];
  };

  const toggleWorkflow = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from("security_playbooks")
      .update({ enabled: !enabled })
      .eq("id", id);

    if (!error) {
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, enabled: !enabled } : w));
      toast({ title: `Workflow ${!enabled ? "enabled" : "disabled"}` });
    }
  };

  const deleteWorkflow = async (id: string) => {
    const { error } = await supabase
      .from("security_playbooks")
      .delete()
      .eq("id", id);

    if (!error) {
      setWorkflows(prev => prev.filter(w => w.id !== id));
      toast({ title: "Workflow deleted" });
    }
  };

  const getSuccessRate = (workflow: Workflow) => {
    if (workflow.execution_count === 0) return 0;
    return ((workflow.success_count / workflow.execution_count) * 100).toFixed(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Auto-Response Workflows
            </CardTitle>
            <CardDescription>Automated security incident response and mitigation</CardDescription>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Auto-Response Workflow</DialogTitle>
                <DialogDescription>
                  Define automated actions to respond to security events
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Workflow Name</label>
                  <Input
                    placeholder="e.g., Block Suspicious IPs"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe what this workflow does..."
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Trigger Type</label>
                    <Select
                      value={newWorkflow.trigger_type}
                      onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="severity">Severity Level</SelectItem>
                        <SelectItem value="event_type">Event Type</SelectItem>
                        <SelectItem value="failed_logins">Failed Login Attempts</SelectItem>
                        <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Trigger Value</label>
                    <Select
                      value={newWorkflow.trigger_value}
                      onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger_value: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto-Response Action</label>
                  <Select
                    value={newWorkflow.action_type}
                    onValueChange={(value) => setNewWorkflow({ ...newWorkflow, action_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block_ip">Block IP Address</SelectItem>
                      <SelectItem value="suspend_user">Suspend User Account</SelectItem>
                      <SelectItem value="increase_monitoring">Increase Monitoring</SelectItem>
                      <SelectItem value="create_incident">Create Security Incident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={newWorkflow.enabled}
                    onCheckedChange={(checked) => setNewWorkflow({ ...newWorkflow, enabled: checked })}
                  />
                  <label className="text-sm">Enable workflow immediately</label>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={createWorkflow} className="flex-1" disabled={!newWorkflow.name}>
                    Create Workflow
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          {workflow.enabled ? (
                            <Badge variant="default">
                              <Play className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Pause className="h-3 w-3 mr-1" />
                              Paused
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Switch
                          checked={workflow.enabled}
                          onCheckedChange={() => toggleWorkflow(workflow.id, workflow.enabled)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteWorkflow(workflow.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold">{workflow.execution_count}</div>
                        <div className="text-xs text-muted-foreground">Executions</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-green-500">{workflow.success_count}</div>
                        <div className="text-xs text-muted-foreground">Successful</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-red-500">{workflow.failure_count}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold">{getSuccessRate(workflow)}%</div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                    </div>

                    {workflow.last_executed && (
                      <div className="text-xs text-muted-foreground">
                        Last executed: {new Date(workflow.last_executed).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
