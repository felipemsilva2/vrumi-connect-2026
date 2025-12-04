create table if not exists public.coupons (
    id uuid not null default gen_random_uuid(),
    code text not null,
    discount_type text not null check (discount_type in ('percentage', 'fixed')),
    discount_value numeric not null,
    max_uses integer null,
    used_count integer not null default 0,
    expires_at timestamp with time zone null,
    is_active boolean not null default true,
    created_at timestamp with time zone not null default now(),
    constraint coupons_pkey primary key (id),
    constraint coupons_code_key unique (code)
);

-- Enable RLS
alter table public.coupons enable row level security;

-- Policies
create policy "Public read access for active coupons"
    on public.coupons for select
    using (true);

create policy "Admins can insert coupons"
    on public.coupons for insert
    with check (auth.role() = 'service_role');

create policy "Admins can update coupons"
    on public.coupons for update
    using (auth.role() = 'service_role');
