-- 1. Add document verification columns to instructors table
ALTER TABLE public.instructors
ADD COLUMN cnh_document_url TEXT,
ADD COLUMN vehicle_document_url TEXT,
ADD COLUMN documents_status TEXT DEFAULT 'pending' CHECK (documents_status IN ('pending', 'submitted', 'verified', 'rejected'));

-- 2. Add location columns to instructors table
ALTER TABLE public.instructors
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add comments
COMMENT ON COLUMN public.instructors.cnh_document_url IS 'URL do documento CNH do instrutor';
COMMENT ON COLUMN public.instructors.vehicle_document_url IS 'URL do documento CRLV do veículo';
COMMENT ON COLUMN public.instructors.documents_status IS 'Status da verificação de documentos: pending, submitted, verified, rejected';
COMMENT ON COLUMN public.instructors.latitude IS 'Latitude da localização do instrutor';
COMMENT ON COLUMN public.instructors.longitude IS 'Longitude da localização do instrutor';

-- 3. Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_participants CHECK (participant_1 != participant_2)
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- 4. Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  )
);

CREATE POLICY "Users can update messages they received"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create index for faster queries
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_conversations_participants ON public.conversations(participant_1, participant_2);

-- 5. Create push_tokens table
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Enable RLS on push_tokens
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for push_tokens
CREATE POLICY "Users can view their own push tokens"
ON public.push_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
ON public.push_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
ON public.push_tokens FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
ON public.push_tokens FOR DELETE
USING (auth.uid() = user_id);

-- 6. Create storage bucket for instructor documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('instructor-documents', 'instructor-documents', false);

-- Storage policies for instructor-documents bucket
CREATE POLICY "Instructors can upload their documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'instructor-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'instructor-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'instructor-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all instructor documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'instructor-documents'
  AND is_admin()
);