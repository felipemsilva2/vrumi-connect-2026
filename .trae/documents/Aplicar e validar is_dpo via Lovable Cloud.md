## Objetivo

Garantir que a função `public.is_dpo(user_id)` e as políticas RLS associadas estejam aplicadas no projeto Supabase usado pelo app, sem acesso direto ao Supabase, usando apenas recursos do Lovable Cloud (prompts e steps de deploy/automação).

## Caminho A: Step de Deploy com Supabase CLI

1. Adicionar segredos no Lovable Cloud:

   * `SUPABASE_ACCESS_TOKEN`: token pessoal do Supabase.

   * `SUPABASE_PROJECT_REF`: referência do projeto (formato `xxxxxx`), obtida pela URL do Supabase.
2. Incluir um step pré-deploy (ou job manual) que:

   * Instala o CLI: `npm i -g supabase`

   * Linka ao projeto: `supabase link --project-ref $SUPABASE_PROJECT_REF`

   * Executa migrações remotas: `supabase db push`

   * Diretório de trabalho do step precisa ser o root do repo para ler `supabase/migrations/*`.
3. Condicionar o step para rodar somente quando houver mudanças em `supabase/migrations` (opcional) para evitar reexecuções desnecessárias.

## Caminho B: Job único usando psql

1. Adicionar segredo `SUPABASE_DB_URL` (Connection string do Postgres do projeto; requer acesso de manutenção): `postgres://<user>:<pass>@db.<ref>.supabase.co:5432/postgres`.
2. Criar um job manual que:

   * Instala `psql` (imagem Linux com PostgreSQL client).

   * Roda: `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20251117123000_add_dpo_role_and_lgpd.sql`
3. Usar somente para hotfix; preferir Caminho A para migrações consistentes.

## Verificação Automatizada

Após aplicar, criar um step de verificação rápido:

* RPC check com service role (segredo `SUPABASE_SERVICE_ROLE_KEY`):

  * `curl -s -X POST "https://$SUPABASE_PROJECT_REF.supabase.co/rest/v1/rpc/is_dpo" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{"user_id":"00000000-0000-0000-0000-000000000000"}'`

  * Esperar `true/false` sem erro `PGRST202`.

* Opcional: `curl` em tabelas (`profiles`, `audit_logs`) para confirmar políticas RLS presentes (esperar 200/403 adequados).

## Prompt Modelo para Lovable Cloud

Use este prompt como automação no Lovable:

"""
Crie um step pré-deploy chamado "Aplicar Migrações Supabase" que:

* Usa o diretório do repositório.

* Instala o CLI `supabase` com `npm i -g supabase`.

* Lê os segredos `SUPABASE_ACCESS_TOKEN` e `SUPABASE_PROJECT_REF` do ambiente.

* Executa `supabase link --project-ref $SUPABASE_PROJECT_REF` e depois `supabase db push`.

* Condicione a execução quando houver mudanças em `supabase/migrations/**`.

* Em seguida, adicione um step "Verificação is\_dpo" que faz `curl` para `https://$SUPABASE_PROJECT_REF.supabase.co/rest/v1/rpc/is_dpo` com os headers `apikey` e `Authorization` usando `SUPABASE_SERVICE_ROLE_KEY`, enviando um `user_id` de teste, e falhe o deploy se retornar erro `PGRST202`.
  """

## Considerações de Segurança

* Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend; usar apenas no step de verificação server-side.

* Limite o escopo de jobs a PRs protegidos ou a ambientes de staging antes de produção.

* Mantenha migrações idempotentes (o arquivo já trata `duplicate_object` em políticas).

## Plano de Contingência

* Se `SUPABASE_ACCESS_TOKEN`/`PROJECT_REF` não estiverem disponíveis, use Caminho B com `SUPABASE_DB_URL` apenas temporariamente.

* Se a execução falhar, coletar logs do step e validar manualmente a existência de `public.is_dpo` via uma chamada RPC com service role.

