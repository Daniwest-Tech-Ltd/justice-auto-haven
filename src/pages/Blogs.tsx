import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Calendar,
  ExternalLink,
  Share2,
  Clock,
  ShieldCheck,
  Globe,
  Navigation,
  ChevronRight,
  MessageSquare,
  Star,
  CheckCircle,
  ArrowLeft,
  Newspaper,
  Users,
  Trophy,
  Activity,
  ShieldCheck as Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import ContentLikeButton from "@/components/ContentLikeButton";
import ContentCommentSection from "@/components/ContentCommentSection";
import { getCurrentSale } from "@/lib/currentSale";
import HeroSlider from "@/components/HeroSlider";

interface Blog {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  author_id: string | null;
  is_published: boolean;
  published_at: string | null;
  links: any;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
  user_name?: string;
  car_name?: string;
}

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-KE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Blogs = () => {
  const sale = getCurrentSale();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchBlogs(), fetchRecentReviews()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }
  };

  const fetchRecentReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles(full_name), cars(make, model)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      const formattedReviews = (data || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        is_verified_purchase: r.is_verified_purchase,
        created_at: r.created_at,
        user_name: r.profiles?.full_name || "Verified Client",
        car_name: r.cars ? `${r.cars.make} ${r.cars.model}` : "Premium Asset",
      }));

      setReviews(formattedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden pb-20">
      {/* Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Professional Marquee - Institutional Branding */}
      <div className="bg-primary/80 backdrop-blur-md text-white py-2 overflow-hidden border-b border-white/5 relative z-30 shadow-2xl">
        <div className="flex whitespace-nowrap animate-marquee-professional">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center shrink-0">
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck className="h-3 w-3 text-brand-red" />
                Corporate Media Desk
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Globe className="h-3 w-3 text-brand-red" />
                Global Industry Insights
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Trophy className="h-3 w-3 text-brand-red" />
                Verified Excellence
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Shield className="h-3 w-3 text-brand-red" />
                Institutional Verification
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Marquee - Industry Insights */}
      <div className="bg-black/90 text-white/60 py-1.5 overflow-hidden border-b border-white/5 relative z-30">
        <div className="flex whitespace-nowrap animate-marquee-professional" style={{ animationDirection: 'reverse', animationDuration: '60s' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center shrink-0">
              <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                <Globe className="h-2.5 w-2.5 text-primary" />
                Strategic Market Data
              </span>
              <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                <Activity className="h-2.5 w-2.5 text-primary" />
                Active Industry Monitoring
              </span>
              <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                <CheckCircle className="h-2.5 w-2.5 text-primary" />
                Certified Media Releases
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-professional {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-professional {
          animation: marquee-professional 40s linear infinite;
        }
      `}</style>

      {/* Hero - Professional & Formal */}
      <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
        <HeroSlider />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red">Operational Media Hub: {sale.year}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
              News & <span className="text-brand-red">Corporate Room.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Authoritative automotive dispatches and verified client testimonials. <br />
              Stay synchronized with the latest market shifts and corporate milestones.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="space-y-20 max-w-7xl mx-auto">

          {/* Latest News Section - 3 Columns */}
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Newspaper className="h-5 w-5 text-brand-red" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em]">Latest Articles</h2>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-3 border-primary/20">
                <Activity className="h-3 w-3 mr-2 animate-pulse text-brand-red" />
                Live Dispatches
              </Badge>
            </div>

            {blogs.length === 0 ? (
              <Card className="border-dashed border-2 bg-secondary/5">
                <CardContent className="p-20 text-center">
                  <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">No dispatches available in the current cycle.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map((blog) => (
                  <Card key={blog.id} className="flex flex-col h-full overflow-hidden border-border bg-background hover:shadow-2xl transition-all duration-500 group border-b-2 hover:border-b-brand-red">
                    <div className="h-52 relative overflow-hidden">
                      {blog.featured_image ? (
                        <img
                          src={blog.featured_image}
                          alt={blog.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                           <Newspaper className="h-10 w-10 text-primary/20" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                         <Badge className="bg-primary/90 text-white text-[8px] font-black uppercase tracking-widest">Reports</Badge>
                      </div>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-1 space-y-4">
                      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(blog.published_at || blog.created_at)}
                      </div>

                      <h3 className="text-sm font-black uppercase tracking-tight leading-tight group-hover:text-brand-red transition-colors min-h-[2.5rem]">
                        {blog.title}
                      </h3>

                      {blog.excerpt && (
                        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3 uppercase font-medium">
                          {blog.excerpt}
                        </p>
                      )}

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="link" className="p-0 h-auto text-brand-red font-black text-[10px] uppercase tracking-widest flex items-center gap-1 group/btn">
                              Full Report <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="border-b border-border pb-4">
                              <DialogTitle className="text-2xl font-black uppercase tracking-tight">{blog.title}</DialogTitle>
                              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-2">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(blog.created_at)}</span>
                                <span className="flex items-center gap-1 text-brand-red"><ShieldCheck className="h-3 w-3" /> Verified Content</span>
                              </div>
                            </DialogHeader>
                            <div className="space-y-6 pt-6">
                              {blog.featured_image && (
                                <img src={blog.featured_image} alt={blog.title} className="w-full rounded-md shadow-lg border border-border" />
                              )}
                              <div className="prose prose-sm dark:prose-invert max-w-none px-2">
                                <div className="text-xs md:text-sm leading-loose text-justify uppercase font-medium text-foreground/80 whitespace-pre-wrap">
                                  {blog.content}
                                </div>
                              </div>
                              <div className="flex flex-col md:flex-row gap-6 border-t border-border pt-6">
                                <div className="flex-1">
                                   <ContentLikeButton contentId={blog.id} contentType="blog" />
                                </div>
                                <div className="flex-1">
                                   <ContentCommentSection contentId={blog.id} contentType="blog" />
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full hover:bg-secondary"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/blogs`);
                            toast({ title: "Ref link copied" });
                          }}
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Reviews Section - 3 Columns */}
          <div className="space-y-8 bg-secondary/5 p-8 rounded-xl border border-border">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Users className="h-5 w-5 text-brand-red" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">Verified Client Reviews</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.length === 0 ? (
                <div className="lg:col-span-3 text-center py-10">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Awaiting verified client audits.</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} className="border-border bg-background shadow-sm hover:border-primary/30 transition-all flex flex-col">
                    <CardContent className="p-6 space-y-4 flex flex-col h-full">
                      <div className="flex justify-between items-start">
                         <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-2.5 w-2.5 ${i < review.rating ? "fill-brand-red text-brand-red" : "text-muted/30"}`} />
                            ))}
                         </div>
                         {review.is_verified_purchase && (
                           <Badge variant="secondary" className="text-[7px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              <CheckCircle className="h-2 w-2 mr-1" /> Owner
                           </Badge>
                         )}
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-tight text-foreground line-clamp-1">"{review.title}"</p>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase leading-relaxed line-clamp-3 italic">
                         {review.comment}
                      </p>
                      <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center">
                         <div className="space-y-0.5">
                            <p className="text-[9px] font-black uppercase tracking-wider">{review.user_name}</p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">{review.car_name}</p>
                         </div>
                         <p className="text-[8px] font-bold text-muted-foreground uppercase">{formatDateTime(review.created_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Business Support Footer Area */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="rounded-md border-border bg-background shadow-md">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Editorial Protocol</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed text-justify">
                  Our dispatches are verified by logistics experts to ensure high-fidelity market data for our stakeholders.
                </p>
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                   </div>
                   <p className="text-[9px] font-black uppercase">Factual Integrity Guaranteed</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md border-border bg-primary text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.2),transparent_50%)]" />
              <CardContent className="pt-8 pb-6 text-center space-y-4 relative z-10">
                <Globe className="h-8 w-8 text-brand-red mx-auto" />
                <h3 className="text-xs font-black uppercase tracking-widest">Public Relations Desk</h3>
                <p className="text-xl font-black font-mono tracking-tighter">0722 827 458</p>
                <Button
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-[10px] font-black uppercase tracking-widest h-10 rounded-sm hover:bg-white hover:text-primary"
                  onClick={() => navigate("/contact")}
                >
                  Contact Media Office
                </Button>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full h-14 rounded-md border-border bg-secondary/5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4" /> Return to Terminal
              </Button>
              <div className="bg-brand-red/5 border border-brand-red/10 p-4 rounded-md text-center">
                 <p className="text-[9px] font-black text-brand-red uppercase tracking-widest">
                   Next Dispatch: Scheduled for Wednesday
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blogs;
