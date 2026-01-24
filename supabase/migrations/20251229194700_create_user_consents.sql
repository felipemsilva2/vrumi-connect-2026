-- Create user_consents table for LGPD compliance
-- This table stores all user consent records with versioning and audit trail

CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'marketing', 'cookies')),
  version TEXT NOT NULL, -- Version of the document accepted (e.g., '1.0', '2024-12-29')
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB, -- Additional context (device info, location, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX idx_user_consents_type ON public.user_consents(consent_type);
CREATE INDEX idx_user_consents_active ON public.user_consents(user_id, consent_type) WHERE revoked_at IS NULL;

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consents
CREATE POLICY "Users can view own consents" ON public.user_consents
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own consents (via edge function for audit trail)
CREATE POLICY "Users can create own consents" ON public.user_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own consents (for revocation)
CREATE POLICY "Users can update own consents" ON public.user_consents
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin and DPO can view all consents
CREATE POLICY "Admin and DPO can view all consents" ON public.user_consents
  FOR SELECT USING (public.is_admin() OR public.is_dpo());

-- Add trigger for updated_at
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has valid consent
CREATE OR REPLACE FUNCTION public.has_valid_consent(
  p_user_id UUID,
  p_consent_type TEXT,
  p_min_version TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_consents
    WHERE user_id = p_user_id
      AND consent_type = p_consent_type
      AND revoked_at IS NULL
      AND (p_min_version IS NULL OR version >= p_min_version)
  )
$$;

-- Create function to get latest consent version
CREATE OR REPLACE FUNCTION public.get_latest_consent(
  p_user_id UUID,
  p_consent_type TEXT
)
RETURNS TABLE (
  id UUID,
  version TEXT,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, version, accepted_at, revoked_at
  FROM public.user_consents
  WHERE user_id = p_user_id
    AND consent_type = p_consent_type
  ORDER BY accepted_at DESC
  LIMIT 1
$$;

-- Insert comment for documentation
COMMENT ON TABLE public.user_consents IS 'Stores user consent records for LGPD compliance with versioning and audit trail';
COMMENT ON COLUMN public.user_consents.consent_type IS 'Type of consent: terms, privacy, marketing, cookies';
COMMENT ON COLUMN public.user_consents.version IS 'Version of the document that was accepted';
COMMENT ON COLUMN public.user_consents.revoked_at IS 'When the consent was revoked (NULL if still active)';
