-- Script SQL simplificado para criar tabelas essenciais
-- Execute este script diretamente no console SQL do Supabase

-- Criar tabela de notificações (simplificada)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de placas de trânsito (simplificada)
CREATE TABLE IF NOT EXISTS traffic_signs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    sign_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    meaning TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de progresso (simplificada)
CREATE TABLE IF NOT EXISTS traffic_signs_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    sign_id UUID NOT NULL,
    times_studied INTEGER DEFAULT 0,
    mastered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, sign_id)
);

-- Conceder permissões básicas
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON traffic_signs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON traffic_signs_progress TO anon, authenticated;

-- Inserir algumas placas básicas
INSERT INTO traffic_signs (category, sign_type, title, description, meaning) VALUES
('regulatory', 'stop', 'Pare', 'Placa de parada obrigatória', 'Obriga o condutor a parar completamente'),
('regulatory', 'yield', 'Ceda a Passagem', 'Placa de cedência de passagem', 'Obriga o condutor a ceder passagem'),
('warning', 'curve', 'Curva', 'Placa de advertência de curva', 'Advertência sobre curva perigosa'),
('informational', 'hospital', 'Hospital', 'Placa de informação de hospital', 'Indica proximidade de hospital');

-- Verificar se foi criado
SELECT 'notifications' as tabela, COUNT(*) as total FROM notifications
UNION ALL
SELECT 'traffic_signs' as tabela, COUNT(*) as total FROM traffic_signs
UNION ALL
SELECT 'traffic_signs_progress' as tabela, COUNT(*) as total FROM traffic_signs_progress;