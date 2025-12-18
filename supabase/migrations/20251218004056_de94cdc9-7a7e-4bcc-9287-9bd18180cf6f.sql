-- Adiciona a coluna para vincular aulas a pacotes
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS use_package_id UUID REFERENCES student_packages(id) ON DELETE SET NULL;

COMMENT ON COLUMN bookings.use_package_id IS 'Referência ao pacote do aluno usado para este agendamento';