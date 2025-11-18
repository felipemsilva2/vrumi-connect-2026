create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null,
  window_start timestamptz not null default now(),
  count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

create index if not exists idx_rate_limits_user_endpoint_window
  on public.rate_limits (user_id, endpoint, window_start desc);