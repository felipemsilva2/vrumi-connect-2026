-- Create lesson_packages table first (if not exists)
CREATE TABLE IF NOT EXISTS public.lesson_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    total_lessons INTEGER NOT NULL DEFAULT 1,
    price_per_lesson DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    vehicle_type VARCHAR(20) DEFAULT 'any',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for instructor lookup
CREATE INDEX IF NOT EXISTS idx_lesson_packages_instructor ON public.lesson_packages(instructor_id);

-- Enable RLS
ALTER TABLE public.lesson_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_packages
CREATE POLICY "Public read for active packages" ON public.lesson_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Instructors can manage own packages" ON public.lesson_packages
    FOR ALL TO authenticated
    USING (instructor_id IN (SELECT id FROM public.instructors WHERE user_id = auth.uid()))
    WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE user_id = auth.uid()));

-- Now add the column to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS use_package_id UUID REFERENCES public.lesson_packages(id);

CREATE INDEX IF NOT EXISTS idx_bookings_use_package_id ON public.bookings(use_package_id);

COMMENT ON COLUMN public.bookings.use_package_id IS 'References the lesson package if this booking uses a package lesson';
