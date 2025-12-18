-- 1. Remove a restrição antiga de status para podermos adicionar o 'pending'
ALTER TABLE student_packages 
DROP CONSTRAINT IF EXISTS student_packages_status_check;

-- 2. Adiciona a nova restrição com o status 'pending' incluído
ALTER TABLE student_packages 
ADD CONSTRAINT student_packages_status_check 
CHECK (status IN ('active', 'completed', 'cancelled', 'refunded', 'pending'));

-- 3. Adiciona a coluna 'metadata' (que está causando o erro no app)
ALTER TABLE student_packages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 4. Adiciona um comentário para documentação
COMMENT ON COLUMN student_packages.status IS 'Status da compra. pending é usado durante o checkout.';