-- ============================================
-- Execute esta query no Supabase SQL Editor
-- Para ativar acesso à tabela assets
-- ============================================

-- Verificar se RLS está habilitado
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Authenticated users can view assets" ON public.assets;
DROP POLICY IF EXISTS "Admins can manage assets" ON public.assets;

-- Criar novas políticas
CREATE POLICY "Authenticated users can view assets"
  ON public.assets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage assets"
  ON public.assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Confirmar criação
SELECT * FROM pg_policies WHERE tablename = 'assets';
