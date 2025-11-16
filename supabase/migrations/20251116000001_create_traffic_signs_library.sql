-- Create traffic_signs table for library functionality
CREATE TABLE IF NOT EXISTS public.traffic_signs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE, -- e.g., R-1, A-10, etc.
    name VARCHAR(255) NOT NULL, -- e.g., "Parada Obrigatória"
    category VARCHAR(50) NOT NULL CHECK (category IN ('Regulamentação', 'Advertência', 'Serviços Auxiliares', 'Indicação', 'Obras')),
    image_url TEXT, -- URL da imagem da placa
    description TEXT NOT NULL, -- Descrição detalhada da placa
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by category
CREATE INDEX idx_traffic_signs_category ON public.traffic_signs(category);
CREATE INDEX idx_traffic_signs_code ON public.traffic_signs(code);

-- Enable RLS
ALTER TABLE public.traffic_signs ENABLE ROW LEVEL SECURITY;

-- Grant permissions for reading (everyone can view the library)
GRANT SELECT ON public.traffic_signs TO anon;
GRANT SELECT ON public.traffic_signs TO authenticated;

-- Insert sample Brazilian traffic signs data
INSERT INTO public.traffic_signs (code, name, category, image_url, description) VALUES
-- Regulamentação
('R-1', 'Parada Obrigatória', 'Regulamentação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Red%20octagonal%20traffic%20sign%20with%20white%20border%20and%20white%20%22PARE%22%20text%20in%20center%2C%20clean%20professional%20style&image_size=square', 'O condutor deve parar completamente o veículo antes da linha de parada ou antes de entrar na via transversal. Só deve prosseguir quando a via estiver livre e for seguro fazê-lo.'),
('R-2', 'Dê a Preferência', 'Regulamentação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=White%20triangular%20traffic%20sign%20with%20red%20border%20and%20black%20%22D%C3%8A%20PREFER%C3%8ANCIA%22%20text%2C%20clean%20professional%20style&image_size=square', 'O condutor deve ceder a passagem aos veículos que trafegam na via preferencial. Só deve prosseguir quando for seguro fazê-lo.'),
('R-3', 'Proibido Virar à Esquerda', 'Regulamentação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=White%20circular%20traffic%20sign%20with%20red%20border%20and%20black%20arrow%20turning%20left%20with%20red%20diagonal%20line%20through%20it%2C%20clean%20professional%20style&image_size=square', 'Proibido virar à esquerda. O condutor deve continar em frente ou procurar outra rota.'),
('R-4', 'Proibido Virar à Direita', 'Regulamentação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=White%20circular%20traffic%20sign%20with%20red%20border%20and%20black%20arrow%20turning%20right%20with%20red%20diagonal%20line%20through%20it%2C%20clean%20professional%20style&image_size=square', 'Proibido virar à direita. O condutor deve continar em frente ou procurar outra rota.'),
('R-5', 'Proibido Retornar', 'Regulamentação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=White%20circular%20traffic%20sign%20with%20red%20border%20and%20black%20U-turn%20arrow%20with%20red%20diagonal%20line%20through%20it%2C%20clean%20professional%20style&image_size=square', 'Proibido fazer retorno ou meia-volta. O condutor deve continuar em frente ou procurar outra rota.'),
('R-6', 'Proibido Estacionar', 'Regulamentação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=White%20circular%20traffic%20sign%20with%20blue%20background%20and%20red%20border%20with%20red%20diagonal%20line%20and%20black%20%22E%22%20letter%2C%20clean%20professional%20style&image_size=square', 'Proibido estacionar o veículo. Pode ser permitido parar temporariamente para embarque ou desembarque.'),
('R-7', 'Proibido Parar ou Estacionar', 'Regulamentação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=White%20circular%20traffic%20sign%20with%20red%20border%20and%20two%20diagonal%20red%20lines%20forming%20an%20X%2C%20clean%20professional%20style&image_size=square', 'Proibido parar ou estacionar o veículo por qualquer motivo.'),
('R-8', 'Velocidade Máxima Permitida', 'Regulamentação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=White%20circular%20traffic%20sign%20with%20red%20border%20and%20black%20number%20%2260%22%20in%20center%2C%20clean%20professional%20style&image_size=square', 'Velocidade máxima permitida em km/h. O condutor não deve ultrapassar esta velocidade.'),
('R-9', 'Proibido Ultrapassar', 'Regulamentação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=White%20circular%20traffic%20sign%20with%20red%20border%20and%20two%20cars%20side%20by%20side%20with%20red%20diagonal%20line%20through%20them%2C%20clean%20professional%20style&image_size=square', 'Proibido ultrapassar outros veículos. Deve manter distância de segurança.'),
('R-10', 'Proibido o Trânsito de Cargas Perigosas', 'Regulamentação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=White%20circular%20traffic%20sign%20with%20red%20border%20and%20black%20truck%20symbol%20with%20danger%20sign%20and%20red%20diagonal%20line%2C%20clean%20professional%20style&image_size=square', 'Proibido o trânsito de veículos transportando cargas perigosas.'),

