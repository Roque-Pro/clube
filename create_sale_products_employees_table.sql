-- Create table to associate products with employees in sales
-- This allows multiple products in one sale, each assigned to a different employee

CREATE TABLE public.sale_products_employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  product_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sale_products_employees_pkey PRIMARY KEY (id),
  CONSTRAINT sale_products_employees_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE,
  CONSTRAINT sale_products_employees_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT,
  CONSTRAINT sale_products_employees_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT,
  CONSTRAINT sale_products_employees_quantity_check CHECK ((quantity > 0)),
  CONSTRAINT sale_products_employees_unit_price_check CHECK ((unit_price >= 0)),
  CONSTRAINT sale_products_employees_subtotal_check CHECK ((subtotal >= 0))
);

-- Create indexes for performance
CREATE INDEX idx_sale_products_employees_sale_id ON public.sale_products_employees(sale_id);
CREATE INDEX idx_sale_products_employees_employee_id ON public.sale_products_employees(employee_id);
CREATE INDEX idx_sale_products_employees_product_id ON public.sale_products_employees(product_id);

-- Enable RLS
ALTER TABLE public.sale_products_employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to sale_products_employees" 
  ON public.sale_products_employees FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert to sale_products_employees" 
  ON public.sale_products_employees FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update to sale_products_employees" 
  ON public.sale_products_employees FOR UPDATE 
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete from sale_products_employees" 
  ON public.sale_products_employees FOR DELETE 
  USING (true);
