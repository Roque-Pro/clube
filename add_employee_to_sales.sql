-- Adicionar colunas de funcionário à tabela sales
ALTER TABLE public.sales 
ADD COLUMN employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
ADD COLUMN employee_name TEXT;
