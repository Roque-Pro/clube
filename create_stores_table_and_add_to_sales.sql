-- ============================================
-- CRIAR TABELA DE LOJAS (STORES)
-- ============================================

-- 1. Criar tabela stores
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Adicionar coluna store_id à tabela sales
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT;

-- 3. Adicionar coluna store_id à tabela services
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT;

-- 4. Adicionar coluna primary_store_id à tabela employees
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS primary_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- 5. Inserir as 3 lojas (ajuste emails conforme necessário)
INSERT INTO public.stores (name, code, phone, address, is_active)
VALUES 
  ('JJ PARABRISAS', 'loja_1', '(45) 9999-0001', 'Endereço Loja 1, Cidade - Estado', true),
  ('IGUAÇU AUTO VIDROS', 'loja_2', '(45) 9999-0002', 'Endereço Loja 2, Cidade - Estado', true),
  ('IGUAÇU AUTO - SOM E ACESSÓRIOS', 'loja_3', '(45) 9999-0003', 'Endereço Loja 3, Cidade - Estado', true)
ON CONFLICT (name) DO NOTHING;

-- 6. Atualizar profiles para vincular store_id (opcional - para melhor controle)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- 7. Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas de segurança para stores
CREATE POLICY "Authenticated users can view stores"
  ON public.stores FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage stores"
  ON public.stores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Atualizar sales para vincular com stores (migração de dados)
-- Vincular vendas baseado em store_name existente
UPDATE public.sales
SET store_id = (
  SELECT id FROM public.stores 
  WHERE name = 'JJ PARABRISAS' 
  LIMIT 1
)
WHERE store_name LIKE '%JJ%' AND store_id IS NULL;

UPDATE public.sales
SET store_id = (
  SELECT id FROM public.stores 
  WHERE name = 'IGUAÇU AUTO VIDROS' 
  LIMIT 1
)
WHERE store_name LIKE '%VIDROS%' AND store_id IS NULL;

UPDATE public.sales
SET store_id = (
  SELECT id FROM public.stores 
  WHERE name = 'IGUAÇU AUTO - SOM E ACESSÓRIOS' 
  LIMIT 1
)
WHERE store_name LIKE '%SOM%' AND store_id IS NULL;

-- Fallback: Qualquer venda sem store_id recebe Loja 1
UPDATE public.sales
SET store_id = (
  SELECT id FROM public.stores WHERE code = 'loja_1' LIMIT 1
)
WHERE store_id IS NULL;

-- 10. Fazer store_id NOT NULL após migração
ALTER TABLE public.sales
ALTER COLUMN store_id SET NOT NULL;

-- 11. Criar índices para performance
CREATE INDEX idx_sales_store_id ON public.sales(store_id);
CREATE INDEX idx_sales_store_date ON public.sales(store_id, sale_date);
CREATE INDEX idx_services_store_id ON public.services(store_id);
CREATE INDEX idx_employees_primary_store_id ON public.employees(primary_store_id);
CREATE INDEX idx_profiles_store_id ON public.profiles(store_id);
CREATE INDEX idx_stores_code ON public.stores(code);

-- ============================================
-- END: CRIAR TABELA STORES
-- ============================================
