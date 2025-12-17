-- 1. VEHICLE PRICING
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS price_instructor_car DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_student_car DECIMAL(10,2);

UPDATE instructors SET price_instructor_car = price_per_lesson WHERE price_instructor_car IS NULL;
UPDATE instructors SET price_student_car = price_per_lesson * 0.80 WHERE price_student_car IS NULL;

-- 2. LESSON PACKAGES
CREATE TABLE IF NOT EXISTS lesson_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    total_lessons INT NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('instructor', 'student')),
    total_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. STUDENT PACKAGES (using profiles instead of auth.users)
CREATE TABLE IF NOT EXISTS student_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    package_id UUID REFERENCES lesson_packages(id) ON DELETE SET NULL,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    lessons_total INT NOT NULL,
    lessons_used INT DEFAULT 0,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('instructor', 'student')),
    total_paid DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'refunded')),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_lesson_packages_instructor ON lesson_packages(instructor_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_student ON student_packages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_status ON student_packages(status);

-- 5. RLS POLICIES FOR LESSON_PACKAGES
ALTER TABLE lesson_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active lesson packages" ON lesson_packages
FOR SELECT USING (is_active = true);

CREATE POLICY "Instructors can manage own lesson packages" ON lesson_packages
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM instructors 
        WHERE instructors.id = lesson_packages.instructor_id 
        AND instructors.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all lesson packages" ON lesson_packages
FOR ALL USING (is_admin());

-- 6. RLS POLICIES FOR STUDENT_PACKAGES
ALTER TABLE student_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own packages" ON student_packages
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create own packages" ON student_packages
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Instructors can view packages for their lessons" ON student_packages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM instructors 
        WHERE instructors.id = student_packages.instructor_id 
        AND instructors.user_id = auth.uid()
    )
);

CREATE POLICY "Instructors can update package usage" ON student_packages
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM instructors 
        WHERE instructors.id = student_packages.instructor_id 
        AND instructors.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all student packages" ON student_packages
FOR ALL USING (is_admin());