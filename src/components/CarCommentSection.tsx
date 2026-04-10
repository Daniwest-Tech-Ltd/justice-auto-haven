import { useState, useEffect } from "react";
import { MessageSquare, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // Pre-fill display name from profile
  useEffect(() => {
    if (user && !displayName) {
      supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => { if (data?.full_name) setDisplayName(data.full_name); });
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
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to comment", variant: "destructive" });
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("car_comments").insert({
        car_id: carId,
        user_id: user.id,
        display_name: isAnonymous ? "Anonymous" : (displayName.trim() || "Anonymous"),
        comment_text: commentText.trim(),
        is_anonymous: isAnonymous,
      });
      if (error) throw error;
      setCommentText("");
      setCommentCount((c) => c + 1);
      fetchComments();
      toast({ title: "Comment posted!" });
    } catch {
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
          {/* Comment input */}
          {user && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="h-8 text-xs"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                />
                <Button size="sm" className="h-8 px-3" onClick={handleSubmit} disabled={submitting || !commentText.trim()}>
                  <Send className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                {!isAnonymous && (
                  <Input
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-7 text-xs w-40"
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id={`anon-${carId}`}
                    checked={isAnonymous}
                    onCheckedChange={(v) => setIsAnonymous(v as boolean)}
                    className="h-3.5 w-3.5"
                  />
                  <label htmlFor={`anon-${carId}`} className="text-xs text-muted-foreground cursor-pointer">
                    Anonymous
                  </label>
                </div>
              </div>
            </div>
          )}

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
