-- ============================================
-- FIX: Converter sale_date de DATE para TIMESTAMP WITH TIME ZONE
-- ============================================

-- Criar coluna temporária com TIMESTAMP
ALTER TABLE public.sales 
ADD COLUMN sale_date_temp TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Copiar dados da coluna antiga para a nova (converte DATE para TIMESTAMP)
UPDATE public.sales
SET sale_date_temp = (sale_date::TEXT || ' 00:00:00')::TIMESTAMP WITH TIME ZONE AT TIME ZONE 'America/Sao_Paulo';

-- Remover a coluna antiga
ALTER TABLE public.sales 
DROP COLUMN sale_date;

-- Renomear a coluna temporária
ALTER TABLE public.sales 
RENAME COLUMN sale_date_temp TO sale_date;

-- Adicionar constraint NOT NULL
ALTER TABLE public.sales 
ALTER COLUMN sale_date SET NOT NULL;

-- Verificar resultado
SELECT id, description, sale_date, created_at FROM public.sales ORDER BY created_at DESC LIMIT 10;
