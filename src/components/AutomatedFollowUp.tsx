import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Clock, Send } from "lucide-react";

interface FollowUpRule {
  id: string;
  enabled: boolean;
  days_after: number;
  status_filter: string;
  template_id: string;
  created_at: string;
}

export const AutomatedFollowUp = () => {
  const [rules, setRules] = useState<FollowUpRule[]>([]);
  const [newRule, setNewRule] = useState({
    enabled: true,
    days_after: 3,
    status_filter: "pending",
    template_id: ""
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const { data, error } = await supabase
      .from("followup_rules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rules:", error);
      return;
    }
    setRules(data || []);
  };

  const handleCreateRule = async () => {
    const { error } = await supabase
      .from("followup_rules")
      .insert([newRule]);

    if (error) {
      toast.error("Failed to create follow-up rule");
      return;
    }

    toast.success("Follow-up rule created successfully");
    setNewRule({
      enabled: true,
      days_after: 3,
      status_filter: "pending",
      template_id: ""
    });
    fetchRules();
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from("followup_rules")
      .update({ enabled })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update rule");
      return;
    }

    toast.success(`Rule ${enabled ? "enabled" : "disabled"}`);
    fetchRules();
  };

  const handleDeleteRule = async (id: string) => {
    const { error } = await supabase
      .from("followup_rules")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete rule");
      return;
    }

    toast.success("Rule deleted successfully");
    fetchRules();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Automated Follow-up System
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Create New Rule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Days After Submission</label>
                  <Input
                    type="number"
                    value={newRule.days_after}
                    onChange={(e) => setNewRule({ ...newRule, days_after: parseInt(e.target.value) })}
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Order Status</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={newRule.status_filter}
                    onChange={(e) => setNewRule({ ...newRule, status_filter: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="contacted">Contacted</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleCreateRule} className="mt-4">
                <Send className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="font-semibold">Active Rules</h3>
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        Follow up after {rule.days_after} days for {rule.status_filter} orders
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(rule.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
