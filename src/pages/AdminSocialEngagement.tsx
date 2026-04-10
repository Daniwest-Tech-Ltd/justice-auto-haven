import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbsUp, ThumbsDown, MessageSquare, Star, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";

interface CarWithLikes {
  car_id: string;
  make: string;
  model: string;
  year: number;
  stock_id: string | null;
  likes: number;
  dislikes: number;
  image: string | null;
}

interface CarWithRating {
  car_id: string;
  make: string;
  model: string;
  year: number;
  stock_id: string | null;
  avg_rating: number;
  total_ratings: number;
  image: string | null;
}

interface CommentRow {
  id: string;
  car_id: string;
  display_name: string;
  comment_text: string;
  is_anonymous: boolean;
  created_at: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  parent_id?: string | null;
  car_make?: string;
  car_model?: string;
  car_year?: number;
}

const AdminSocialEngagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [topLiked, setTopLiked] = useState<CarWithLikes[]>([]);
  const [topDisliked, setTopDisliked] = useState<CarWithLikes[]>([]);
  const [topRated, setTopRated] = useState<CarWithRating[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalDislikes, setTotalDislikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [avgOverallRating, setAvgOverallRating] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      // Fetch likes
      const { data: likesData } = await supabase.from("car_likes").select("car_id, reaction_type");
      const carLikesMap: Record<string, { likes: number; dislikes: number }> = {};
      (likesData || []).forEach((l: any) => {
        if (!carLikesMap[l.car_id]) carLikesMap[l.car_id] = { likes: 0, dislikes: 0 };
        if (l.reaction_type === "like") carLikesMap[l.car_id].likes++;
        else carLikesMap[l.car_id].dislikes++;
      });

      // Fetch ratings
      const { data: ratingsData } = await supabase.from("car_ratings").select("car_id, rating");
      const carRatingsMap: Record<string, { sum: number; count: number }> = {};
      (ratingsData || []).forEach((r: any) => {
        if (!carRatingsMap[r.car_id]) carRatingsMap[r.car_id] = { sum: 0, count: 0 };
        carRatingsMap[r.car_id].sum += r.rating;
        carRatingsMap[r.car_id].count++;
      });

      const allRatings = ratingsData || [];
      setTotalRatings(allRatings.length);
      if (allRatings.length > 0) {
        const sum = allRatings.reduce((a: number, r: any) => a + r.rating, 0);
        setAvgOverallRating(Math.round((sum / allRatings.length) * 10) / 10);
      }

      // Fetch car info for all referenced cars
      const allCarIds = [...new Set([...Object.keys(carLikesMap), ...Object.keys(carRatingsMap)])];
      let carsInfo: any[] = [];
      if (allCarIds.length > 0) {
        const { data } = await supabase.from("cars").select("id, make, model, year, stock_id, main_images, images").in("id", allCarIds);
        carsInfo = data || [];
      }
      const carInfoMap = Object.fromEntries(carsInfo.map((c: any) => [c.id, c]));

      const getImage = (car: any) => {
        const imgs = car?.main_images || car?.images;
        if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
        return null;
      };

      // Build likes list
      const carsWithLikes: CarWithLikes[] = Object.entries(carLikesMap).map(([carId, counts]) => {
        const car = carInfoMap[carId];
        return {
          car_id: carId,
          make: car?.make || "Unknown",
          model: car?.model || "",
          year: car?.year || 0,
          stock_id: car?.stock_id,
          likes: counts.likes,
          dislikes: counts.dislikes,
          image: getImage(car),
        };
      });
      setTopLiked([...carsWithLikes].sort((a, b) => b.likes - a.likes).slice(0, 20));
      setTopDisliked([...carsWithLikes].sort((a, b) => b.dislikes - a.dislikes).slice(0, 20));
      setTotalLikes((likesData || []).filter((l: any) => l.reaction_type === "like").length);
      setTotalDislikes((likesData || []).filter((l: any) => l.reaction_type === "dislike").length);

      // Build ratings list
      const carsWithRatings: CarWithRating[] = Object.entries(carRatingsMap).map(([carId, data]) => {
        const car = carInfoMap[carId];
        return {
          car_id: carId,
          make: car?.make || "Unknown",
          model: car?.model || "",
          year: car?.year || 0,
          stock_id: car?.stock_id,
          avg_rating: Math.round((data.sum / data.count) * 10) / 10,
          total_ratings: data.count,
          image: getImage(car),
        };
      });
      setTopRated([...carsWithRatings].sort((a, b) => b.avg_rating - a.avg_rating || b.total_ratings - a.total_ratings));

      // Fetch comments
      const { data: commentsData, count } = await supabase
        .from("car_comments")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100);

      const commentCarIds = [...new Set((commentsData || []).map((c: any) => c.car_id))];
      let commentCars: any[] = [];
      if (commentCarIds.length > 0) {
        const { data } = await supabase.from("cars").select("id, make, model, year").in("id", commentCarIds);
        commentCars = data || [];
      }
      const carMap = Object.fromEntries(commentCars.map((c: any) => [c.id, c]));

      setComments((commentsData || []).map((c: any) => ({
        ...c,
        car_make: carMap[c.car_id]?.make,
        car_model: carMap[c.car_id]?.model,
        car_year: carMap[c.car_id]?.year,
      })));
      setTotalComments(count || 0);
    } catch (err) {
      console.error("Error loading social data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-4 w-4 ${rating >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin-dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Social Engagement</h1>
          <p className="text-muted-foreground">Likes, ratings, comments & engagement metrics</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <ThumbsUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalLikes.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Likes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <ThumbsDown className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDislikes.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Dislikes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgOverallRating || "—"}</p>
              <p className="text-sm text-muted-foreground">{totalRatings} Ratings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalComments.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Comments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ratings">
        <TabsList className="mb-4">
          <TabsTrigger value="ratings" className="gap-1"><Star className="h-4 w-4" /> Ratings</TabsTrigger>
          <TabsTrigger value="liked" className="gap-1"><ThumbsUp className="h-4 w-4" /> Top Liked</TabsTrigger>
          <TabsTrigger value="disliked" className="gap-1"><ThumbsDown className="h-4 w-4" /> Most Disliked</TabsTrigger>
          <TabsTrigger value="comments" className="gap-1"><MessageSquare className="h-4 w-4" /> Comments</TabsTrigger>
        </TabsList>

        {/* Ratings Tab */}
        <TabsContent value="ratings">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topRated.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">No ratings yet</p>
            ) : topRated.map((car, i) => (
              <Card key={car.car_id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/car/${car.car_id}`)}>
                <div className="flex gap-4 p-4">
                  <div className="relative">
                    <span className="absolute -top-1 -left-1 bg-yellow-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">#{i + 1}</span>
                    {car.image ? (
                      <img src={car.image} alt={`${car.make} ${car.model}`} className="h-20 w-28 object-cover rounded" />
                    ) : (
                      <div className="h-20 w-28 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{car.make} {car.model}</h3>
                    <p className="text-xs text-muted-foreground">{car.year} • {car.stock_id || "N/A"}</p>
                    <div className="mt-2">{renderStars(Math.round(car.avg_rating))}</div>
                    <p className="text-xs text-muted-foreground mt-1">{car.avg_rating}/5 ({car.total_ratings} ratings)</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Liked Tab */}
        <TabsContent value="liked">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topLiked.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">No likes yet</p>
            ) : topLiked.map((car, i) => (
              <Card key={car.car_id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/car/${car.car_id}`)}>
                <div className="flex gap-4 p-4">
                  <div className="relative">
                    <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">#{i + 1}</span>
                    {car.image ? (
                      <img src={car.image} alt={`${car.make} ${car.model}`} className="h-20 w-28 object-cover rounded" />
                    ) : (
                      <div className="h-20 w-28 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{car.make} {car.model}</h3>
                    <p className="text-xs text-muted-foreground">{car.year} • {car.stock_id || "N/A"}</p>
                    <div className="flex gap-3 mt-2">
                      <Badge className="bg-green-500/20 text-green-600 gap-1"><ThumbsUp className="h-3 w-3" /> {car.likes}</Badge>
                      <Badge variant="secondary" className="gap-1"><ThumbsDown className="h-3 w-3" /> {car.dislikes}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Disliked Tab */}
        <TabsContent value="disliked">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topDisliked.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">No dislikes yet</p>
            ) : topDisliked.map((car, i) => (
              <Card key={car.car_id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/car/${car.car_id}`)}>
                <div className="flex gap-4 p-4">
                  <div className="relative">
                    <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">#{i + 1}</span>
                    {car.image ? (
                      <img src={car.image} alt={`${car.make} ${car.model}`} className="h-20 w-28 object-cover rounded" />
                    ) : (
                      <div className="h-20 w-28 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{car.make} {car.model}</h3>
                    <p className="text-xs text-muted-foreground">{car.year} • {car.stock_id || "N/A"}</p>
                    <div className="flex gap-3 mt-2">
                      <Badge variant="secondary" className="gap-1"><ThumbsUp className="h-3 w-3" /> {car.likes}</Badge>
                      <Badge className="bg-red-500/20 text-red-600 gap-1"><ThumbsDown className="h-3 w-3" /> {car.dislikes}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No comments yet</p>
            ) : comments.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                        {c.is_anonymous ? "?" : c.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          {c.is_anonymous ? "Anonymous" : c.display_name.split(" ")[0]}
                        </span>
                        {c.is_anonymous && <Badge variant="outline" className="text-xs">Anonymous</Badge>}
                        {c.parent_id && <Badge variant="secondary" className="text-xs">Reply</Badge>}
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{c.comment_text}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {c.car_make && (
                          <button onClick={() => navigate(`/car/${c.car_id}`)} className="text-xs text-primary hover:underline">
                            on {c.car_make} {c.car_model} {c.car_year}
                          </button>
                        )}
                        {c.contact_phone && (
                          <a href={`tel:${c.contact_phone}`} className="text-xs text-muted-foreground hover:text-primary">📞 {c.contact_phone}</a>
                        )}
                        {c.contact_email && (
                          <a href={`mailto:${c.contact_email}`} className="text-xs text-muted-foreground hover:text-primary">✉️ {c.contact_email}</a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSocialEngagement;
