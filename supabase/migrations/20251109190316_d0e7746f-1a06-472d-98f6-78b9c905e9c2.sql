-- Create video-uploads storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('video-uploads', 'video-uploads', true, 524288000, ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']);

-- Storage policies for video uploads
CREATE POLICY "Admins can upload videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'video-uploads' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can update videos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'video-uploads' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can delete videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'video-uploads' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Anyone can view videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'video-uploads');