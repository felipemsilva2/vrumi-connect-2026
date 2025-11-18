# Product Requirements Document (PRD) - Vrumi

## Visão Geral do Produto

**Nome do Produto:** Vrumi  
**Descrição:** Plataforma de estudos para preparação para o exame de CNH (Carteira Nacional de Habilitação) com inteligência artificial, conteúdo personalizado e suporte completo ao aprendizado de direção.  
**Status:** Em desenvolvimento  
**Versão:** 1.0  

## Objetivos do Produto

1. **Principal:** Democratizar o acesso ao aprendizado de direção no Brasil através de uma plataforma acessível e inteligente
2. **Secundários:**
   - Reduzir a taxa de reprovação no exame de CNH
   - Proporcionar experiência de aprendizado personalizada com IA
   - Oferecer conteúdo atualizado conforme legislação de trânsito
   - Criar comunidade de aprendizado entre candidatos

## Análise de Mercado

### Público-Alvo
- **Primário:** Jovens de 18-35 anos em processo de habilitação
- **Secundário:** Adultos acima de 35 anos buscando reciclagem ou mudança de categoria
- **Terciário:** Candidatos que já reprovaram e buscam preparação adicional

### Tamanho do Mercado
- Mercado brasileiro de CNH: ~3 milhões de novas habilitações/ano
- Taxa de reprovação média: 40-50%
- Potencial de crescimento: Alto, com demanda constante

### Concorrentes
- Autoescolas tradicionais
- Aplicativos de simulado (CFC, Direção Fácil)
- Cursos online genéricos

### Diferenciais Competitivos
- IA personalizada para análise de erros e criação de conteúdo
- Preço acessível comparado a cursos presenciais
- Conteúdo gerado sob demanda baseado em dificuldades do usuário
- Interface moderna e gamificada

## Requisitos Funcionais

### 1. Sistema de Autenticação

#### 1.1 Registro e Login
- **RF001:** Permitir registro com email e senha
- **RF002:** Permitir login com Google OAuth
- **RF003:** Implementar recuperação de senha por email
- **RF004:** Validar email através de link de confirmação
- **RF005:** Manter sessão ativa com refresh tokens

#### 1.2 Gestão de Perfil
- **RF006:** Editar informações pessoais (nome, email, foto)
- **RF007:** Visualizar histórico de atividades
- **RF008:** Configurar preferências de notificação
- **RF009:** Gerenciar assinatura e pagamentos

### 2. Sistema de Assinaturas e Pagamentos

#### 2.1 Planos de Assinatura
- **RF010:** Plano Individual (mensal/anual)
- **RF011:** Plano Família (até 5 usuários)
- **RF012:** Período de teste gratuito de 7 dias
- **RF013:** Upgrade/downgrade de planos

#### 2.2 Processamento de Pagamentos
- **RF014:** Integração com Stripe para pagamentos
- **RF015:** Suporte a cartão de crédito e boleto
- **RF016:** Cancelamento automático em caso de falha de pagamento
- **RF017:** Emissão de nota fiscal eletrônica
- **RF018:** Histórico de transações

### 3. Sistema de Estudos

#### 3.1 Sala de Estudo Principal
- **RF019:** Leitor de PDF integrado para conteúdo teórico
- **RF020:** Seleção de texto com tooltip de ações
- **RF021:** Chat com IA para tirar dúvidas sobre o conteúdo
- **RF022:** Geração de flashcards a partir de seleção de texto
- **RF023:** Criação de anotações pessoais
- **RF024:** Modo leitura para dispositivos móveis

#### 3.2 Sistema de Flashcards
- **RF025:** Criar flashcards personalizados
- **RF026:** Estudar com sistema de repetição espaçada
- **RF027:** Visualizar estatísticas de desempenho
- **RF028:** Compartilhar flashcards com a comunidade
- **RF029:** Importar/Exportar flashcards

