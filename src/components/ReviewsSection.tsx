import { useEffect, useState } from "react";
import { Star, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ReviewSubmissionModal } from "./ReviewSubmissionModal";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
  user_id: string;
  user_name?: string;
}

interface ReviewsSectionProps {
  carId: string;
  carName: string;
}

export const ReviewsSection = ({ carId, carName }: ReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkIfCanReview();
  }, [carId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("car_id", carId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user names separately
      const reviewsWithNames = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", review.user_id)
            .single();
          
          return {
            ...review,
            user_name: profile?.full_name || "Anonymous",
          };
        })
      );

      setReviews(reviewsWithNames);
      
      if (data && data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfCanReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("sales")
        .select("id")
        .eq("customer_id", user.id)
        .eq("car_id", carId)
        .single();

      setCanReview(!!data);
    } catch (error) {
      setCanReview(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold">Loading reviews...</p>
        <img 
          src="/src/assets/loading-animation.gif" 
          alt="Loading animation" 
          className="h-24 w-24 object-contain"
        />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              {renderStars(averageRating)}
              <span className="font-semibold">{averageRating}</span>
              <span className="text-muted-foreground">({reviews.length} reviews)</span>
            </div>
          )}
        </div>
        {canReview && (
          <Button onClick={() => setIsModalOpen(true)}>Write a Review</Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">No reviews yet. Be the first to review this car!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-6 bg-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.user_name}</span>
                    {review.is_verified_purchase && (
                      <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(review.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <h3 className="font-semibold mb-2">{review.title}</h3>
              <p className="text-muted-foreground">{review.comment}</p>
            </div>
          ))}
        </div>
      )}

      <ReviewSubmissionModal
        carId={carId}
        carName={carName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={fetchReviews}
      />
    </div>
  );
};
