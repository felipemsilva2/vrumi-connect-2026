-- Create enum for pass types
CREATE TYPE public.pass_type AS ENUM ('30_days', '90_days');

-- Create user_passes table
CREATE TABLE public.user_passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pass_type public.pass_type NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_passes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own passes"
ON public.user_passes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own passes"
ON public.user_passes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to check if user has active pass
CREATE OR REPLACE FUNCTION public.has_active_pass(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_passes
    WHERE user_passes.user_id = has_active_pass.user_id
      AND payment_status = 'completed'
      AND expires_at > now()
  )
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_user_passes_updated_at
BEFORE UPDATE ON public.user_passes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();