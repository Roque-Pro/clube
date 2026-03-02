-- ============================================
-- FIX: Converter sale_date de DATE para TIMESTAMP WITH TIME ZONE
-- ============================================

-- 1. Criar coluna temporária
ALTER TABLE public.sales 
ADD COLUMN sale_date_new TIMESTAMP WITH TIME ZONE;

-- 2. Copiar dados convertendo DATE para TIMESTAMP (mantém os dados existentes)
UPDATE public.sales
SET sale_date_new = sale_date::TIMESTAMP WITH TIME ZONE;

-- 3. Remover coluna antiga
ALTER TABLE public.sales 
DROP COLUMN sale_date;

-- 4. Renomear coluna nova
ALTER TABLE public.sales 
RENAME COLUMN sale_date_new TO sale_date;

-- 5. Adicionar default correto
ALTER TABLE public.sales 
ALTER COLUMN sale_date SET DEFAULT now();

-- Verificar resultado
SELECT id, sale_date, created_at FROM public.sales ORDER BY created_at DESC LIMIT 5;
