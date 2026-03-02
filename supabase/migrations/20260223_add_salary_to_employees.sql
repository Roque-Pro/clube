-- Add salary column to employees table
ALTER TABLE public.employees ADD COLUMN salary DECIMAL(10, 2) DEFAULT 1600;

-- Create index for salary queries
CREATE INDEX idx_employees_salary ON public.employees(salary);
