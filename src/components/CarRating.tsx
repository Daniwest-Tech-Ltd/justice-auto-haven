import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CarRatingProps {
  carId: string;
  size?: "sm" | "md";
}

const getSessionId = (): string => {
  let sid = localStorage.getItem("jua_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("jua_session_id", sid);
  }
  return sid;
};

const CarRating = ({ carId, size = "sm" }: CarRatingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [carId]);

  const fetchRatings = async () => {
    // Get all ratings for this car
    const { data } = await supabase
      .from("car_ratings")
      .select("rating, user_id, session_id")
      .eq("car_id", carId);

    if (data && data.length > 0) {
      const sum = data.reduce((acc: number, r: any) => acc + r.rating, 0);
      setAvgRating(Math.round((sum / data.length) * 10) / 10);
      setTotalRatings(data.length);

      // Find my rating
      const identifier = user?.id || getSessionId();
      const mine = data.find((r: any) =>
        user ? r.user_id === user.id : r.session_id === identifier
      );
      if (mine) setMyRating(mine.rating);
    }
  };

  const handleRate = async (rating: number) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const sessionId = getSessionId();
      const userId = user?.id || null;

      if (userId) {
        // Check if already rated
        const { data: existing } = await supabase
          .from("car_ratings")
          .select("id")
          .eq("car_id", carId)
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("car_ratings")
            .update({ rating, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await supabase.from("car_ratings").insert({
            car_id: carId,
            user_id: userId,
            rating,
          });
        }
      } else {
        const { data: existing } = await supabase
          .from("car_ratings")
          .select("id")
          .eq("car_id", carId)
          .eq("session_id", sessionId)
          .is("user_id", null)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("car_ratings")
            .update({ rating, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await supabase.from("car_ratings").insert({
            car_id: carId,
            session_id: sessionId,
            rating,
          });
        }
      }

      setMyRating(rating);
      fetchRatings();
      toast({ title: "Rating submitted!", description: `You rated this car ${rating}/5 stars` });
    } catch (err) {
      console.error("Rating error:", err);
      toast({ title: "Error", description: "Failed to submit rating", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={(e) => { e.preventDefault(); handleRate(star); }}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={submitting}
            className="transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={`${starSize} ${
                (hoverRating || myRating || avgRating) >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : avgRating >= star - 0.5
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground font-medium">
        {avgRating > 0 ? `${avgRating}` : ""} ({totalRatings})
      </span>
    </div>
  );
};

export default CarRating;
