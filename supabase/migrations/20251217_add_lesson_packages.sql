-- Lesson Packages System
-- Phase 2: Packages that instructors can offer to students

-- Packages offered by instructor
CREATE TABLE IF NOT EXISTS lesson_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    total_lessons INT NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('instructor', 'student')),
    total_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Packages purchased by students
CREATE TABLE IF NOT EXISTS student_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES lesson_packages(id) ON DELETE SET NULL,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    lessons_total INT NOT NULL,
    lessons_used INT DEFAULT 0,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('instructor', 'student')),
    total_paid DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'refunded')),
    purchased_at TIMESTAMP DEFAULT now(),
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_lesson_packages_instructor ON lesson_packages(instructor_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_student ON student_packages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_instructor ON student_packages(instructor_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_status ON student_packages(status);

-- Comments for documentation
COMMENT ON TABLE lesson_packages IS 'Packages of lessons offered by instructors with discount';
COMMENT ON TABLE student_packages IS 'Packages purchased by students - only 1 active per student allowed';
COMMENT ON COLUMN student_packages.lessons_used IS 'Number of lessons consumed from the package';
