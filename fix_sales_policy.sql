-- Fix sales RLS policy to allow authenticated users to insert sales
-- Current policies only allow admins, but sales should be accessible to all authenticated users

DROP POLICY IF EXISTS "Admins can manage sales" ON public.sales;

CREATE POLICY "Authenticated users can view sales"
  ON public.sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sales"
  ON public.sales FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage sales"
  ON public.sales FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sales"
  ON public.sales FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
