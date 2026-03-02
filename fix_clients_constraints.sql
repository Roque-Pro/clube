-- Fix clients table: allow NULL values for optional fields
-- This prevents unique constraint violations when users leave fields empty

-- Drop existing unique constraints
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_cpf_key;
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_plate_key;

-- Re-add constraints but allow NULL values
-- In PostgreSQL, NULL values don't violate UNIQUE constraints when the field is nullable
ALTER TABLE public.clients ADD CONSTRAINT clients_cpf_key UNIQUE (cpf) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE public.clients ADD CONSTRAINT clients_plate_key UNIQUE (plate) DEFERRABLE INITIALLY DEFERRED;

-- Update existing empty strings to NULL
UPDATE public.clients SET cpf = NULL WHERE cpf = '';
UPDATE public.clients SET plate = NULL WHERE plate = '';
