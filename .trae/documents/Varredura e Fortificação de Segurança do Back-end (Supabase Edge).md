## Escopo e Objetivo

* Executar varredura completa e endurecer as Supabase Edge Functions e integrações (Stripe, IA, Storage, RPCs), priorizando autenticação, autorização, CORS, validação de payloads, rate limiting, uploads e auditoria.

## Diagnóstico Atual

* Stack: Supabase (PostgreSQL + Edge Functions Deno), Auth Supabase, Stripe, IA via Lovable, React frontend.

* Funções com JWT desabilitado: `study-chat`, `parse-pdf`, `generate-flashcards`, `generate-questions`, `populate-materiais-from-pdf`, `import-traffic-signs`.

* CORS permissivo (`Access-Control-Allow-Origin: *`).

* Validação backend básica (sem schemas formais), uploads sem checagem de tipo/tamanho, bucket público `traffic-signs`.

## Endurecimento Imediato

* Ativar `verify_jwt = true` em `supabase/config.toml` para todas as funções que consomem recursos (IA, parse, import, populate).

* Inserir verificação explícita de usuário em cada função: extrair `Authorization: Bearer`, usar `supabase.auth.getUser(token)` e bloquear sem sessão válida.

* Restringir CORS a uma lista de domínios permitidos via env e validar `Origin`.

## Autenticação e Autorização

* Exigir sessão válida para todas as funções (inclusive leitura que consome quota).

* Aplicar RBAC:

  * `import-traffic-signs`, `populate-materiais-from-pdf` e ações administrativas exigem `is_admin`.

  * Ações de auditoria e DPO conforme `is_dpo` quando aplicável.

* Garantir mínimo privilégio: usar `anon` key quando possível; operações de escrita que exigem bypass de RLS podem usar `service_role` com checagens estritas de role.

## Validação de Payloads

* Introduzir validação com `zod` via `esm.sh` nos Edge Functions (schemas por endpoint).

* Validar `Content-Type`, formatos, valores mínimos/máximos e normalizar strings.

* Rejeitar payloads com campos desconhecidos (schema `strict`).

## Uploads e Storage

* Em `parse-pdf` e fluxos de upload:

  * Validar `file.type` (ex.: `application/pdf`) e `file.size` (limite, ex.: 10MB).

  * Rejeitar arquivos potencialmente perigosos; sanitizar nomes e metadados.

* Revisar bucket `traffic-signs`:

  * Se não for estritamente público, tornar privado e servir via URLs assinadas.

  * Registrar quem cria/atualiza/exclui imagens; limitar origem dos `image_url`.

## CORS

* Substituir `"*"` por lista de `ALLOWED_ORIGINS` do env.

* Responder `Access-Control-Allow-Origin` apenas quando `Origin` está na lista.

* Limitar `Access-Control-Allow-Headers` ao mínimo necessário.

## Rate Limiting e Anti-abuso

* Implementar rate limiting por usuário/IP em funções de IA/parse:

  * Persistência simples em tabela `rate_limits` (user\_id, window, count) com checagem e incremento transacional.

  * Políticas RLS para impedir manipulação por clientes.

* Introduzir quotas diárias por usuário para operações caras.

## Stripe e Pagamentos

* Revisar `create-checkout` e `verify-payment`:

  * Garantir que `verify-payment` consulta Stripe de forma server-side e não confia em parâmetros do cliente.

* Adicionar webhook Stripe dedicado:

  * Verificar assinatura (`stripe.webhooks.constructEvent`) e processar eventos (checkout.session.completed, payment\_intent.succeeded).

  * Tornar fonte de verdade de pagamentos o webhook.

## Banco e RLS

* Auditar políticas RLS nas tabelas críticas (`profiles`, `user_passes`, conteúdo, `audit_logs`).

* Confirmar que inserts/updates de conteúdo e passes exigem role apropriada.

* Revisar RPCs (`is_admin`, `is_dpo`, outras) quanto a privilégios e argumentos.

## Logs e Auditoria

* Padronizar respostas de erro sem vazar detalhes sensíveis.

* Remover tokens/chaves de logs; mascarar identificadores.

* Garantir que ações administrativas e alterações de dados críticos disparem `audit_logs` com contexto mínimo necessário.

## Segredos e Configuração

* Garantir leitura de segredos apenas via `Deno.env.get`; nunca devolver em respostas.

* Validar ausência de segredos em `console.log`.

* Centralizar variáveis de configuração (origens permitidas, limites de tamanho/quotas).

## Testes e Verificação

* Criar testes de segurança para cada função:

  * Autenticação obrigatória, RBAC, CORS correto, payload inválido, excesso de chamadas (rate limit), uploads fora de política.

* Testes de webhook Stripe com eventos simulados e assinatura.

* Testes de RLS: confirmar que anon/padrão não acessa dados indevidos.

## Entregáveis

* Alterações em `supabase/config.toml` e cada `supabase/functions/*/index.ts` com autenticação, CORS restrito, validação, rate limiting.

* Nova função `stripe-webhook` com verificação de assinatura.

* Migração SQL para tabela `rate_limits` e ajustes de políticas.

* Documentação operacional de variáveis env e limites.

* Suite de testes automatizados de segurança.

## Cronograma

* Fase 1 (Endurecimento imediato): JWT, CORS, verificação de usuário.

* Fase 2 (Validação e Rate limiting): Schemas, quotas e limites.

* Fase 3 (Pagamentos e Auditoria): Webhook, logs padronizados.

* Fase 4 (Testes e Revisão RLS): Testes automatizados e ajustes finais.

## Critérios de Aceite

* Todas as funções exigem sessão válida e aplicam RBAC corretos.

* CORS restrito aos domínios autorizados.

* Payloads inválidos são rejeitados com mensagens padronizadas.

* Rate limiting e quotas ativos em endpoints caros.

* Pagamentos confirmados via webhook assinado.

* Testes de segurança passam em CI.

