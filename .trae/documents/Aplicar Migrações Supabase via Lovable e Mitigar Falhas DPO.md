## Objetivo
- Aplicar as migrações que criam `public.is_dpo` e políticas RLS para eliminar `PGRST202` e reduzir `net::ERR_ABORTED`.
- Validar pelo Lovable (sem acesso direto ao dashboard do Supabase) que a função existe e responde.

## Caminho Lovable (CLI)
- Preparar ambiente no runner do Lovable com variáveis já usadas pelo app: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e (se disponível) `SUPABASE_DB_URL`.
- Instalar/usar Supabase CLI e empurrar migrações:
  - Windows PowerShell (runner Lovable):
    - `npm i -g supabase`
    - `supabase db push --db-url "$env:SUPABASE_DB_URL"`
  - Caso o CLI não esteja disponível: `npx supabase@latest db push --db-url "$env:SUPABASE_DB_URL"`
- Diretório de migrações: `supabase/migrations/` (inclui `20251117123000_add_dpo_role_and_lgpd.sql`).
- Se `SUPABASE_DB_URL` não estiver nos secrets do Lovable, solicitar ao Lovable/DevOps a injeção do connection string do projeto (necessário para DDL). Sem esse valor, o CLI não consegue aplicar migrações.

## Validação RPC (sem dashboard)
- Realizar chamada HTTP ao PostgREST via Lovable usando service-role para confirmar a função:
  - PowerShell exemplo:
    - `$headers = @{ apikey = $env:VITE_SUPABASE_PUBLISHABLE_KEY; Authorization = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"; 'Content-Type'='application/json' }`
    - `Invoke-RestMethod -Uri "$env:VITE_SUPABASE_URL/rest/v1/rpc/is_dpo" -Method Post -Headers $headers -Body '{"user_id":"<UUID>"}'`
  - Esperado: resposta booleana sem erro.
- Smoke tests REST para tabelas:
  - `Invoke-RestMethod -Uri "$env:VITE_SUPABASE_URL/rest/v1/profiles?select=*" -Headers $headers`
  - `Invoke-RestMethod -Uri "$env:VITE_SUPABASE_URL/rest/v1/audit_logs?select=*" -Headers $headers`

## Fallback Temporário no App
- Mitigar impacto enquanto migrações não estão aplicadas:
  - `src/components/admin/ProtectedAdminRoute.tsx:42-47`
    - Continuar exibindo aviso quando `PGRST202` ocorrer e degradar para checagem apenas de admin.
  - Garantir que listagens admin só rodem se `isSupabaseConfigured && navigator.onLine`:
    - `src/pages/admin/AdminDashboard.tsx:30-41` já contempla; manter este padrão.
  - `src/hooks/useIsAdmin.ts:44-49`: manter RPC `is_admin` e logs para diagnóstico.

## Segurança
- Usar `SUPABASE_SERVICE_ROLE_KEY` somente no runner Lovable (servidor), nunca no cliente.
- Não logar chaves ou URLs sensíveis. Limitar outputs a status e códigos.

## Resultados Esperados
- Migrações aplicadas e `public.is_dpo` disponível.
- RPC `is_dpo` retorna 200 com `true/false` usando chamada via Lovable.
- Quadro admin carrega sem `ERR_ABORTED` em cenários de navegação.

## Prompts Prontos para o Lovable
- "Abra um terminal no runner deste projeto. Se `SUPABASE_DB_URL` estiver nos secrets, execute: `npx supabase@latest db push --db-url \"$env:SUPABASE_DB_URL\"` no diretório raiz. Mostre o log de migrações aplicadas."
- "Valide a existência de `public.is_dpo` chamando `Invoke-RestMethod` com `Authorization: Bearer $env:SUPABASE_SERVICE_ROLE_KEY` para `.../rest/v1/rpc/is_dpo` com um `user_id` de teste e reporte a resposta."
- "Execute smoke tests REST para `profiles` e `audit_logs` com os mesmos headers e reporte código HTTP e contagem de registros."