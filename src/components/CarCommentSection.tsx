import { useState, useEffect } from "react";
import { MessageSquare, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  display_name: string;
  comment_text: string;
  is_anonymous: boolean;
  created_at: string;
}

interface CarCommentSectionProps {
  carId: string;
}

const CarCommentSection = ({ carId }: CarCommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCommentCount();
  }, [carId]);

  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments, carId]);

  // Pre-fill display name from profile if logged in
  useEffect(() => {
    if (user && !displayName) {
      supabase.from("profiles").select("full_name, email, phone").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.full_name) setDisplayName(data.full_name);
          if (data?.email) setContactEmail(data.email);
          if (data?.phone) setContactPhone(data.phone);
        });
    }
  }, [user]);

  const fetchCommentCount = async () => {
    const { count } = await supabase.from("car_comments").select("*", { count: "exact", head: true }).eq("car_id", carId);
    setCommentCount(count || 0);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("car_comments")
      .select("id, display_name, comment_text, is_anonymous, created_at")
      .eq("car_id", carId)
      .order("created_at", { ascending: false })
      .limit(20);
    setComments(data || []);
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("car_comments").insert({
        car_id: carId,
        user_id: user?.id || null,
        display_name: isAnonymous ? "Anonymous" : (displayName.trim() || "Guest"),
        comment_text: commentText.trim(),
        is_anonymous: isAnonymous,
        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim() || null,
      });
      if (error) throw error;
      setCommentText("");
      setCommentCount((c) => c + 1);
      fetchComments();
      toast({ title: "Comment posted!", description: "Your feedback has been submitted successfully." });
    } catch (err) {
      console.error("Comment error:", err);
      toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 h-8 px-2 text-muted-foreground"
        onClick={(e) => { e.preventDefault(); setShowComments(!showComments); }}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="text-xs font-semibold">{commentCount} Comments</span>
      </Button>

      {showComments && (
        <div className="mt-2 border-t border-border pt-3 space-y-3" onClick={(e) => e.preventDefault()}>
          {/* Comment form - available to everyone */}
          <div className="space-y-2 bg-muted/30 rounded-lg p-3">
            <Textarea
              placeholder="Write your comment or message..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
            />

            <div className="flex items-center gap-1.5 mb-2">
              <Checkbox
                id={`anon-${carId}`}
                checked={isAnonymous}
                onCheckedChange={(v) => setIsAnonymous(v as boolean)}
                className="h-3.5 w-3.5"
              />
              <label htmlFor={`anon-${carId}`} className="text-xs text-muted-foreground cursor-pointer">
                Comment anonymously
              </label>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-1 gap-2">
                <Input
                  placeholder="Your name (optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-7 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Phone (optional)"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="h-7 text-xs"
                  />
                  <Input
                    placeholder="Email (optional)"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-7 text-xs"
                    type="email"
                  />
                </div>
              </div>
            )}

            <Button
              size="sm"
              className="w-full h-8 gap-1 text-xs"
              onClick={handleSubmit}
              disabled={submitting || !commentText.trim()}
            >
              <Send className="h-3 w-3" />
              Submit Comment
            </Button>
          </div>

          {/* Comments list */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2 text-xs">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{c.display_name}</span>
                      <span className="text-muted-foreground">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-muted-foreground break-words">{c.comment_text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarCommentSection;
