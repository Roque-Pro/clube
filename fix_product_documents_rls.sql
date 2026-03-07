-- Corrigir RLS policies para product_documents
-- Remover policies antigas
DROP POLICY IF EXISTS "product_documents_select" ON public.product_documents;
DROP POLICY IF EXISTS "product_documents_insert" ON public.product_documents;
DROP POLICY IF EXISTS "product_documents_delete" ON public.product_documents;

-- Criar novas policies com autenticação
-- Policy para leitura (anyone can read)
CREATE POLICY "product_documents_select_all" ON public.product_documents
  FOR SELECT
  USING (true);

-- Policy para inserção (authenticated users)
CREATE POLICY "product_documents_insert_auth" ON public.product_documents
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy para update (authenticated users)
CREATE POLICY "product_documents_update_auth" ON public.product_documents
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy para delete (authenticated users)
CREATE POLICY "product_documents_delete_auth" ON public.product_documents
  FOR DELETE
  USING (auth.role() = 'authenticated');
