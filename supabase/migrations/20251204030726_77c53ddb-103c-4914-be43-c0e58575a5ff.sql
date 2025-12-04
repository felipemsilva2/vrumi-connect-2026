-- Grant admin role and lifetime access to felipemsilva93@gmail.com
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user by email from profiles table
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE email = 'felipemsilva93@gmail.com';
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email felipemsilva93@gmail.com not found';
  END IF;
  
  -- Add admin role (ignore if already exists)
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (target_user_id, 'admin', target_user_id)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create lifetime pass (valid until 2099)
  INSERT INTO public.user_passes (user_id, pass_type, price, payment_status, expires_at)
  VALUES (target_user_id, '90_days', 0, 'completed', '2099-12-31 23:59:59+00')
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Successfully granted admin role and lifetime access to user %', target_user_id;
END;
$$;