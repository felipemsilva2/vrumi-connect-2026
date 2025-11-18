# Implementar Auditoria Regular e DPO Dedicado

## Contexto Atual
- Logs de auditoria já existem em `supabase/migrations/20251108185505_d89c8650-e33e-487c-b28d-eba644cb8e9e.sql:2-13` e função RPC `log_admin_action` em `supabase/migrations/20251108185505_d89c8650-e33e-487c-b28d-eba644cb8e9e.sql:35-76`.
- Hook de logging no frontend: `src/hooks/useAuditLog.ts:11-46`.
- UI para leitura de logs: `src/pages/admin/AdminAuditLogs.tsx:14-195`.
- Sistema de roles atual (`admin`/`user`): enum e função `is_admin()` em `supabase/migrations/20251108175611_a319340a-2b5d-4e63-bfa1-56cc8f8ac0a0.sql:3-33`.

## Objetivos
- Estabelecer auditoria contínua com cobertura de eventos críticos e relatórios periódicos.
- Criar o papel “DPO” com acesso apropriado a dados e ferramentas de conformidade.
- Implementar processos para requisições de titulares (LGPD) e retenção/eliminação de dados.

## Banco de Dados
- Alterar enum `app_role` para incluir `dpo`.
- Criar função `is_dpo(user_id UUID DEFAULT auth.uid()) RETURNS BOOLEAN` análoga a `is_admin()`.
- Atualizar políticas RLS:
  - `audit_logs`: permitir `SELECT` quando `is_admin()` OU `is_dpo()`.
  - `profiles`, `user_activities`, `subscriptions`: conceder `SELECT` somente-leitura para `is_dpo()`.
- Criar tabela `data_subject_requests` para gerenciar pedidos LGPD:
  - Campos: `id`, `user_id`, `type` (access, rectification, deletion, portability), `status`, `requested_at`, `resolved_at`, `notes`, `handled_by`.
  - RLS: usuários veem seus pedidos; `admin` e `dpo` podem gerenciar.
- Retenção de logs: implementar limpeza automática (por exemplo, 18 meses) com `pg_cron` ou Supabase Scheduler em função `cleanup_audit_logs(retention_months INT)`.

## Backend/Edge Functions
- Criar endpoint seguro para logging que capture IP a partir de headers (`X-Forwarded-For`) e evite `null` em `ip_address`.
- Função de exportação: `export_audit_logs_csv(start_date, end_date)` retornando CSV/JSON.
- Função de relatório mensal: `generate_audit_summary(month)` que agrega `action_type`, `entity_type`, usuários mais ativos e anomalias (ex.: picos de `DELETE`).

## Frontend/Admin
- Atualizar página de Roles para suportar papel `DPO`:
  - `src/pages/admin/AdminRoles.tsx`: permitir toggle de `dpo` além de `admin`.
- Expandir `AdminAuditLogs`:
  - Filtros por data, exportar CSV/JSON, contadores por tipo, destaque de ações destrutivas.
- Nova página “Privacy Center”:
  - Lista e detalhamento de `data_subject_requests` com ações (aprovar, negar, concluir).
  - Botões de execução: exportar dados do usuário, anonimizar/deletar mediante aprovação.

## Cobertura de Eventos (Auditoria)
- Logar ações com `useAuditLog` e/ou servidor para:
  - Gestão de roles (promoção/demissão) — já coberto em `src/pages/admin/AdminRoles.tsx:100-125`.
  - Alterações de perfil, preferências e assinaturas.
  - Operações de conteúdo administrativo (criar/editar/deletar quiz, sinais, módulos).
  - Exportações de dados, deleções/anônimos de dados de usuários.
  - Acessos ao painel administrativo e falhas de autenticação (via servidor).

## Processos do DPO
- Cadência:
  - Revisão semanal dos logs com relatório automático.
  - Relatório mensal consolidado arquivado e enviado para diretoria.
- SLA LGPD:
  - Responder a pedidos em até 15 dias corridos.
  - Registro completo das decisões e ações em `data_subject_requests`.
- Retenção:
  - Logs: 18 meses (ajustável). Dados de pedidos: 5 anos.

## Segurança e Conformidade
- Minimização de dados: capturar o mínimo necessário (IP, user agent) com base legal.
- Criptografia em trânsito e repouso (Supabase padrão), evitar dados sensíveis em `new_values`/`old_values`.
- Acesso `DPO` somente-leitura para dados pessoais; ações sensíveis exigem dupla aprovação (`admin` + `dpo`).
- Trilhas de auditoria para todas as ações de conformidade.

## Entregáveis e Critérios de Aceite
- Papel `DPO` funcional com acesso controlado.
- Logs com IP e user agent completos e exportáveis.
- Painel de auditoria com filtros e exportação.
- Módulo de requisições LGPD operacional com SLA e histórico.
- Limpeza automática de logs após período de retenção.

## Cronograma
- Semana 1: DB (enum/`is_dpo`/RLS), endpoint de logging, exportação.
- Semana 2: AdminRoles (DPO), melhorias em AuditLogs, Privacy Center (lista).
- Semana 3: Fluxos LGPD (ação e auditoria), relatórios automatizados, retenção.
- Semana 4: Endurecimento de segurança, testes, documentação operacional e handoff ao DPO.
