-- Stock sequence for auto-generating stock IDs
CREATE TABLE IF NOT EXISTS public.stock_sequence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix TEXT NOT NULL DEFAULT 'JUA-KEN',
  last_number INTEGER NOT NULL DEFAULT 20,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert initial sequence
INSERT INTO public.stock_sequence (prefix, last_number)
VALUES ('JUA-KEN', 20)
ON CONFLICT DO NOTHING;

-- Sessions table for login/logout tracking
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  logout_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  client_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activity logs table for tracking all user actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Daily reports table for storing PDF reports
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  file_path TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Update attendance table to include more details
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS time_in TIME;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS time_out TIME;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE public.stock_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_sequence
CREATE POLICY "Admins can manage stock sequence"
ON public.stock_sequence FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view stock sequence"
ON public.stock_sequence FOR SELECT
USING (true);

-- RLS Policies for sessions
CREATE POLICY "Users can view own sessions"
ON public.sessions FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own sessions"
ON public.sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON public.sessions FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for activity_logs
CREATE POLICY "Users can create activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own activity logs"
ON public.activity_logs FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for daily_reports
CREATE POLICY "Users can view own reports"
ON public.daily_reports FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create reports"
ON public.daily_reports FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only CEO can delete reports"
ON public.daily_reports FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.full_name ILIKE '%CEO%'
  )
);

-- Function to get next stock ID
CREATE OR REPLACE FUNCTION public.generate_stock_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
  stock_id TEXT;
BEGIN
  -- Lock and get next number
  UPDATE public.stock_sequence
  SET last_number = last_number + 1, updated_at = now()
  WHERE prefix = 'JUA-KEN'
  RETURNING last_number INTO next_number;
  
  -- Format as JUA-KEN-021
  stock_id := 'JUA-KEN-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN stock_id;
END;
$$;

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_target_table TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activity_logs (user_id, action_type, target_table, target_id, details)
  VALUES (p_user_id, p_action_type, p_target_table, p_target_id, p_details)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Function to create daily attendance for all active users
CREATE OR REPLACE FUNCTION public.create_daily_attendance(attendance_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  records_created INTEGER := 0;
BEGIN
  INSERT INTO public.attendance (staff_id, date, status)
  SELECT s.id, attendance_date, 'pending'
  FROM public.staff s
  WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.attendance a
    WHERE a.staff_id = s.id AND a.date = attendance_date
  );
  
  GET DIAGNOSTICS records_created = ROW_COUNT;
  RETURN records_created;
END;
$$;