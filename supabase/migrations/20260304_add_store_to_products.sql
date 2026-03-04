-- Add store column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS store TEXT NOT NULL DEFAULT 'Loja 1';

-- Update existing records to have a default store
UPDATE public.products SET store = 'Loja 1' WHERE store IS NULL;

-- Add cost_price column if it doesn't exist
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT 0;
