import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, ExternalLink, Share2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import ContentLikeButton from "@/components/ContentLikeButton";
import ContentCommentSection from "@/components/ContentCommentSection";

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

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-KE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }) + " " + d.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const Blogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center glass-strong rounded-3xl p-12 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">
          <span className="bg-gradient-accent bg-clip-text text-transparent">Blog</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          📰 Stay updated with the latest automotive news, tips, and insights
        </p>
      </div>

      {/* Blogs Grid */}
      {blogs.length === 0 ? (
        <div className="glass-strong rounded-2xl p-12 text-center">
          <h3 className="text-2xl font-bold mb-4">No blogs yet</h3>
          <p className="text-muted-foreground">Check back soon for exciting automotive content!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div key={blog.id} className="glass-strong rounded-2xl overflow-hidden hover:scale-105 transition-transform">
              {/* Featured Image */}
              {blog.featured_image && (
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20">
                  <img
                    src={blog.featured_image}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Added: {formatDateTime(blog.created_at)}</span>
                </div>
                {blog.published_at && blog.published_at !== blog.created_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Published: {formatDateTime(blog.published_at)}</span>
                  </div>
                )}

                <h3 className="text-xl font-bold line-clamp-2">{blog.title}</h3>
                
                {blog.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{blog.excerpt}</p>
                )}

                {/* Links */}
                {blog.links && Array.isArray(blog.links) && blog.links.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Related Links:</p>
                    {blog.links.map((link: any, idx: number) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {link.title || link.url}
                      </a>
                    ))}
                  </div>
                )}

                {/* Like/Dislike */}
                <ContentLikeButton contentId={blog.id} contentType="blog" />

                {/* Comments */}
                <ContentCommentSection contentId={blog.id} contentType="blog" />

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex-1" onClick={() => setSelectedBlog(blog)}>Read More →</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{blog.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Added: {formatDateTime(blog.created_at)}</span>
                        </div>
                        {blog.featured_image && (
                          <img src={blog.featured_image} alt={blog.title} className="w-full rounded-lg" />
                        )}
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <p className="whitespace-pre-wrap">{blog.content}</p>
                        </div>
                        <ContentLikeButton contentId={blog.id} contentType="blog" />
                        <ContentCommentSection contentId={blog.id} contentType="blog" />
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/blogs`;
                      navigator.clipboard.writeText(shareUrl);
                      toast({ title: "Share link copied to clipboard!" });
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Blogs;
