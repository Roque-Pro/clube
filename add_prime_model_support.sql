-- ============================================
-- SUPORTE AO MODELO PRIME
-- Adiciona campos para controlar produtos com margem especial
-- ============================================

-- 1. Adicionar campos na tabela de produtos (cost_price já existe)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_prime BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10, 2);

-- Criar índice para buscar produtos prime
CREATE INDEX IF NOT EXISTS idx_products_is_prime ON public.products(is_prime);

-- 2. Adicionar campos na tabela de vendas
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS cost_value NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS is_prime BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prime_commission NUMERIC(10, 2);

-- Criar índices para vendas prime
CREATE INDEX IF NOT EXISTS idx_sales_is_prime ON public.sales(is_prime);
CREATE INDEX IF NOT EXISTS idx_sales_prime_commission ON public.sales(prime_commission);

-- ============================================
-- NOTAS DE IMPLEMENTAÇÃO
-- ============================================
-- 
-- Para ativar o modelo PRIME em um produto:
-- UPDATE public.products 
-- SET is_prime = true, 
--     cost_price = 150.00, 
--     sale_price = 250.00
-- WHERE id = 'product-id-aqui';
--
-- Ao registrar uma venda PRIME:
-- - cost_value = preço de custo (cost_price do produto)
-- - amount = preço de venda (sale_price do produto)
-- - prime_commission = amount - cost_value (margem para o vendedor)
-- - is_prime = true
--
-- Exemplo: Produto PRIME
-- - cost_price: R$ 150
-- - sale_price: R$ 250
-- - prime_commission: R$ 100 (vai direto para o vendedor)
--
-- Na tabela de comissões:
-- - Se é PRIME: usar prime_commission ao invés de 1% do valor
-- - Se é venda normal: usar 1% de amount (já implementado)
-- ============================================
