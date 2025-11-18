-- First migration: Add 'dpo' to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dpo';