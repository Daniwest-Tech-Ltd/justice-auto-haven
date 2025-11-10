import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Mail, MessageSquare } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

const AdminMessages = () => {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [contactSubmissions, setContactSubmissions] = useState<any[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState({ subject: "", message: "" });
  const [replyMessage, setReplyMessage] = useState({ id: "", reply: "" });
  const [showBroadcast, setShowBroadcast] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [messagesData, contactData] = await Promise.all([
      supabase.from("messages").select("*, sender:profiles!messages_sender_id_fkey(full_name, email)").order("created_at", { ascending: false }),
      supabase.from("contact_submissions").select("*").order("created_at", { ascending: false })
    ]);

    if (messagesData.data) setMessages(messagesData.data);
    if (contactData.data) setContactSubmissions(contactData.data);
    
    setLoading(false);
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.subject || !broadcastMessage.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: allUsers } = await supabase.from("profiles").select("user_id");
    
    if (allUsers) {
      const broadcasts = allUsers.map(u => ({
        sender_id: user.id,
        receiver_id: u.user_id,
        subject: broadcastMessage.subject,
        message: broadcastMessage.message,
        is_broadcast: true,
      }));

      const { error } = await supabase.from("messages").insert(broadcasts);

      if (!error) {
        toast({
          title: "Success",
          description: `Broadcast sent to ${allUsers.length} users`,
        });
        setBroadcastMessage({ subject: "", message: "" });
        setShowBroadcast(false);
        fetchData();

        // Create notifications
        const notifications = allUsers.map(u => ({
          user_id: u.user_id,
          title: "New Broadcast Message",
          message: broadcastMessage.subject,
          type: "message",
        }));
        await supabase.from("notifications").insert(notifications);
      }
    }
  };

  const handleReplyToContact = async (submissionId: string, reply: string) => {
    const { error } = await supabase
      .from("contact_submissions")
      .update({ admin_reply: reply, status: "replied" })
      .eq("id", submissionId);

    if (!error) {
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      fetchData();
      setReplyMessage({ id: "", reply: "" });
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-4xl font-bold">Messages & Communications</h1>
      </div>

      {/* Broadcast Button */}
      <div className="mb-6">
        <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Send className="mr-2 h-4 w-4" />
              Broadcast Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Broadcast to All Customers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={broadcastMessage.subject}
                  onChange={(e) => setBroadcastMessage({ ...broadcastMessage, subject: e.target.value })}
                  placeholder="Message subject..."
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={broadcastMessage.message}
                  onChange={(e) => setBroadcastMessage({ ...broadcastMessage, message: e.target.value })}
                  placeholder="Your message..."
                  rows={5}
                />
              </div>
              <Button onClick={handleBroadcast} className="w-full">
                Send Broadcast
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contact Form Submissions */}
      <Card className="glass-strong mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Form Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contactSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.name}</TableCell>
                  <TableCell>{submission.email}</TableCell>
                  <TableCell>{submission.subject}</TableCell>
                  <TableCell>
                    <Badge variant={submission.status === "replied" ? "default" : "secondary"}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">View & Reply</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Contact Submission</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <strong>From:</strong> {submission.name} ({submission.email})
                          </div>
                          <div>
                            <strong>Phone:</strong> {submission.phone || "Not provided"}
                          </div>
                          <div>
                            <strong>Subject:</strong> {submission.subject}
                          </div>
                          <div>
                            <strong>Message:</strong>
                            <p className="mt-2 p-3 bg-muted rounded">{submission.message}</p>
                          </div>
                          {submission.admin_reply && (
                            <div>
                              <strong>Your Reply:</strong>
                              <p className="mt-2 p-3 bg-primary/10 rounded">{submission.admin_reply}</p>
                            </div>
                          )}
                          {submission.status !== "replied" && (
                            <>
                              <Textarea
                                placeholder="Type your reply..."
                                value={replyMessage.id === submission.id ? replyMessage.reply : ""}
                                onChange={(e) => setReplyMessage({ id: submission.id, reply: e.target.value })}
                                rows={4}
                              />
                              <Button
                                onClick={() => handleReplyToContact(submission.id, replyMessage.reply)}
                                className="w-full"
                              >
                                Send Reply
                              </Button>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            All Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell>{msg.sender?.full_name || "Unknown"}</TableCell>
                  <TableCell>{msg.subject}</TableCell>
                  <TableCell>
                    <Badge variant={msg.is_broadcast ? "default" : "secondary"}>
                      {msg.is_broadcast ? "Broadcast" : "Direct"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(msg.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={msg.is_read ? "outline" : "default"}>
                      {msg.is_read ? "Read" : "Unread"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMessages;
