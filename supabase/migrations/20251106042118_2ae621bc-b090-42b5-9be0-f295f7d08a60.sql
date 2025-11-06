-- FASE 1: Criação da Nova Arquitetura de Banco de Dados

-- Migration 1: Criar tabela study_modules
CREATE TABLE IF NOT EXISTS study_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  order_number int NOT NULL,
  icon text,
  estimated_hours int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policy para study_modules
ALTER TABLE study_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view study modules"
  ON study_modules FOR SELECT
  USING (true);

-- Migration 2: Modificar study_chapters para adicionar module_id
ALTER TABLE study_chapters 
  ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES study_modules(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chapters_module ON study_chapters(module_id);

-- Migration 3: Criar tabela lesson_contents
CREATE TABLE IF NOT EXISTS lesson_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES study_lessons(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN (
    'heading', 'paragraph', 'list', 'image', 'quote', 
    'law_article', 'table', 'highlight_box', 'warning'
  )),
  content_data jsonb NOT NULL,
  order_position int NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lesson_id, order_position)
);

CREATE INDEX IF NOT EXISTS idx_contents_lesson ON lesson_contents(lesson_id);
CREATE INDEX IF NOT EXISTS idx_contents_type ON lesson_contents(content_type);

-- RLS Policy para lesson_contents
ALTER TABLE lesson_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson contents"
  ON lesson_contents FOR SELECT
  USING (true);

-- Migration 4: Modificar study_lessons removendo colunas antigas
ALTER TABLE study_lessons 
  DROP COLUMN IF EXISTS content,
  DROP COLUMN IF EXISTS images;

-- FASE 2: Limpeza dos Dados Antigos
DELETE FROM user_progress;
DELETE FROM study_lessons;
DELETE FROM study_chapters;

-- FASE 3: População dos Novos Dados Estruturados

-- 3.1. Inserir os 5 Módulos Principais
INSERT INTO study_modules (code, title, description, order_number, icon, estimated_hours)
VALUES
  ('PMAC', 'Meio Ambiente e Convívio Social', 'Noções de Proteção e Respeito ao Meio Ambiente e de Convívio Social no Trânsito', 1, '🌍', 12),
  ('DD', 'Direção Defensiva', 'Técnicas e práticas para uma condução segura e preventiva', 2, '🛡️', 15),
  ('LT', 'Legislação de Trânsito', 'Código de Trânsito Brasileiro, normas, infrações e penalidades', 3, '⚖️', 20),
  ('NFV', 'Mecânica Básica', 'Noções sobre Funcionamento do Veículo e manutenção preventiva', 4, '🔧', 10),
  ('PS', 'Primeiros Socorros', 'Noções de atendimento emergencial e proteção no trânsito', 5, '🏥', 8)
ON CONFLICT (code) DO NOTHING;

-- 3.2. Inserir Capítulos estruturados do PDF

-- Módulo PMAC (Meio Ambiente e Convívio Social)
WITH pmac AS (SELECT id FROM study_modules WHERE code = 'PMAC')
INSERT INTO study_chapters (module_id, title, description, order_number, estimated_time, icon)
SELECT 
  pmac.id,
  unnest(ARRAY[
    'Meio Ambiente',
    'Convívio Social no Trânsito',
    'Cidadania e Ética no Trânsito'
  ]),
  unnest(ARRAY[
    'Poluição atmosférica, sonora, visual e sustentabilidade',
    'Relacionamento interpessoal, comunicação e grupos sociais',
    'Responsabilidade social e ética'
  ]),
  unnest(ARRAY[1, 2, 3]),
  unnest(ARRAY['4h', '4h', '4h']),
  unnest(ARRAY['🌱', '🤝', '⭐'])
FROM pmac;

