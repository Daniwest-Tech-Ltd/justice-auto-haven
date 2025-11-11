import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trash2, Edit, Play } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import LoadingScreen from "@/components/LoadingScreen";

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

const VideoManagement = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    video_type: "youtube" as "youtube" | "tiktok" | "upload",
    is_published: true,
    category: "",
  });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingVideo(true);
    
    try {
      let videoUrl = formData.video_url;

      // Handle video file upload
      if (formData.video_type === "upload" && videoFile) {
        const fileExt = videoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${formData.title.toLowerCase().replace(/\s+/g, "-")}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("video-uploads")
          .upload(fileName, videoFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("video-uploads")
          .getPublicUrl(uploadData.path);

        videoUrl = publicUrl;
      }

      if (editingVideo) {
        // Update existing video
        const { error } = await supabase
          .from("videos")
          .update({
            title: formData.title,
            description: formData.description,
            video_url: videoUrl,
            video_type: formData.video_type,
            is_published: formData.is_published,
            category: formData.category || null,
          })
          .eq("id", editingVideo.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Video updated successfully",
        });
      } else {
        // Create new video
        const { error } = await supabase
          .from("videos")
          .insert({
            title: formData.title,
            description: formData.description,
            video_url: videoUrl,
            video_type: formData.video_type,
            is_published: formData.is_published,
            category: formData.category || null,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Video added successfully",
        });
      }

      setFormData({
        title: "",
        description: "",
        video_url: "",
        video_type: "youtube",
        is_published: true,
        category: "",
      });
      setVideoFile(null);
      setEditingVideo(null);
      setShowForm(false);
      fetchVideos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || "",
      video_url: video.video_url,
      video_type: video.video_type as "youtube" | "tiktok" | "upload",
      is_published: video.is_published,
      category: video.category || "",
    });
    setShowForm(true);
  };

  const deleteVideo = async (id: string, videoUrl: string) => {
    try {
      // If it's an uploaded video, delete from storage
      if (videoUrl.includes('video-uploads')) {
        const path = videoUrl.split('/video-uploads/')[1];
        if (path) {
          await supabase.storage.from('video-uploads').remove([path]);
        }
      }

      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
      fetchVideos();
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
        .from("videos")
        .update({ is_published: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Video ${!currentStatus ? "published" : "unpublished"}`,
      });
      fetchVideos();
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
          onClick={() => navigate("/admin-dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/blogs")}>
            Manage Blogs
          </Button>
        <Button onClick={() => {
          setEditingVideo(null);
          setFormData({
            title: "",
            description: "",
            video_url: "",
            video_type: "youtube",
            is_published: true,
            category: "",
          });
          setShowForm(!showForm);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Video
        </Button>
        </div>
      </div>

      {showForm && (
        <Card className="glass-strong mb-6">
          <CardHeader>
            <CardTitle>{editingVideo ? "Edit Video" : "Add New Video"}</CardTitle>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="video_type">Video Type</Label>
                <Select
                  value={formData.video_type}
                  onValueChange={(value: "youtube" | "tiktok" | "upload") => {
                    setFormData({ ...formData, video_type: value, video_url: "" });
                    setVideoFile(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube URL</SelectItem>
                    <SelectItem value="tiktok">TikTok URL</SelectItem>
                    <SelectItem value="upload">Upload Video File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.video_type === "upload" ? (
                <div>
                  <Label htmlFor="video_file">Upload Video File</Label>
                  <Input
                    id="video_file"
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    required
                    className="cursor-pointer"
                  />
                  {videoFile && <p className="text-sm text-muted-foreground mt-1">{videoFile.name}</p>}
                </div>
              ) : (
                <div>
                  <Label htmlFor="video_url">Video URL</Label>
                  <Input
                    id="video_url"
                    placeholder={formData.video_type === "youtube" ? "https://youtube.com/watch?v=..." : "https://tiktok.com/@user/video/..."}
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Reviews, Showroom Tour, Test Drive"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={uploadingVideo} className="flex-1">
                  {editingVideo ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {uploadingVideo ? "Uploading..." : editingVideo ? "Update Video" : "Add Video"}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingVideo(null);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="glass-strong">
            <CardContent className="p-4">
              <div className="aspect-video bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">{video.title}</h3>
              {video.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {video.description}
                </p>
              )}
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10">
                  {video.video_type || "video"}
                </span>
                {video.category && (
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary/50">
                    {video.category}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${video.is_published ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                  {video.is_published ? "Published" : "Draft"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(video)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => togglePublish(video.id, video.is_published)}
                >
                  {video.is_published ? "Unpublish" : "Publish"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Video?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete "{video.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteVideo(video.id, video.video_url)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VideoManagement;