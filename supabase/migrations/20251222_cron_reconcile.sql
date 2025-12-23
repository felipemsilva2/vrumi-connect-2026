-- Cron Job para Reconciliação de Pagamentos
-- Executa a cada hora para verificar bookings travados

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar reconcile-payments para rodar a cada hora
SELECT cron.schedule(
  'reconcile-payments-hourly',
  '0 * * * *',  -- A cada hora no minuto 0
  $$
  SELECT net.http_post(
    url := 'https://kyuaxjkokntdmcxjurhm.supabase.co/functions/v1/reconcile-payments',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Verificar se o job foi criado
-- SELECT * FROM cron.job;

-- Para remover o job se necessário:
-- SELECT cron.unschedule('reconcile-payments-hourly');
