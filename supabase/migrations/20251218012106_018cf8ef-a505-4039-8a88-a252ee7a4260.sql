-- Internal Chat System for Marketplace
-- Prevents platform leakage and keeps communication secure

-- 1. Chat Rooms (Conversations between specific Student and Instructor)
CREATE TABLE IF NOT EXISTS public.connect_chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    unread_count_student INTEGER DEFAULT 0,
    unread_count_instructor INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, instructor_id)
);

-- 2. Chat Messages
CREATE TABLE IF NOT EXISTS public.connect_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.connect_chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_student ON public.connect_chat_rooms(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_instructor ON public.connect_chat_rooms(instructor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.connect_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.connect_chat_messages(created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.connect_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Chat Rooms
CREATE POLICY "Users can view rooms they belong to" ON public.connect_chat_rooms
    FOR SELECT USING (
        auth.uid() = student_id OR 
        EXISTS (
            SELECT 1 FROM public.instructors 
            WHERE instructors.id = instructor_id AND instructors.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create rooms they belong to" ON public.connect_chat_rooms
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 6. Policies for Chat Messages
CREATE POLICY "Users can view messages in their rooms" ON public.connect_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.connect_chat_rooms 
            WHERE id = room_id AND (
                student_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.instructors 
                    WHERE instructors.id = instructor_id AND instructors.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can send messages to their rooms" ON public.connect_chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.connect_chat_rooms 
            WHERE id = room_id AND (
                student_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.instructors 
                    WHERE instructors.id = instructor_id AND instructors.user_id = auth.uid()
                )
            )
        )
    );

-- 7. Trigger to update last_message in chat_rooms
CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.connect_chat_rooms
    SET 
        last_message = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = NOW(),
        unread_count_instructor = CASE 
            WHEN NEW.sender_id = student_id THEN unread_count_instructor + 1 
            ELSE unread_count_instructor 
        END,
        unread_count_student = CASE 
            WHEN NEW.sender_id != student_id THEN unread_count_student + 1 
            ELSE unread_count_student 
        END
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_new_chat_message
AFTER INSERT ON public.connect_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.handle_new_chat_message();

-- 8. Enable Realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.connect_chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connect_chat_messages;