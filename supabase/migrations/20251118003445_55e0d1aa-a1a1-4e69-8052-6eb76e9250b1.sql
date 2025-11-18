-- Create is_dpo function
CREATE OR REPLACE FUNCTION public.is_dpo(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = COALESCE(is_dpo.user_id, auth.uid())
      AND user_roles.role = 'dpo'
  )
$$;

-- Create data_subject_requests table for LGPD compliance
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('access', 'rectification', 'deletion', 'portability')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'completed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  handled_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on data_subject_requests
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON public.data_subject_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own requests" ON public.data_subject_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin and DPO can view all requests
CREATE POLICY "Admin and DPO can view all requests" ON public.data_subject_requests
  FOR SELECT USING (public.is_admin() OR public.is_dpo());

-- Admin and DPO can update requests
CREATE POLICY "Admin and DPO can update requests" ON public.data_subject_requests
  FOR UPDATE USING (public.is_admin() OR public.is_dpo());

-- Update audit_logs RLS to allow DPO read access
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Allow admins and DPO to view all logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin() OR public.is_dpo());

-- Update profiles RLS to allow DPO read-only access
CREATE POLICY "DPO can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_dpo());

-- Create audit_summaries table for monthly reports
CREATE TABLE IF NOT EXISTS public.audit_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL CHECK (period_year >= 2024),
  summary JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id),
  UNIQUE (period_month, period_year)
);

-- Enable RLS on audit_summaries
ALTER TABLE public.audit_summaries ENABLE ROW LEVEL SECURITY;

-- Only admin and DPO can view summaries
CREATE POLICY "Admin and DPO can view summaries" ON public.audit_summaries
  FOR SELECT USING (public.is_admin() OR public.is_dpo());

-- Only admin can insert summaries
CREATE POLICY "Admin can insert summaries" ON public.audit_summaries
  FOR INSERT WITH CHECK (public.is_admin());

-- Create function to generate audit summary
CREATE OR REPLACE FUNCTION public.generate_audit_summary(
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_actions', COUNT(*),
    'by_action_type', jsonb_object_agg(action_type, action_count),
    'by_entity_type', jsonb_object_agg(entity_type, entity_count),
    'unique_users', COUNT(DISTINCT user_id),
    'period', jsonb_build_object('month', p_month, 'year', p_year)
  ) INTO v_summary
  FROM (
    SELECT 
      action_type,
      entity_type,
      user_id,
      COUNT(*) OVER (PARTITION BY action_type) as action_count,
      COUNT(*) OVER (PARTITION BY entity_type) as entity_count
    FROM audit_logs
    WHERE EXTRACT(MONTH FROM created_at) = p_month
      AND EXTRACT(YEAR FROM created_at) = p_year
  ) counts;
  
  RETURN COALESCE(v_summary, '{}'::jsonb);
END;
$$;

-- Add trigger for updated_at on data_subject_requests
CREATE TRIGGER update_data_subject_requests_updated_at
  BEFORE UPDATE ON public.data_subject_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();