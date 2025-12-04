-- Criar Enums (Tipos personalizados)
DO $$ BEGIN
    CREATE TYPE ticket_priority_support AS ENUM ('normal', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status_support AS ENUM ('open', 'in_progress', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar Tabela de Tickets de Suporte
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Habilitar Segurança (RLS)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso

-- 1. Usuários podem ver apenas seus próprios tickets
CREATE POLICY "Users can view their own support tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Usuários podem criar tickets (apenas para si mesmos)
CREATE POLICY "Users can create support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Admins podem ver TODOS os tickets
CREATE POLICY "Admins can view all support tickets"
  ON public.support_tickets FOR SELECT
  USING (public.is_admin());

-- 4. Admins podem atualizar tickets (responder/resolver)
CREATE POLICY "Admins can update support tickets"
  ON public.support_tickets FOR UPDATE
  USING (public.is_admin());