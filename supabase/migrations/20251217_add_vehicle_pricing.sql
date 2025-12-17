-- Add vehicle-based pricing fields to instructors table
-- Allows different prices for instructor's car vs student's car

ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS price_instructor_car DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_student_car DECIMAL(10,2);

-- Migrate existing price_per_lesson to instructor's car price
UPDATE instructors 
SET price_instructor_car = price_per_lesson 
WHERE price_per_lesson IS NOT NULL 
AND price_instructor_car IS NULL;

-- Default student car price to 80% of instructor car price
UPDATE instructors 
SET price_student_car = price_per_lesson * 0.80 
WHERE price_per_lesson IS NOT NULL 
AND price_student_car IS NULL;

COMMENT ON COLUMN instructors.price_instructor_car IS 'Price per lesson when using instructor''s car';
COMMENT ON COLUMN instructors.price_student_car IS 'Price per lesson when using student''s car (usually lower)';
