-- Remover constraint UNIQUE de name (permitir mesmo produto em múltiplas lojas)
-- e adicionar constraint UNIQUE(name, store) ao invés

-- 1. Remover constraint UNIQUE de name
ALTER TABLE public.products
DROP CONSTRAINT products_name_key;

-- 2. Adicionar constraint UNIQUE(name, store) - produto único por loja
ALTER TABLE public.products
ADD CONSTRAINT products_name_store_unique UNIQUE (name, store);

-- Verificar a nova constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'products';
