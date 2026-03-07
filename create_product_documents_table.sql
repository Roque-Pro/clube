-- Criar tabela para documentos de produtos
CREATE TABLE public.product_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  file_size integer,
  CONSTRAINT product_documents_pkey PRIMARY KEY (id),
  CONSTRAINT product_documents_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Índice para buscar documentos por produto
CREATE INDEX idx_product_documents_product_id ON public.product_documents(product_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.product_documents ENABLE ROW LEVEL SECURITY;

-- Policy para permitir leitura
CREATE POLICY "product_documents_select" ON public.product_documents
  FOR SELECT USING (true);

-- Policy para permitir insert
CREATE POLICY "product_documents_insert" ON public.product_documents
  FOR INSERT WITH CHECK (true);

-- Policy para permitir delete
CREATE POLICY "product_documents_delete" ON public.product_documents
  FOR DELETE USING (true);
