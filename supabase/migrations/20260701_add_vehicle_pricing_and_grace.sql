ALTER TABLE public.client_vehicles ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'popular';
ALTER TABLE public.client_vehicles ADD COLUMN IF NOT EXISTS monthly_price numeric(10,2) DEFAULT 19.90;
ALTER TABLE public.client_vehicles ADD COLUMN IF NOT EXISTS stripe_price_id text;
ALTER TABLE public.client_vehicles ADD COLUMN IF NOT EXISTS free_until date;
