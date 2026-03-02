-- Fix product_movements RLS policy to allow authenticated users to insert movements

DROP POLICY IF EXISTS "Admins can manage product movements" ON public.product_movements;

CREATE POLICY "Authenticated users can view product movements"
  ON public.product_movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert product movements"
  ON public.product_movements FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage product movements"
  ON public.product_movements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product movements"
  ON public.product_movements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
