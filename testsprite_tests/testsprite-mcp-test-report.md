# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Metadados do Documento
- Projeto: `roadwiz-guide-64894`
- Data: 2025-11-18
- Preparado por: Assistente de Engenharia (TestSprite MCP)

---

## 2️⃣ Sumário de Validação por Requisitos

### Requisito A — Autenticação e Sessão
- TC001: Registro por e-mail — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/42fe6cc2-9738-4cd6-a3c9-51de62a9718d
  - Análise: Fluxos de registro/autenticação dependem do Supabase Auth e da UI em `src/pages/Auth.tsx`. Sem credenciais válidas e chaves de projeto, o fluxo não avança.
- TC002: Registro via Google OAuth — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/8ff4170b-d5e1-41b5-915e-5723746cedd8
  - Análise: OAuth exige configuração no projeto Supabase remoto; não há mock/local para concluir o fluxo.
- TC003: Login com credenciais corretas — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/d6aa36f5-dbc9-4a09-ad00-d68f55cfc8b2
  - Análise: Sem usuário semente e ambiente `.env` apontando ao projeto Supabase ativo, o login não completa.
- TC004: Falha de login com credenciais inválidas — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/d6db90b0-1f86-4a87-980f-2f40d8d952ad
  - Análise: A tela de Auth existe, mas sem navegação automatizada estável e respostas do backend o teste não conclui.
- TC019: Timeout e gestão segura de sessão — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/79816852-5a70-4dee-a661-efaecb77453e
  - Análise: Requer sessão ativa do Supabase para validar expiração/renovação tokens.

### Requisito B — Assinaturas e Pagamentos
- TC006: Assinar plano via Stripe Checkout — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/be4ef49f-0785-4467-8330-18e18076661f
  - Análise: Fluxo depende das funções `create-checkout`, `verify-payment`, `stripe-webhook` em Supabase Edge; ambiente local não possui chaves/Stripe em modo teste.
- TC017: Atualização/cancelamento de assinatura — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/269d36e1-2030-487a-83db-0af844146d23
  - Análise: Sem estado real de assinatura no banco, o teste não tem como validar transições.
- TC022: Tratamento de erro quando pagamento Stripe falha — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/39fc4ee9-feac-48fd-b59c-cb28fc16568d
  - Análise: Requer simulação de falha no checkout; sem mocks, o teste fica dependente do Stripe remoto.

### Requisito C — Conteúdo de Estudo (PDF, Flashcards, Questões)
- TC008: Leitor de PDF — seleção e anotação — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/d2713b50-5f16-4c7f-9148-79b1e61f096d
  - Análise: Interações exigem arquivo PDF e renderização estável; dependências/arquivos não foram provisionados no teste.
- TC009: Geração de flashcards a partir de PDF (AI) — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/ce8b883d-0364-4b4d-9f56-0c45bcfe38e7
  - Análise: Depende da função `generate-flashcards` e de conteúdo OCR/parsed; sem dados e chaves, o pipeline não roda.
- TC010: Flashcards — repetição espaçada e desempenho — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/a216895f-6d36-4cfc-9ccc-db65c43d4167
  - Análise: Requer base de itens e estado do usuário.
- TC011: Sistema de quiz com temporizador e feedback — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/b56cbd14-4dbb-4545-9248-4ea445052b56
  - Análise: Depende de banco de questões e regras; sem sementes, não há o que responder.

### Requisito D — Placas de Trânsito
- TC012: Biblioteca de placas — busca e categorização — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/8da4e250-dadf-45d0-87db-58e36ec102a9
  - Análise: Depende de dados importados pela função `import-traffic-signs`; sem semente/remoto, UI não mostra resultados.
- TC013: Quizzes de placas e progresso — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/5c8f57b4-9cc6-4dd7-bdfe-eb70af1d540b
  - Análise: Requer base de placas e sessão ativa.

### Requisito E — Admin
- TC016: Admin — gestão de usuários — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/3d0d7e6a-8b22-4aca-8800-14ed7092428c
  - Análise: Telas admin exigem papel `admin` (hook `useIsAdmin`) e dados reais.

### Requisito F — Notificações e Auditoria
- TC015: Entrega de notificações (push/e-mail) — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/182b9e55-7e8a-4c30-8b5e-2eac81171bb1
  - Análise: Envio depende de serviços externos e configuração; sem mocks, o teste não avança.
- TC018: Log de auditoria de ações — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/26352672-de4e-4fac-9583-ccf4891b70a2
  - Análise: Depende da função `log-audit` e sessão do usuário.

### Requisito G — UX/Legal/Outros
- TC020: UI responsiva multi-dispositivos — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/fac6d177-3142-4ae7-80e0-116a50486bc1
  - Análise: Sem navegação programática confiável no ambiente remoto, o teste não valida breakpoints.
- TC021: LGPD — acesso a dados/consentimento — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/3af84c5a-cb83-4901-8751-b325c5a99fed
  - Análise: Depende de fluxos completos de cadastro/consentimento e dados persistidos.
- TC023: Compartilhamento de conteúdo/interações — ❌ Failed (timeout)
  - Link: https://www.testsprite.com/dashboard/mcp/tests/b6af03e4-5fc4-46ce-9831-75308db6836d/62120927-9785-4619-828b-22a5501f4ec7
  - Análise: Requer sessão e recursos sociais ativos.

---

## 3️⃣ Métricas de Cobertura
- Total de testes: 23
- Passed: 0
- Failed: 23

| Requisito                               | Total | ✅ Passed | ❌ Failed |
|-----------------------------------------|-------|----------|----------|
| Autenticação e Sessão                   | 5     | 0        | 5        |
| Assinaturas e Pagamentos                | 3     | 0        | 3        |
| Conteúdo de Estudo (PDF/Flashcards/Quiz)| 4     | 0        | 4        |
| Placas de Trânsito                      | 2     | 0        | 2        |
| Admin                                   | 1     | 0        | 1        |
| Notificações e Auditoria                | 2     | 0        | 2        |
| UX/Legal/Outros                         | 6     | 0        | 6        |

---

## 4️⃣ Lacunas e Riscos Principais
- Dependência forte de serviços remotos (Supabase/Stripe) sem mocks para testes locais.
- Ausência de usuários e dados seed para percursos críticos (auth, quizzes, materiais).
- Falta de rotas de teste dedicadas ou fixtures para PDF/flashcards.
- Testes E2E necessitam credenciais válidas e `.env` apontando para projeto de teste isolado.

---

## 5️⃣ Recomendações de Engenharia
- Introduzir mocks/stubs para Supabase Auth/Edge Functions (camada de `services/` com fallback).
- Criar ambiente de testes com chaves de Stripe (modo teste) e Supabase de staging.
- Adicionar seeds/scripts para dados mínimos: usuários, materiais, placas, quizzes.
- Disponibilizar rotas/dev pages para cenários testáveis (ex.: `/test/pdf`, `/test/auth`).
- Automatizar login de teste com usuário padrão e bypass OAuth no ambiente de teste.

---

## 6️⃣ Próximos Passos Operacionais
- Configurar `.env.test` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` de staging.
- Habilitar função `verify_jwt=false` em rotas de teste no `supabase/config.toml` somente para ambiente de teste.
- Reexecutar TestSprite após provisionamento de dados e mocks.