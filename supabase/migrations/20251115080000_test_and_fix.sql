-- Teste simples para verificar se as tabelas e funções foram criadas
-- Execute este script no console SQL do Supabase

-- Verificar se as tabelas existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('traffic_signs', 'traffic_signs_progress', 'notifications', 'achievements', 'battles');

-- Verificar se as funções existem
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_unread_notifications', 'create_study_reminders', 'create_streak_reminders');

-- Verificar permissões
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated')
AND table_name IN ('traffic_signs', 'traffic_signs_progress', 'notifications');

-- Se nada existir, criar uma versão mínima
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conceder permissões básicas
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO anon, authenticated;

-- Inserir notificação de teste
INSERT INTO notifications (user_id, type, title, message) VALUES
('00000000-0000-0000-0000-000000000000', 'test', 'Sistema Online', 'O sistema de notificações está funcionando!');

-- Verificar se a notificação foi criada
SELECT COUNT(*) as total_notificacoes FROM notifications;