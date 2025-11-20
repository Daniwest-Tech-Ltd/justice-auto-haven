import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Clock, 
  AlertTriangle, 
  Shield, 
  Database, 
  FileText,
  Download,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TimelineEvent {
  id: string;
  incident_id: string;
  timestamp: string;
  event_type: string;
  description: string;
  evidence: any;
  forensic_data: any;
  is_critical: boolean;
  performed_by: string | null;
}

interface IncidentTimelineProps {
  incidentId: string;
}

export const IncidentTimeline = ({ incidentId }: IncidentTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    event_type: "",
    description: "",
    evidence: {},
    forensic_data: {},
    is_critical: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTimeline();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('incident-timeline')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_timeline',
          filter: `incident_id=eq.${incidentId}`
        },
        () => {
          fetchTimeline();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [incidentId]);

  const fetchTimeline = async () => {
    try {
      const { data, error } = await supabase
        .from("incident_timeline")
        .select("*")
        .eq("incident_id", incidentId)
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("incident_timeline")
        .insert({
          incident_id: incidentId,
          ...newEvent,
          performed_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timeline event added successfully",
      });

      setNewEvent({
        event_type: "",
        description: "",
        evidence: {},
        forensic_data: {},
        is_critical: false
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportTimeline = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incident-${incidentId}-timeline.json`;
    link.click();
  };

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'detection': return <AlertTriangle className="h-4 w-4" />;
      case 'response': return <Shield className="h-4 w-4" />;
      case 'forensics': return <Database className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Incident Response Timeline</CardTitle>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Timeline Event</DialogTitle>
                <DialogDescription>
                  Document incident response actions and forensic findings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Event Type</label>
                  <Select
                    value={newEvent.event_type}
                    onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detection">Detection</SelectItem>
                      <SelectItem value="response">Response Action</SelectItem>
                      <SelectItem value="forensics">Forensic Analysis</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="mitigation">Mitigation</SelectItem>
                      <SelectItem value="evidence">Evidence Collection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Describe the event in detail..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newEvent.is_critical}
                    onChange={(e) => setNewEvent({ ...newEvent, is_critical: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label className="text-sm">Mark as critical event</label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addEvent}>Add Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button size="sm" variant="outline" onClick={exportTimeline}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={event.id}
              className={`relative pl-8 pb-8 ${
                index === events.length - 1 ? 'pb-0' : 'border-l-2 border-border'
              }`}
            >
              <div
                className={`absolute left-0 top-0 -translate-x-1/2 rounded-full p-2 ${
                  event.is_critical
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {getEventIcon(event.event_type)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={event.is_critical ? "destructive" : "default"}>
                    {event.event_type}
                  </Badge>
                  {event.is_critical && (
                    <Badge variant="outline">Critical</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-sm">{event.description}</p>
                
                {Object.keys(event.evidence || {}).length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Evidence Details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(event.evidence, null, 2)}
                    </pre>
                  </details>
                )}
                
                {Object.keys(event.forensic_data || {}).length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Forensic Data
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(event.forensic_data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
          
          {events.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No timeline events recorded yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};