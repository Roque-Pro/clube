-- Verificar e configurar políticas do bucket product-documents

-- Ver políticas de storage existentes
SELECT 
  schema,
  name,
  definition
FROM pg_policies
WHERE schema = 'storage'
ORDER BY schema, name;

-- Se não existirem, criar novas políticas para o bucket
-- Nota: Essas políticas devem ser criadas através do dashboard Supabase em:
-- Storage > product-documents > Policies

-- Exemplo das políticas que devem estar ativas:

-- 1. SELECT policy (Qualquer um pode ler)
-- CREATE POLICY "Public Access" ON storage.objects
--   FOR SELECT
--   USING (bucket_id = 'product-documents');

-- 2. INSERT policy (Autenticados podem fazer upload)
-- CREATE POLICY "Authenticated uploads" ON storage.objects
--   FOR INSERT
--   WITH CHECK (
--     bucket_id = 'product-documents' 
--     AND auth.role() = 'authenticated'
--   );

-- 3. DELETE policy (Autenticados podem deletar)
-- CREATE POLICY "Authenticated delete" ON storage.objects
--   FOR DELETE
--   USING (
--     bucket_id = 'product-documents' 
--     AND auth.role() = 'authenticated'
--   );
