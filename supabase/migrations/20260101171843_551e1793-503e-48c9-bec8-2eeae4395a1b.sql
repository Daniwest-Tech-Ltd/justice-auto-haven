-- Add admin policy to view all finance documents
CREATE POLICY "Admins can view all finance documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'finance-documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));