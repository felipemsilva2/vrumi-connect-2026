-- Policy for admin to view all chat rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'connect_chat_rooms' 
    AND policyname = 'Admins can view all chat rooms'
  ) THEN
    CREATE POLICY "Admins can view all chat rooms"
    ON public.connect_chat_rooms FOR SELECT
    USING (is_admin());
  END IF;
END $$;

-- Add admin_level column to user_roles
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS admin_level TEXT DEFAULT 'support'
CHECK (admin_level IN ('super_admin', 'support', 'viewer'));

COMMENT ON COLUMN public.user_roles.admin_level IS 
'Admin level: super_admin (full access), support (customer support), viewer (read-only)';