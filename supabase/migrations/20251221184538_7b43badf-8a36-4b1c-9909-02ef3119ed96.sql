-- Chat Violations Table for Harassment/Policy Violation Detection
-- Records blocked messages and their violation types for admin review

-- 1. Create the violations table
CREATE TABLE IF NOT EXISTS public.connect_chat_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.connect_chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL,
    violation_type TEXT NOT NULL CHECK (violation_type IN ('contact_attempt', 'harassment', 'threat', 'offensive')),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    keywords_matched TEXT[] DEFAULT '{}',
    reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    action_taken TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_violations_room_id ON public.connect_chat_violations(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_violations_sender_id ON public.connect_chat_violations(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_violations_created_at ON public.connect_chat_violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_violations_violation_type ON public.connect_chat_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_chat_violations_reviewed ON public.connect_chat_violations(reviewed) WHERE reviewed = false;

-- 3. Enable RLS
ALTER TABLE public.connect_chat_violations ENABLE ROW LEVEL SECURITY;

-- 4. Policies - Only admins can view/manage violations (using is_admin() function)
CREATE POLICY "Admins can view all violations" ON public.connect_chat_violations
    FOR SELECT USING (is_admin());

CREATE POLICY "System can insert violations" ON public.connect_chat_violations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update violations" ON public.connect_chat_violations
    FOR UPDATE USING (is_admin());