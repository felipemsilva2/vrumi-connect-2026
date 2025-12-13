-- Vrumi Connect - Marketplace de Instrutores

-- Enum para categoria de CNH
CREATE TYPE public.cnh_category AS ENUM ('A', 'B', 'AB', 'C', 'D', 'E');

-- Enum para status do instrutor
CREATE TYPE public.instructor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Enum para status do agendamento
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'disputed');

-- Tabela de perfis de instrutores
CREATE TABLE public.instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    bio TEXT,
    photo_url TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    categories cnh_category[] NOT NULL DEFAULT '{}',
    price_per_lesson DECIMAL(10,2) NOT NULL,
    lesson_duration_minutes INTEGER NOT NULL DEFAULT 50,
    availability JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    status instructor_status DEFAULT 'pending',
    total_lessons INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Tabela de disponibilidade do instrutor
CREATE TABLE public.instructor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(instructor_id, day_of_week, start_time, end_time)
);

-- Tabela de agendamentos/aulas
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 50,
    price DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    instructor_amount DECIMAL(10,2) NOT NULL,
    status booking_status DEFAULT 'pending',
    contract_signed_at TIMESTAMPTZ,
    contract_pdf_url TEXT,
    payment_intent_id TEXT,
    payment_status TEXT DEFAULT 'pending',
    cancellation_reason TEXT,
    cancelled_by UUID,
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de avaliações
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de contratos
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    contract_text TEXT NOT NULL,
    student_signature TEXT,
    student_signed_at TIMESTAMPTZ,
    instructor_signature TEXT,
    instructor_signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de transações financeiras
CREATE TABLE public.instructor_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earning', 'withdrawal', 'refund')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    description TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_transactions ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é instrutor
CREATE OR REPLACE FUNCTION public.is_instructor(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.instructors
        WHERE user_id = check_user_id
        AND status = 'approved'
    )
$$;

-- Políticas para instructors
CREATE POLICY "Anyone can view approved instructors"
ON public.instructors FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can view own instructor profile"
ON public.instructors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own instructor profile"
ON public.instructors FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instructor profile"
ON public.instructors FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all instructors"
ON public.instructors FOR ALL
USING (is_admin());

-- Políticas para instructor_availability
CREATE POLICY "Anyone can view approved instructor availability"
ON public.instructor_availability FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.instructors
        WHERE id = instructor_id
        AND status = 'approved'
    )
);

CREATE POLICY "Instructors can manage own availability"
ON public.instructor_availability FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.instructors
        WHERE id = instructor_id
        AND user_id = auth.uid()
    )
);

-- Políticas para bookings
CREATE POLICY "Students can view own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view their bookings"
ON public.bookings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.instructors
        WHERE id = instructor_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Students can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students and instructors can update relevant bookings"
ON public.bookings FOR UPDATE
USING (
    auth.uid() = student_id OR
    EXISTS (
        SELECT 1 FROM public.instructors
        WHERE id = instructor_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all bookings"
ON public.bookings FOR ALL
USING (is_admin());

-- Políticas para reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews FOR SELECT
USING (is_approved = TRUE);

CREATE POLICY "Students can view own reviews"
ON public.reviews FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can create reviews for their bookings"
ON public.reviews FOR INSERT
WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
        SELECT 1 FROM public.bookings
        WHERE id = booking_id
        AND student_id = auth.uid()
        AND status = 'completed'
    )
);

CREATE POLICY "Admins can manage all reviews"
ON public.reviews FOR ALL
USING (is_admin());

-- Políticas para contracts
CREATE POLICY "Parties can view their contracts"
ON public.contracts FOR SELECT
USING (
    auth.uid() = student_id OR
    EXISTS (
        SELECT 1 FROM public.instructors
        WHERE id = instructor_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "System can create contracts"
ON public.contracts FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Parties can update their contracts"
ON public.contracts FOR UPDATE
USING (
    auth.uid() = student_id OR
    EXISTS (
        SELECT 1 FROM public.instructors
        WHERE id = instructor_id
        AND user_id = auth.uid()
    )
);

-- Políticas para instructor_transactions
CREATE POLICY "Instructors can view own transactions"
ON public.instructor_transactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.instructors
        WHERE id = instructor_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all transactions"
ON public.instructor_transactions FOR ALL
USING (is_admin());

-- Função para atualizar média de avaliações do instrutor
CREATE OR REPLACE FUNCTION public.update_instructor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.instructors
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM public.reviews
            WHERE instructor_id = NEW.instructor_id
            AND is_approved = TRUE
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE instructor_id = NEW.instructor_id
            AND is_approved = TRUE
        ),
        updated_at = NOW()
    WHERE id = NEW.instructor_id;
    
    RETURN NEW;
END;
$$;

-- Trigger para atualizar rating
CREATE TRIGGER trigger_update_instructor_rating
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_instructor_rating();

-- Índices para performance
CREATE INDEX idx_instructors_city_state ON public.instructors(city, state);
CREATE INDEX idx_instructors_categories ON public.instructors USING GIN(categories);
CREATE INDEX idx_instructors_status ON public.instructors(status);
CREATE INDEX idx_bookings_student ON public.bookings(student_id);
CREATE INDEX idx_bookings_instructor ON public.bookings(instructor_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_reviews_instructor ON public.reviews(instructor_id);
CREATE INDEX idx_instructor_availability_instructor ON public.instructor_availability(instructor_id);