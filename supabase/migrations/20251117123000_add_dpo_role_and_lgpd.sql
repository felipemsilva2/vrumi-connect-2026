ALTER TYPE public.app_role ADD VALUE 'dpo';

CREATE OR REPLACE FUNCTION public.is_dpo(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = COALESCE(is_dpo.user_id, auth.uid())
      AND user_roles.role = 'dpo'
  );
$$;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (is_admin());

DROP POLICY IF EXISTS "DPO can view all audit logs" ON public.audit_logs;
CREATE POLICY "DPO can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (is_dpo());

CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('access','rectification','deletion','portability')),
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','completed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  handled_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own dsr" ON public.data_subject_requests;
CREATE POLICY "Users can view own dsr"
ON public.data_subject_requests FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own dsr" ON public.data_subject_requests;
CREATE POLICY "Users can insert own dsr"
ON public.data_subject_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin and DPO can manage dsr" ON public.data_subject_requests;
CREATE POLICY "Admin and DPO can manage dsr"
ON public.data_subject_requests FOR ALL
USING (is_admin() OR is_dpo());

CREATE OR REPLACE FUNCTION public.cleanup_audit_logs(retention_months INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - (retention_months || ' months')::INTERVAL;
END;
$$;

-- Conceder leitura ao DPO em perfis e atividades de usuários
DO $$
BEGIN
  BEGIN
    CREATE POLICY "DPO can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.is_dpo());
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "DPO can view all activities"
    ON public.user_activities FOR SELECT
    TO authenticated
    USING (public.is_dpo());
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
