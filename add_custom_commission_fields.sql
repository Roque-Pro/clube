-- ============================================
-- COMISSÃO CUSTOMIZÁVEL POR VENDA
-- Adiciona campos para definir tipo e valor da comissão
-- ============================================

-- Adicionar campos na tabela sales
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentual', -- 'percentual' ou 'fixo'
ADD COLUMN IF NOT EXISTS commission_value NUMERIC(10, 2) DEFAULT 1, -- 1% padrão ou valor fixo
ADD COLUMN IF NOT EXISTS calculated_commission NUMERIC(10, 2);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_sales_commission_type ON public.sales(commission_type);
CREATE INDEX IF NOT EXISTS idx_sales_commission_value ON public.sales(commission_value);

-- ============================================
-- NOTAS DE IMPLEMENTAÇÃO
-- ============================================
--
-- Campos adicionados:
-- - commission_type: 'percentual' (%) ou 'fixo' (R$)
-- - commission_value: valor da comissão (1% ou R$ 50, etc)
-- - calculated_commission: comissão final calculada (para facilitar relatórios)
--
-- Exemplo 1 - Comissão por Porcentagem (padrão):
-- commission_type = 'percentual'
-- commission_value = 1
-- Se venda é R$ 100 → comissão = R$ 1
--
-- Exemplo 2 - Comissão Fixa:
-- commission_type = 'fixo'
-- commission_value = 5.00
-- Venda de qualquer valor → comissão = R$ 5 (sempre)
--
-- Exemplo 3 - Comissão Alta em Porcentagem:
-- commission_type = 'percentual'
-- commission_value = 10
-- Se venda é R$ 100 → comissão = R$ 10
-- ============================================
