import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import { Play } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  video_type: string | null;
  is_published: boolean;
  category: string | null;
}

const Videos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

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
      
      // Extract unique categories
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
      const videoId = video.video_url.includes("youtube.com")
        ? new URLSearchParams(new URL(video.video_url).search).get("v")
        : video.video_url.split("/").pop();
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
      // Upload type - direct video player
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
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center glass-strong rounded-3xl p-12 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">
          <span className="bg-gradient-accent bg-clip-text text-transparent">Videos</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          🎥 Explore our video collection - local content and embedded videos from YouTube & TikTok
        </p>
        <Link to="/blogs">
          <Button size="lg">View Blogs</Button>
        </Link>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="glass-strong rounded-2xl p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              size="sm"
            >
              All Videos
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">
            {selectedCategory === "all" ? "No videos available yet" : `No videos in "${selectedCategory}" category`}
          </p>
          {selectedCategory !== "all" && (
            <Button onClick={() => setSelectedCategory("all")} className="mt-4">View All Videos</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div key={video.id} className="glass-strong rounded-2xl overflow-hidden hover:scale-105 transition-transform">
              {/* Video Player */}
              <div className="aspect-video bg-secondary/20 relative">
                {getVideoEmbed(video)}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant="secondary">{video.video_type || "video"}</Badge>
                  {video.category && <Badge variant="outline">{video.category}</Badge>}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Videos;
