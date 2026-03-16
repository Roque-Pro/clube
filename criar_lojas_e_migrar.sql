-- ============================================
-- CRIAR SISTEMA DE 3 LOJAS - ITEM 2
-- Adaptado para seu banco existente
-- ============================================

-- 1️⃣ CRIAR TABELA STORES
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2️⃣ INSERIR AS 3 LOJAS (baseado em store_name existente)
INSERT INTO public.stores (name, code, phone, address)
VALUES 
  ('JJ PARABRISAS', 'loja_jj', '(45) 9999-0001', 'Endereço JJ Parabrisas'),
  ('IGUAÇU AUTO VIDROS', 'loja_vidros', '(45) 9999-0002', 'Endereço Iguaçu Auto Vidros'),
  ('IGUAÇU AUTO - SOM E ACESSÓRIOS', 'loja_som', '(45) 9999-0003', 'Endereço Som e Acessórios')
ON CONFLICT (name) DO NOTHING;

-- 3️⃣ ADICIONAR store_id À TABELA SALES
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT;

-- 4️⃣ ADICIONAR store_id À TABELA SERVICES
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT;

-- 5️⃣ MIGRAR DADOS: Vincular sales existentes com stores
-- Atribuir vendas para JJ PARABRISAS
UPDATE public.sales
SET store_id = (SELECT id FROM public.stores WHERE code = 'loja_jj' LIMIT 1)
WHERE store_name LIKE '%JJ%' AND store_id IS NULL;

-- Atribuir vendas para IGUAÇU AUTO VIDROS
UPDATE public.sales
SET store_id = (SELECT id FROM public.stores WHERE code = 'loja_vidros' LIMIT 1)
WHERE (store_name LIKE '%VIDROS%' OR store_name LIKE '%Iguaçu%') AND store_id IS NULL;

-- Atribuir vendas para SOM E ACESSÓRIOS
UPDATE public.sales
SET store_id = (SELECT id FROM public.stores WHERE code = 'loja_som' LIMIT 1)
WHERE store_name LIKE '%SOM%' AND store_id IS NULL;

-- FALLBACK: Qualquer venda sem loja vai para Loja 1
UPDATE public.sales
SET store_id = (SELECT id FROM public.stores WHERE code = 'loja_jj' LIMIT 1)
WHERE store_id IS NULL;

-- 6️⃣ CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON public.sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_store_date ON public.sales(store_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_services_store_id ON public.services(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_code ON public.stores(code);

-- 7️⃣ ENABLE RLS NA TABELA STORES
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 8️⃣ POLÍTICAS DE SEGURANÇA
CREATE POLICY "Authenticated users can view stores"
  ON public.stores FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage stores"
  ON public.stores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VERIFICAÇÃO PÓS-EXECUÇÃO
-- ============================================

-- Verificar lojas criadas:
-- SELECT * FROM public.stores;

-- Verificar vendas com store_id:
-- SELECT id, store_name, store_id FROM public.sales LIMIT 10;

-- Verificar se todas as vendas têm store_id:
-- SELECT COUNT(*) as total, COUNT(store_id) as com_store FROM public.sales;

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
