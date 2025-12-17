-- Adicionar coluna para Antecedentes Criminais
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS background_check_url TEXT;

COMMENT ON COLUMN instructors.background_check_url IS 'URL of the Criminal Background Check document uploaded by the instructor';