#### 3.3 Sistema de Quiz
- **RF030:** Quiz com perguntas de múltipla escolha
- **RF031:** Timer para simular prova real
- **RF032:** Feedback imediato com explicações
- **RF033:** Análise de desempenho por categoria
- **RF034:** Gerar quiz personalizado baseado em erros anteriores

### 4. Sistema de Inteligência Artificial

#### 4.1 Geração de Conteúdo
- **RF035:** Gerar explicações personalizadas para dúvidas
- **RF036:** Criar questões similares às que o usuário errou
- **RF037:** Resumir conteúdo de PDFs selecionados
- **RF038:** Criar mapas mentais de estudo
- **RF039:** Gerar dicas de estudo personalizadas

#### 4.2 Chat com IA
- **RF040:** Conversação contextual sobre legislação de trânsito
- **RF041:** Explicar sinais de trânsito e suas meanings
- **RF042:** Auxiliar na interpretação de questões da prova
- **RF043:** Disponível 24/7 para suporte ao estudo

### 5. Sistema de Sinais de Trânsito

#### 5.1 Banco de Dados de Sinais
- **RF044:** Catálogo completo de sinais de trânsito brasileiros
- **RF045:** Imagens ilustrativas de alta qualidade
- **RF046:** Descrição detalhada de cada sinal
- **RF047:** Categorização por tipo (regulamentação, advertência, etc.)
- **RF048:** Sistema de busca e filtro

#### 5.2 Estudo de Sinais
- **RF049:** Modo de estudo com flashcards de sinais
- **RF050:** Quiz específico sobre sinais de trânsito
- **RF051:** Estatísticas de acerto por categoria de sinal

### 6. Sistema de Notificações

#### 6.1 Notificações Push
- **RF052:** Lembretes de estudo diários
- **RF053:** Notificações sobre novos conteúdos
- **RF054:** Alertas sobre mudanças na legislação
- **RF055:** Avisos sobre expiração de assinatura

#### 6.2 Notificações por Email
- **RF056:** Confirmação de cadastro
- **RF057:** Recibo de pagamento
- **RF058:** Newsletter com dicas de estudo
- **RF059:** Notificações de segurança da conta

### 7. Sistema Administrativo

#### 7.1 Gestão de Usuários
- **RF060:** Visualizar lista de usuários
- **RF061:** Gerenciar status de assinaturas
- **RF062:** Visualizar logs de atividades
- **RF063:** Exportar dados de usuários
- **RF064:** Sistema de suporte ao cliente

#### 7.2 Gestão de Conteúdo
- **RF065:** Upload e gerenciamento de PDFs educativos
- **RF066:** Criar e editar questões de quiz
- **RF067:** Gerenciar banco de sinais de trânsito
- **RF068:** Moderar conteúdo da comunidade
- **RF069:** Gerar relatórios de uso

#### 7.3 Análise e Relatórios
- **RF070:** Dashboard com métricas gerais
- **RF071:** Relatórios financeiros detalhados
- **RF072:** Análise de engajamento por funcionalidade
- **RF073:** Exportação de dados para análise externa

### 8. Sistema de Comunidade

#### 8.1 Compartilhamento de Conteúdo
- **RF074:** Compartilhar flashcards criados
- **RF075:** Avaliar conteúdo compartilhado
- **RF076:** Comentar em flashcards da comunidade
- **RF077:** Seguir outros estudantes

#### 8.2 Ranking e Gamificação
- **RF078:** Sistema de pontos por atividades
- **RF079:** Ranking geral e por categoria
- **RF080:** Conquistas e badges
- **RF081:** Desafios semanais

## Requisitos Não-Funcionais

### 1. Desempenho
- **RNF001:** Tempo de carregamento < 3 segundos
- **RNF002:** Suporte a 10.000 usuários simultâneos
- **RNF003:** Disponibilidade 99.9% (exceto manutenções)
- **RNF004:** Resposta de API < 200ms (95º percentil)

### 2. Segurança
- **RNF005:** Criptografia de dados em repouso e em trânsito
- **RNF006:** Autenticação de dois fatores (2FA) opcional
- **RNF007:** Conformidade com LGPD (Lei Geral de Proteção de Dados)
- **RNF008:** Logs de auditoria para ações críticas
- **RNF009:** Proteção contra SQL injection e XSS

