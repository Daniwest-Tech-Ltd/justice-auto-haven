import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ExternalLink } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

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

const Blogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : "N/A"}
                </div>

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

                <Button className="w-full">Read More →</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Blogs;
