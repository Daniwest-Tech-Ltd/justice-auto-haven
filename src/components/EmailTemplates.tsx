import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Plus, Edit, Trash2 } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_type: string;
  created_at: string;
}

export const EmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    template_type: "order_confirmation"
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch templates");
      return;
    }
    setTemplates(data || []);
  };

  const handleSave = async () => {
    if (editingTemplate) {
      const { error } = await supabase
        .from("email_templates")
        .update(formData)
        .eq("id", editingTemplate.id);

      if (error) {
        toast.error("Failed to update template");
        return;
      }
      toast.success("Template updated successfully");
    } else {
      const { error } = await supabase
        .from("email_templates")
        .insert([formData]);

      if (error) {
        toast.error("Failed to create template");
        return;
      }
      toast.success("Template created successfully");
    }

    setIsDialogOpen(false);
    setEditingTemplate(null);
    setFormData({ name: "", subject: "", body: "", template_type: "order_confirmation" });
    fetchTemplates();
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      template_type: template.template_type
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete template");
      return;
    }
    toast.success("Template deleted successfully");
    fetchTemplates();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Templates
        </CardTitle>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{template.body}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Order Confirmation"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Template Type</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formData.template_type}
                  onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                >
                  <option value="order_confirmation">Order Confirmation</option>
                  <option value="status_update">Status Update</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Body (Use {"{{"} name {"}},"} {"{{"} car {"}},"} {"{{"} price {"}}}"} as placeholders)</label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Email body with placeholders"
                  rows={10}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
