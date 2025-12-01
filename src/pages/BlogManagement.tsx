import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trash2, Edit, FileText, Link as LinkIcon, Upload, X } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

interface Blog {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  is_published: boolean;
  links: any;
}

const BlogManagement = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    featured_image: "",
    links: [] as { title: string; url: string }[],
    is_published: true,
  });
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = () => {
    if (newLink.title && newLink.url) {
      setFormData({
        ...formData,
        links: [...formData.links, newLink],
      });
      setNewLink({ title: "", url: "" });
    }
  };

  const handleRemoveLink = (index: number) => {
    setFormData({
      ...formData,
      links: formData.links.filter((_, i) => i !== index),
    });
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, featured_image: publicUrl });
      setUploadedImage(file);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveUploadedImage = () => {
    setUploadedImage(null);
    setFormData({ ...formData, featured_image: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (editingBlog) {
        // Update existing blog
        const { error } = await supabase
          .from("blogs")
          .update({
            ...formData,
            published_at: formData.is_published ? new Date().toISOString() : null,
          })
          .eq("id", editingBlog.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Blog post updated successfully",
        });
      } else {
        // Create new blog
        const { error } = await supabase
          .from("blogs")
          .insert([{
            ...formData,
            author_id: session.user.id,
            published_at: formData.is_published ? new Date().toISOString() : null,
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Blog post created successfully",
        });
      }

      setFormData({
        title: "",
        excerpt: "",
        content: "",
        featured_image: "",
        links: [],
        is_published: true,
      });
      setUploadedImage(null);
      setEditingBlog(null);
      setShowForm(false);
      fetchBlogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt || "",
      content: blog.content,
      featured_image: blog.featured_image || "",
      links: Array.isArray(blog.links) ? blog.links : [],
      is_published: blog.is_published,
    });
    setShowForm(true);
  };

  const deleteBlog = async (id: string) => {
    try {
      const { error } = await supabase
        .from("blogs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog deleted successfully",
      });
      fetchBlogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("blogs")
        .update({ 
          is_published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Blog ${!currentStatus ? "published" : "unpublished"}`,
      });
      fetchBlogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/videos")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Videos
        </Button>
        <Button onClick={() => {
          setEditingBlog(null);
          setUploadedImage(null);
          setFormData({
            title: "",
            excerpt: "",
            content: "",
            featured_image: "",
            links: [],
            is_published: true,
          });
          setShowForm(!showForm);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Blog Post
        </Button>
      </div>

      {showForm && (
        <Card className="glass-strong mb-6">
          <CardHeader>
            <CardTitle>{editingBlog ? "Edit Blog Post" : "Create New Blog Post"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                  placeholder="Short preview of the blog post..."
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Featured Image</Label>
                
                {/* Image Upload Section */}
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                  
                  {uploadedImage || formData.featured_image ? (
                    <div className="space-y-4">
                      {formData.featured_image && (
                        <div className="relative inline-block">
                          <img
                            src={formData.featured_image}
                            alt="Preview"
                            className="max-h-48 rounded-lg"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveUploadedImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={uploadingImage}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadingImage ? "Uploading..." : "Change Image"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Upload an image or use URL below
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={uploadingImage}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadingImage ? "Uploading..." : "Upload Image"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* URL Input as Alternative */}
                <div>
                  <Label htmlFor="featured_image" className="text-sm text-muted-foreground">
                    Or enter image URL
                  </Label>
                  <Input
                    id="featured_image"
                    value={formData.featured_image}
                    onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Related Links</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Link title"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  />
                  <Input
                    placeholder="https://..."
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  />
                  <Button type="button" onClick={handleAddLink}>
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
                {formData.links.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="flex-1 text-sm">{link.title} - {link.url}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveLink(idx)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingBlog ? "Update Blog Post" : "Publish Blog Post"}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingBlog(null);
                  setUploadedImage(null);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <Card key={blog.id} className="glass-strong">
            <CardContent className="p-4">
              {blog.featured_image && (
                <div className="aspect-video bg-secondary/20 rounded-lg mb-4 overflow-hidden">
                  <img src={blog.featured_image} alt={blog.title} className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="font-semibold mb-2 line-clamp-2">{blog.title}</h3>
              {blog.excerpt && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {blog.excerpt}
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(blog)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => togglePublish(blog.id, blog.is_published)}
                >
                  {blog.is_published ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/blogs`;
                    navigator.clipboard.writeText(shareUrl);
                    toast({ title: "Share link copied!" });
                  }}
                >
                  Share
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteBlog(blog.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BlogManagement;
