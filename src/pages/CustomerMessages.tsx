import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";

const CustomerMessages = () => {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState({ subject: "", message: "" });
  const [showCompose, setShowCompose] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMessages(data);
      
      // Mark as read
      const unreadIds = data.filter(m => !m.is_read && m.receiver_id === user?.id).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadIds);
      }
    }
    
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.subject || !newMessage.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    // Get admin user
    const { data: adminData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (!adminData) {
      toast({
        title: "Error",
        description: "Unable to send message",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: adminData.user_id,
      subject: newMessage.subject,
      message: newMessage.message,
    });

    if (!error) {
      // Create notification for admin
      await supabase.from("notifications").insert({
        user_id: adminData.user_id,
        title: "New Message",
        message: `New message from customer: ${newMessage.subject}`,
        type: "message",
      });

      toast({
        title: "Success",
        description: "Message sent successfully",
      });
      setNewMessage({ subject: "", message: "" });
      setShowCompose(false);
      fetchMessages();
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/customer-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold">Messages</h1>
        </div>
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogTrigger asChild>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message to Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  placeholder="Message subject..."
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  placeholder="Your message..."
                  rows={5}
                />
              </div>
              <Button onClick={handleSendMessage} className="w-full">
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Your Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="glass p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{msg.subject}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(msg.created_at).toLocaleDateString()} at{" "}
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {msg.is_broadcast && (
                        <Badge variant="secondary">Broadcast</Badge>
                      )}
                      {msg.sender_id === user?.id ? (
                        <Badge variant="outline">Sent</Badge>
                      ) : (
                        <Badge>Received</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm mt-3">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerMessages;
