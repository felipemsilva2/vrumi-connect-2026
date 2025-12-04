-- Force Admin Role for User 6222aa79-71ac-4914-b6aa-497b11947723

INSERT INTO public.user_roles (user_id, role)
VALUES ('6222aa79-71ac-4914-b6aa-497b11947723', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure they have a lifetime pass
INSERT INTO public.user_passes (user_id, pass_type, price, payment_status, expires_at)
VALUES ('6222aa79-71ac-4914-b6aa-497b11947723', '90_days', 0, 'completed', '2099-12-31 23:59:59+00')
ON CONFLICT DO NOTHING;
