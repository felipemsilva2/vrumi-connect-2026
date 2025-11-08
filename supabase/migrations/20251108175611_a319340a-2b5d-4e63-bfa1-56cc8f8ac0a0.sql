-- Fase 1: Sistema de Roles e Permissões

-- 1. Criar enum para tipos de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Criar tabela user_roles (separada do profiles - SEGURANÇA)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar função segura para verificar roles (SECURITY DEFINER para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = COALESCE(is_admin.user_id, auth.uid())
      AND user_roles.role = 'admin'
  )
$$;

-- 5. RLS Policies para user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 6. Inserir felipemsilva93@gmail.com como ADMIN
INSERT INTO public.user_roles (user_id, role, created_by)
VALUES ('6222aa79-71ac-4914-b6aa-497b11947723', 'admin', '6222aa79-71ac-4914-b6aa-497b11947723')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, created_by)
VALUES ('6222aa79-71ac-4914-b6aa-497b11947723', 'user', '6222aa79-71ac-4914-b6aa-497b11947723')
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Melhorar RLS de tabelas existentes - PROFILES
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin() OR auth.uid() = id);

-- 8. Melhorar RLS de USER_PASSES
CREATE POLICY "Admins can view all passes"
ON public.user_passes FOR SELECT
TO authenticated
USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can update passes"
ON public.user_passes FOR UPDATE
TO authenticated
USING (public.is_admin());

-- 9. Melhorar RLS de FLASHCARDS
CREATE POLICY "Admins can manage flashcards"
ON public.flashcards FOR ALL
TO authenticated
USING (public.is_admin());

-- 10. Melhorar RLS de QUIZ_QUESTIONS
CREATE POLICY "Admins can manage quiz questions"
ON public.quiz_questions FOR ALL
TO authenticated
USING (public.is_admin());

-- 11. Melhorar RLS de STUDY_MODULES
CREATE POLICY "Admins can manage study modules"
ON public.study_modules FOR ALL
TO authenticated
USING (public.is_admin());

-- 12. Melhorar RLS de STUDY_CHAPTERS
CREATE POLICY "Admins can manage study chapters"
ON public.study_chapters FOR ALL
TO authenticated
USING (public.is_admin());

-- 13. Melhorar RLS de STUDY_LESSONS
CREATE POLICY "Admins can manage study lessons"
ON public.study_lessons FOR ALL
TO authenticated
USING (public.is_admin());

-- 14. Melhorar RLS de LESSON_CONTENTS
CREATE POLICY "Admins can manage lesson contents"
ON public.lesson_contents FOR ALL
TO authenticated
USING (public.is_admin());