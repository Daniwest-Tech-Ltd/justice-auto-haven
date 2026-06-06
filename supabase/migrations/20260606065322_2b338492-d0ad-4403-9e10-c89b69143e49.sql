CREATE TABLE IF NOT EXISTS public.mobile_app_store_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_play_url text,
  app_center_url text DEFAULT 'https://loadly.io/justice-auto-app',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.mobile_app_store_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mobile_app_store_links TO authenticated;
GRANT ALL ON public.mobile_app_store_links TO service_role;

ALTER TABLE public.mobile_app_store_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store links" ON public.mobile_app_store_links FOR SELECT USING (true);
CREATE POLICY "Admins manage store links" ON public.mobile_app_store_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.mobile_app_store_links (google_play_url, app_center_url)
VALUES (NULL, 'https://loadly.io/justice-auto-app');