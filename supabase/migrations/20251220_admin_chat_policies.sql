-- RLS Policies for Admin to view all chats
-- This allows admins to monitor conversations for support purposes

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
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- Policy for admin to view all chat messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'connect_chat_messages' 
    AND policyname = 'Admins can view all chat messages'
  ) THEN
    CREATE POLICY "Admins can view all chat messages"
    ON public.connect_chat_messages FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- Policy for admin to view all support tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_tickets' 
    AND policyname = 'Admins can view all tickets'
  ) THEN
    CREATE POLICY "Admins can view all tickets"
    ON public.support_tickets FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- Update support_tickets admin update policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_tickets' 
    AND policyname = 'Admins can update tickets'
  ) THEN
    CREATE POLICY "Admins can update tickets"
    ON public.support_tickets FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- Create admin levels enum and update user_roles
-- Levels: super_admin (full access), support (support only), viewer (read-only)
DO $$
BEGIN
    CREATE TYPE admin_level AS ENUM ('super_admin', 'support', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add admin_level column to user_roles
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS admin_level TEXT DEFAULT 'support'
CHECK (admin_level IN ('super_admin', 'support', 'viewer'));

COMMENT ON COLUMN public.user_roles.admin_level IS 
'Admin level: super_admin (full access), support (customer support), viewer (read-only)';
