insert into public.coupons (code, discount_type, discount_value, max_uses, expires_at)
values ('TEST10', 'percentage', 10, 100, now() + interval '1 day')
on conflict (code) do nothing;
