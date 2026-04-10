import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CarLikeButtonProps {
  carId: string;
}

const formatCount = (count: number): string => {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return count.toString();
};

const getSessionId = (): string => {
  let sid = localStorage.getItem("jua_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("jua_session_id", sid);
  }
  return sid;
};

const CarLikeButton = ({ carId }: CarLikeButtonProps) => {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);

  useEffect(() => {
    fetchCounts();
    fetchUserReaction();
  }, [carId, user?.id]);

  const fetchCounts = async () => {
    const [{ count: likes }, { count: dislikes }] = await Promise.all([
      supabase.from("car_likes").select("*", { count: "exact", head: true }).eq("car_id", carId).eq("reaction_type", "like"),
      supabase.from("car_likes").select("*", { count: "exact", head: true }).eq("car_id", carId).eq("reaction_type", "dislike"),
    ]);
    setLikeCount(likes || 0);
    setDislikeCount(dislikes || 0);
  };

  const fetchUserReaction = async () => {
    let query = supabase.from("car_likes").select("id, reaction_type").eq("car_id", carId);
    if (user) {
      query = query.eq("user_id", user.id);
    } else {
      query = query.eq("session_id", getSessionId()).is("user_id", null);
    }
    const { data } = await query.maybeSingle();
    setUserReaction((data?.reaction_type as "like" | "dislike") || null);
  };

  const handleReaction = async (type: "like" | "dislike") => {
    try {
      // Find existing reaction
      let findQuery = supabase.from("car_likes").select("id, reaction_type").eq("car_id", carId);
      if (user) {
        findQuery = findQuery.eq("user_id", user.id);
      } else {
        findQuery = findQuery.eq("session_id", getSessionId()).is("user_id", null);
      }
      const { data: existing } = await findQuery.maybeSingle();

      if (existing && existing.reaction_type === type) {
        // Remove reaction
        await supabase.from("car_likes").delete().eq("id", existing.id);
        setUserReaction(null);
        if (type === "like") setLikeCount((c) => c - 1);
        else setDislikeCount((c) => c - 1);
      } else if (existing) {
        // Switch reaction
        await supabase.from("car_likes").update({ reaction_type: type, updated_at: new Date().toISOString() }).eq("id", existing.id);
        setUserReaction(type);
        if (type === "like") { setLikeCount((c) => c + 1); setDislikeCount((c) => c - 1); }
        else { setDislikeCount((c) => c + 1); setLikeCount((c) => c - 1); }
      } else {
        // New reaction
        await supabase.from("car_likes").insert({
          car_id: carId,
          user_id: user?.id || null,
          session_id: user ? null : getSessionId(),
          reaction_type: type,
        });
        setUserReaction(type);
        if (type === "like") setLikeCount((c) => c + 1);
        else setDislikeCount((c) => c + 1);
      }
    } catch (err) {
      console.error("Reaction error:", err);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={`gap-1 h-8 px-2 ${userReaction === "like" ? "text-green-500" : "text-muted-foreground"}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReaction("like"); }}
      >
        <ThumbsUp className={`h-4 w-4 ${userReaction === "like" ? "fill-green-500" : ""}`} />
        <span className="text-xs font-semibold">{formatCount(likeCount)}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`gap-1 h-8 px-2 ${userReaction === "dislike" ? "text-red-500" : "text-muted-foreground"}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReaction("dislike"); }}
      >
        <ThumbsDown className={`h-4 w-4 ${userReaction === "dislike" ? "fill-red-500" : ""}`} />
        <span className="text-xs font-semibold">{formatCount(dislikeCount)}</span>
      </Button>
    </div>
  );
};

export default CarLikeButton;