-- Advertência
('A-1', 'Curva à Esquerda', 'Advertência', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Yellow%20diamond%20traffic%20sign%20with%20black%20arrow%20curving%20left%2C%20clean%20professional%20style&image_size=square', 'A via faz curva acentuada para a esquerda. Reduza a velocidade e mantenha-se à direita.'),
('A-2', 'Curva à Direita', 'Advertência', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Yellow%20diamond%20traffic%20sign%20with%20black%20arrow%20curving%20right%2C%20clean%20professional%20style&image_size=square', 'A via faz curva acentuada para a direita. Reduza a velocidade e mantenha-se à esquerda.'),
('A-3', 'Curvas em S', 'Advertência', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Yellow%20diamond%20traffic%20sign%20with%20black%20S-shaped%20arrows%2C%20clean%20professional%20style&image_size=square', 'A via tem curvas em S. Reduza a velocidade e aumente a atenção.'),
('A-4', 'Redutor de Velocidade', 'Advertência', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Yellow%20diamond%20traffic%20sign%20with%20black%20speed%20bump%20symbol%2C%20clean%20professional%20style&image_size=square', 'Presença de redutor de velocidade (lombada). Reduza a velocidade.'),
('A-5', 'Passagem de Pedestres', 'Advertência', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Yellow%20diamond%20traffic%20sign%20with%20black%20pedestrian%20crossing%20symbol%2C%20clean%20professional%20style&image_size=square', 'Passagem de pedestres. Reduza a velocidade e esteja preparado para parar.'),
('A-6', 'Escolas', 'Advertência', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Yellow%20diamond%20traffic%20sign%20with%20black%20school%20children%20symbol%2C%20clean%20professional%20style&image_size=square', 'Proximidade de escola. Reduza a velocidade e aumente a atenção com crianças.'),
('A-7', 'Animais na Pista', 'Advertência', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Yellow%20diamond%20traffic%20sign%20with%20black%20deer%20animal%20symbol%2C%20clean%20professional%20style&image_size=square', 'Animais podem atravessar a pista. Aumente a atenção e reduza a velocidade.'),
('A-8', 'Via Estreita', 'Advertência', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Yellow%20diamond%20traffic%20sign%20with%20black%20narrow%20road%20arrows%2C%20clean%20professional%20style&image_size=square', 'A via se estreita. Reduza a velocidade e esteja preparado para dar preferência.'),
('A-9', 'Pista Escorregadia', 'Advertência', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Yellow%20diamond%20traffic%20sign%20with%20black%20car%20skidding%20symbol%2C%20clean%20professional%20style&image_size=square', 'Pista escorregadia em condições de chuva ou umidade. Reduza a velocidade.'),
('A-10', 'Cruzamento', 'Advertência', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Yellow%20diamond%20traffic%20sign%20with%20black%20crossroad%20symbol%2C%20clean%20professional%20style&image_size=square', 'Cruzamento à frente. Reduza a velocidade e esteja preparado para parar.'),

-- Serviços Auxiliares
('S-1', 'Posto de Gasolina', 'Serviços Auxiliares', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Blue%20square%20traffic%20sign%20with%20white%20gas%20pump%20symbol%2C%20clean%20professional%20style&image_size=square', 'Posto de gasolina disponível à direita.'),
('S-2', 'Restaurante', 'Serviços Auxiliares', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Blue%20square%20traffic%20sign%20with%20white%20fork%20and%20knife%20symbol%2C%20clean%20professional%20style&image_size=square', 'Restaurante disponível à direita.'),
('S-3', 'Hotel', 'Serviços Auxiliares', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Blue%20square%20traffic%20sign%20with%20white%20bed%20symbol%2C%20clean%20professional%20style&image_size=square', 'Hotel ou pousada disponível à direita.'),
('S-4', 'Hospital', 'Serviços Auxiliares', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Blue%20square%20traffic%20sign%20with%20white%20%22H%22%20letter%20and%20cross%2C%20clean%20professional%20style&image_size=square', 'Hospital ou serviço médico disponível à direita.'),
('S-5', 'Telefone', 'Serviços Auxiliares', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Blue%20square%20traffic%20sign%20with%20white%20telephone%20symbol%2C%20clean%20professional%20style&image_size=square', 'Telefone público disponível à direita.'),
('S-6', 'Oficina Mecânica', 'Serviços Auxiliares', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Blue%20square%20traffic%20sign%20with%20white%20wrench%20and%20car%20symbol%2C%20clean%20professional%20style&image_size=square', 'Oficina mecânica disponível à direita.'),

-- Indicação
('I-1', 'Placa de Confirmação de Direção', 'Indicação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Green%20square%20traffic%20sign%20with%20white%20arrow%20pointing%20forward%2C%20clean%20professional%20style&image_size=square', 'Confirmação da direção para seguir em frente.'),
('I-2', 'Placa de Confirmação de Direção à Esquerda', 'Indicação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Green%20square%20traffic%20sign%20with%20white%20arrow%20pointing%20left%2C%20clean%20professional%20style&image_size=square', 'Confirmação da direção para virar à esquerda.'),
('I-3', 'Placa de Confirmação de Direção à Direita', 'Indicação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Green%20square%20traffic%20sign%20with%20white%20arrow%20pointing%20right%2C%20clean%20professional%20style&image_size=square', 'Confirmação da direção para virar à direita.'),
('I-4', 'Distância', 'Indicação', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Green%20rectangular%20traffic%20sign%20with%20white%20number%20%22500m%22%2C%20clean%20professional%20style&image_size=square', 'Distância até o destino ou ponto de referência.'),

-- Obras
('O-1', 'Trabalhadores na Pista', 'Obras', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Orange%20diamond%20traffic%20sign%20with%20black%20worker%20symbol%2C%20clean%20professional%20style&image_size=square', 'Trabalhadores na pista. Reduza a velocidade e aumente a atenção.'),
('O-2', 'Desvio', 'Obras', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Orange%20diamond%20traffic%20sign%20with%20black%20detour%20arrow%2C%20clean%20professional%20style&image_size=square', 'Desvio obrigatório devido a obras. Siga a sinalização auxiliar.');