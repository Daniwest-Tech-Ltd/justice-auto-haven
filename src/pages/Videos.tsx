import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Play,
  Clock,
  ShieldCheck,
  Globe,
  ChevronRight,
  Video as VideoIcon,
  Share2,
  Activity,
  Trophy,
  ArrowLeft,
  Navigation,
  CheckCircle,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import ContentLikeButton from "@/components/ContentLikeButton";
import ContentCommentSection from "@/components/ContentCommentSection";
import { getCurrentSale } from "@/lib/currentSale";
import HeroSlider from "@/components/HeroSlider";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  video_type: string | null;
  is_published: boolean;
  category: string | null;
  created_at: string;
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

const Videos = () => {
  const sale = getCurrentSale();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
      
      const uniqueCategories = Array.from(
        new Set(data?.map(v => v.category).filter(Boolean) as string[])
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = selectedCategory === "all" 
    ? videos 
    : videos.filter(v => v.category === selectedCategory);

  const getVideoEmbed = (video: Video) => {
    if (video.video_type === "youtube") {
      let videoId = "";
      try {
        if (video.video_url.includes("youtube.com")) {
          videoId = new URLSearchParams(new URL(video.video_url).search).get("v") || "";
        } else if (video.video_url.includes("youtu.be")) {
          videoId = video.video_url.split("/").pop() || "";
        } else {
          videoId = video.video_url.split("/").pop() || "";
        }
      } catch (e) {
        videoId = video.video_url.split("/").pop() || "";
      }

      return (
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    } else if (video.video_type === "tiktok") {
      return (
        <iframe
          className="w-full h-full"
          src={`https://www.tiktok.com/embed/${video.video_url.split("/").pop()}`}
          title={video.title}
          frameBorder="0"
          allow="encrypted-media;"
          allowFullScreen
        />
      );
    } else {
      return (
        <video
          className="w-full h-full object-cover"
          controls
          poster={video.thumbnail_url || undefined}
        >
          <source src={video.video_url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
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

      {/* Official Trust Bar */}
      <div className="bg-primary py-2 relative z-30 border-b border-white/5 shadow-2xl">
        <div className="container mx-auto px-4 flex justify-center items-center gap-10 whitespace-nowrap overflow-hidden">
          <span className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3 text-brand-red" />
            Visual Asset Registry
          </span>
          <span className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest">
            <Globe className="h-3 w-3 text-brand-red" />
            Global Inventory Showcase
          </span>
          <span className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest">
            <Trophy className="h-3 w-3 text-brand-red" />
            Verified HD Content
          </span>
        </div>
      </div>

      {/* Hero - Professional & Formal */}
      <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
        <HeroSlider />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red">Operational Video Hub: {sale.year}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
              Visual <span className="text-brand-red">Asset Room.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Explore our verified video inventory, executive walkthroughs, and industry analytical content. <br />
              High-fidelity visual audits for discerning automotive clients.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="space-y-20 max-w-7xl mx-auto">

          {/* Category Filter - Professional Style */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className="h-10 px-6 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
              >
                All Assets
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="h-10 px-6 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {category}
                </Button>
              ))}
            </div>
          )}

          {/* Videos Grid - 3 Columns */}
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <VideoIcon className="h-5 w-5 text-brand-red" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em]">Visual Dispatches</h2>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-3 border-primary/20">
                <Activity className="h-3 w-3 mr-2 animate-pulse text-brand-red" />
                Live Feed
              </Badge>
            </div>

            {filteredVideos.length === 0 ? (
              <Card className="border-dashed border-2 bg-secondary/5">
                <CardContent className="p-20 text-center">
                  <Play className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">No visual assets indexed in this sector.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="flex flex-col h-full overflow-hidden border-border bg-background hover:shadow-2xl transition-all duration-500 group border-b-2 hover:border-b-brand-red">
                    {/* Video Embed Area */}
                    <div className="aspect-video relative overflow-hidden bg-black">
                      {getVideoEmbed(video)}
                      <div className="absolute top-4 left-4">
                         <Badge className="bg-brand-red text-white text-[8px] font-black uppercase tracking-widest border-none">
                            {video.video_type || "video"}
                         </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(video.created_at)}
                        </div>
                        {video.category && (
                          <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest bg-primary/5 text-primary">
                            {video.category}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-sm font-black uppercase tracking-tight leading-tight group-hover:text-brand-red transition-colors min-h-[2.5rem]">
                        {video.title}
                      </h3>

                      {video.description && (
                        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3 uppercase font-medium">
                          {video.description}
                        </p>
                      )}

                      {/* Engagement Matrix */}
                      <div className="pt-4 border-t border-border/50 space-y-4">
                        <div className="flex flex-col gap-4">
                           <ContentLikeButton contentId={video.id} contentType="video" />
                           <ContentCommentSection contentId={video.id} contentType="video" />
                        </div>
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <Button variant="link" className="p-0 h-auto text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1 group/btn">
                          View Details <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full hover:bg-secondary"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/videos`);
                            toast({ title: "Visual reference link copied" });
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

          {/* Business Support Footer Area */}
          <div className="grid md:grid-cols-3 gap-8 pt-10">
            <Card className="rounded-md border-border bg-background shadow-md">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Visual Protocol</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed text-justify">
                  All visual assets are verified by our technical audit team. We ensure high-resolution transparency for every unit in our inventory.
                </p>
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                   </div>
                   <p className="text-[9px] font-black uppercase">Technical Verification</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md border-border bg-primary text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.2),transparent_50%)]" />
              <CardContent className="pt-8 pb-6 text-center space-y-4 relative z-10">
                <Globe className="h-8 w-8 text-brand-red mx-auto" />
                <h3 className="text-xs font-black uppercase tracking-widest">Multimedia Desk</h3>
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
                className="w-full h-14 rounded-md border-border bg-secondary/5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-secondary"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4" /> Return to Terminal
              </Button>
              <Card className="border-border bg-background shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-brand-red/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-brand-red" />
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase tracking-widest">Active Stream</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Inventory Sync Active</p>
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Videos;
