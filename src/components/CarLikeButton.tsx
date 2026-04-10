import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CarLikeButtonProps {
  carId: string;
}

const formatCount = (count: number): string => {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return count.toString();
};

const CarLikeButton = ({ carId }: CarLikeButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);

  useEffect(() => {
    fetchCounts();
    if (user) fetchUserReaction();
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
    if (!user) return;
    const { data } = await supabase
      .from("car_likes")
      .select("reaction_type")
      .eq("car_id", carId)
      .eq("user_id", user.id)
      .maybeSingle();
    setUserReaction((data?.reaction_type as "like" | "dislike") || null);
  };

  const handleReaction = async (type: "like" | "dislike") => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to react", variant: "destructive" });
      return;
    }

    try {
      if (userReaction === type) {
        // Remove reaction
        await supabase.from("car_likes").delete().eq("car_id", carId).eq("user_id", user.id);
        setUserReaction(null);
        if (type === "like") setLikeCount((c) => c - 1);
        else setDislikeCount((c) => c - 1);
      } else if (userReaction) {
        // Switch reaction
        await supabase.from("car_likes").update({ reaction_type: type, updated_at: new Date().toISOString() }).eq("car_id", carId).eq("user_id", user.id);
        setUserReaction(type);
        if (type === "like") { setLikeCount((c) => c + 1); setDislikeCount((c) => c - 1); }
        else { setDislikeCount((c) => c + 1); setLikeCount((c) => c - 1); }
      } else {
        // New reaction
        await supabase.from("car_likes").insert({ car_id: carId, user_id: user.id, reaction_type: type });
        setUserReaction(type);
        if (type === "like") setLikeCount((c) => c + 1);
        else setDislikeCount((c) => c + 1);
      }
    } catch {
      toast({ title: "Error", description: "Failed to save reaction", variant: "destructive" });
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