### 3. Escalabilidade
- **RNF010:** Arquitetura serverless para funções críticas
- **RNF011:** Cache distribuído para conteúdo estático
- **RNF012:** CDN para assets estáticos
- **RNF013:** Banco de dados com replicação automática

### 4. Usabilidade
- **RNF014:** Interface responsiva (mobile-first)
- **RNF015:** Suporte a leitores de tela (WCAG 2.1)
- **RNF016:** Tempo médio de onboarding < 5 minutos
- **RNF017:** Taxa de conclusão de cadastro > 80%

### 5. Manutenibilidade
- **RNF018:** Cobertura de testes > 80%
- **RNF019:** Documentação técnica completa
- **RNF020:** Monitoramento e alertas proativos
- **RNF021:** Deploy automatizado com rollback

## Arquitetura Técnica

### Stack Tecnológica

#### Frontend
- **Framework:** React 18 com TypeScript
- **Build:** Vite
- **Estilização:** TailwindCSS
- **UI Components:** Radix UI
- **Gerenciamento de Estado:** React Query, Zustand
- **Roteamento:** React Router DOM

#### Backend
- **Banco de Dados:** PostgreSQL (Supabase)
- **Funções Serverless:** Deno (Supabase Edge Functions)
- **Autenticação:** Supabase Auth
- **Pagamentos:** Stripe API
- **IA:** Google Gemini 2.5 Flash

#### Infraestrutura
- **Hospedagem:** Vercel (frontend) + Supabase (backend)
- **CDN:** Cloudflare
- **Monitoramento:** Sentry
- **Analytics:** Google Analytics

### Estrutura de Dados Principal

#### Usuários (users)
```sql
id: uuid (PK)
email: text (unique)
nome: text
avatar_url: text
assinatura_id: uuid (FK)
tipo_plano: text
status: text
created_at: timestamp
updated_at: timestamp
```

#### Assinaturas (subscriptions)
```sql
id: uuid (PK)
user_id: uuid (FK)
status: text
price_id: text
current_period_start: timestamp
current_period_end: timestamp
created_at: timestamp
```

#### Flashcards (flashcards)
```sql
id: uuid (PK)
user_id: uuid (FK)
pergunta: text
resposta: text
categoria: text
dificuldade: integer
vezes_estudado: integer
acertos: integer
compartilhado: boolean
```

#### Questões de Quiz (quiz_questions)
```sql
id: uuid (PK)
pergunta: text
opcoes: jsonb
resposta_correta: integer
categoria: text
subcategoria: text
explicacao: text
dificuldade: integer
```

#### Sinais de Trânsito (traffic_signs)
```sql
id: uuid (PK)
nome: text
descricao: text
imagem_url: text
categoria: text
codigo: text
```

#### Sessões de Chat (chat_sessions)
```sql
id: uuid (PK)
user_id: uuid (FK)
mensagens: jsonb
contexto: text
created_at: timestamp
updated_at: timestamp
```

## Fluxos de Usuário

### 1. Fluxo de Cadastro e Onboarding
1. Usuário acessa landing page
2. Clica em "Começar Grátis"
3. Escolhe método de cadastro (email ou Google)
4. Confirma email (se necessário)
5. Completa perfil com informações básicas
6. Inicia período de teste gratuito
7. Acessa tutorial interativo
8. Começa primeiro estudo

### 2. Fluxo de Estudo
1. Usuário acessa sala de estudo
2. Seleciona PDF ou conteúdo para estudar
3. Realiza leitura com suporte de IA
4. Cria flashcards durante leitura
5. Revisa flashcards com sistema de repetição
6. Realiza quiz para testar conhecimento
7. Analisa desempenho e áreas de melhoria
8. Repete ciclo com foco em pontos fracos