-- Módulo DD (Direção Defensiva)
WITH dd AS (SELECT id FROM study_modules WHERE code = 'DD')
INSERT INTO study_chapters (module_id, title, description, order_number, estimated_time, icon)
SELECT 
  dd.id,
  unnest(ARRAY[
    'Conceitos de Direção Defensiva',
    'Sinistros de Trânsito',
    'Elementos da Direção Defensiva',
    'Condições Adversas',
    'Usuários Vulneráveis',
    'Fatores de Risco'
  ]),
  unnest(ARRAY[
    'O que é e importância da direção defensiva',
    'Causas e consequências de acidentes',
    'Conhecimento, atenção, previsão, decisão e habilidade',
    'Condições de luz, tempo, via e trânsito',
    'Pedestres, ciclistas, motociclistas, idosos e crianças',
    'Álcool, drogas, fadiga, velocidade e celular'
  ]),
  unnest(ARRAY[1, 2, 3, 4, 5, 6]),
  unnest(ARRAY['2h', '2h', '3h', '3h', '3h', '2h']),
  unnest(ARRAY['🎯', '⚠️', '🧠', '🌧️', '🚶', '⛔'])
FROM dd;

-- Módulo LT (Legislação de Trânsito)
WITH lt AS (SELECT id FROM study_modules WHERE code = 'LT')
INSERT INTO study_chapters (module_id, title, description, order_number, estimated_time, icon)
SELECT 
  lt.id,
  unnest(ARRAY[
    'Sistema Nacional de Trânsito',
    'Direitos e Deveres',
    'Veículos e Documentação',
    'Categorias da CNH',
    'Normas de Circulação',
    'Sinalização de Trânsito',
    'Infrações e Penalidades'
  ]),
  unnest(ARRAY[
    'Estrutura e órgãos do SNT',
    'Dos condutores, pedestres e passageiros',
    'Registro, licenciamento, CRLV e CRV',
    'Categorias A, B, C, D, E, ACC e Permissão',
    'Regras gerais, ultrapassagem e preferência',
    'Vertical, horizontal, semafórica e gestos',
    'Tipos de infrações, pontuação, multas e suspensão'
  ]),
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]),
  unnest(ARRAY['2h', '3h', '3h', '2h', '3h', '4h', '3h']),
  unnest(ARRAY['🏛️', '📋', '📄', '🪪', '🛣️', '🚦', '❌'])
FROM lt;

-- Módulo NFV (Mecânica Básica)
WITH nfv AS (SELECT id FROM study_modules WHERE code = 'NFV')
INSERT INTO study_chapters (module_id, title, description, order_number, estimated_time, icon)
SELECT 
  nfv.id,
  unnest(ARRAY[
    'Equipamentos Obrigatórios',
    'Sistemas do Veículo',
    'Manutenção Preventiva',
    'Condução Econômica'
  ]),
  unnest(ARRAY[
    'Triângulo, macaco, chave de roda e extintor',
    'Motor, freios, suspensão, direção e pneus',
    'Óleo, fluidos e filtros',
    'Economia de combustível e uso de marchas'
  ]),
  unnest(ARRAY[1, 2, 3, 4]),
  unnest(ARRAY['2h', '3h', '3h', '2h']),
  unnest(ARRAY['🧰', '⚙️', '🔧', '⛽'])
FROM nfv;

-- Módulo PS (Primeiros Socorros)
WITH ps AS (SELECT id FROM study_modules WHERE code = 'PS')
INSERT INTO study_chapters (module_id, title, description, order_number, estimated_time, icon)
SELECT 
  ps.id,
  unnest(ARRAY[
    'Proteção e Sinalização do Local',
    'Intervenção de Emergência',
    'Procedimentos Específicos'
  ]),
  unnest(ARRAY[
    'Segurança pessoal e sinalização',
    'Avaliação da vítima, SAMU e RCP',
    'Hemorragias, fraturas, queimaduras e choque'
  ]),
  unnest(ARRAY[1, 2, 3]),
  unnest(ARRAY['2h', '3h', '3h']),
  unnest(ARRAY['🚨', '🆘', '🩹'])
FROM ps;