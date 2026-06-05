
CREATE TABLE public.mobile_app_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  release_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mobile_app_releases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mobile_app_releases TO authenticated;
GRANT ALL ON public.mobile_app_releases TO service_role;

ALTER TABLE public.mobile_app_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active releases" ON public.mobile_app_releases
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert releases" ON public.mobile_app_releases
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update releases" ON public.mobile_app_releases
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete releases" ON public.mobile_app_releases
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mobile_app_releases_updated_at
  BEFORE UPDATE ON public.mobile_app_releases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for mobile-app bucket
CREATE POLICY "Public can download APK" ON storage.objects
  FOR SELECT USING (bucket_id = 'mobile-app');

CREATE POLICY "Admins can upload APK" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mobile-app' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update APK" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'mobile-app' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete APK" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'mobile-app' AND public.has_role(auth.uid(), 'admin'));