### 3. Fluxo de Pagamento
1. Usuário decide continuar após período gratuito
2. Escolhe plano (individual ou família)
3. Insere dados de pagamento
4. Processamento via Stripe
5. Confirmação de assinatura ativa
6. Acesso liberado a todos recursos
7. Renovação automática configurada

### 4. Fluxo de Suporte
1. Usuário encontra dificuldade técnica
2. Acessa seção de suporte
3. Busca em FAQ ou documentação
4. Cria ticket de suporte se necessário
5. Recebe resposta em até 24 horas
6. Problema resolvido ou escalado

## Métricas de Sucesso (KPIs)

### Métricas de Negócio
- **Taxa de Conversão:** Objetivo > 15% (trial para pago)
- **Churn Rate:** Objetivo < 5% mensal
- **LTV:** Objetivo > R$ 300 por cliente
- **CAC:** Objetivo < R$ 50 por cliente
- **MRR Growth:** Objetivo 20% mês a mês

### Métricas de Produto
- **DAU/MAU Ratio:** Objetivo > 40%
- **Tempo Médio de Sessão:** Objetivo > 30 minutos
- **Taxa de Conclusão de Quiz:** Objetivo > 70%
- **NPS:** Objetivo > 50
- **Tickets de Suporte:** Objetivo < 5% dos usuários ativos

### Métricas de Engajamento
- **Flashcards Criados por Usuário:** Objetivo > 50
- **Questões Respondidas:** Objetivo > 200 por usuário
- **Interações com IA:** Objetivo > 10 por sessão
- **Compartilhamento de Conteúdo:** Objetivo > 20% dos usuários
- **Tempo de Estudo Semanal:** Objetivo > 3 horas

## Riscos e Mitigações

### Riscos Técnicos
- **Risco:** Indisponibilidade de serviços de IA
- **Mitigação:** Fallback para conteúdo pré-gerado + cache

- **Risco:** Limites de API do Supabase
- **Mitigação:** Otimização de queries + upgrade de plano

- **Risco:** Segurança de dados de pagamento
- **Mitigação:** PCI compliance + tokenização via Stripe

### Riscos de Negócio
- **Risco:** Mudanças na legislação de trânsito
- **Mitigação:** Monitoramento ativo + atualização rápida

- **Risco:** Concorrência de grandes players
- **Mitigação:** Foco em diferenciais (IA, personalização)

- **Risco:** Sazonalidade do mercado
- **Mitigação:** Diversificação de produtos + mercado B2B

### Riscos Regulatórios
- **Risco:** Conformidade com LGPD
- **Mitigação:** Auditoria regular + DPO dedicado

- **Risco:** Regulamentação de IA
- **Mitigação:** Transparência em uso + consentimento claro

## Cronograma de Desenvolvimento

### Fase 1 - MVP (3 meses)
- Sistema de autenticação completo
- Sala de estudo básica com PDF reader
- Sistema de flashcards simples
- Integração com IA (chat básico)
- Sistema de pagamentos

### Fase 2 - Funcionalidades Avançadas (2 meses)
- Quiz com analytics detalhado
- Sistema de sinais de trânsito completo
- Notificações push e email
- Dashboard administrativo

### Fase 3 - Comunidade e Gamificação (2 meses)
- Sistema de compartilhamento
- Ranking e conquistas
- Desafios e gamificação
- Suporte multi-idioma

### Fase 4 - Otimização e Escalabilidade (1 mês)
- Performance optimization
- Analytics avançado
- Integrações adicionais
- Preparação para scale

## Conclusão

O Vrumi representa uma oportunidade significativa no mercado de educação para CNH no Brasil. Com sua abordagem inovadora utilizando inteligência artificial, interface moderna e preço acessível, o produto está posicionado para capturar uma parcela significativa do mercado.

O sucesso do projeto dependerá da execução cuidadosa do roadmap técnico, foco contínuo na experiência do usuário, e adaptação rápida ao feedback do mercado. A combinação de tecnologia de ponta com compreensão profunda das necessidades dos estudantes brasileiros cria uma base sólida para crescimento sustentável.