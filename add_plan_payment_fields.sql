-- ============================================
-- Migration: Adicionar campos de pagamento do plano
-- ============================================

-- 1. Adicionar campos na tabela clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'free'; -- 'free', 'active', 'expired'

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS plan_paid_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS annual_replacements_used INTEGER DEFAULT 0;

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS annual_replacements_max INTEGER DEFAULT 3;

-- 2. Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.plan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  stripe_payment_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_period_start DATE NOT NULL,
  payment_period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_plan_payments_client_id ON public.plan_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_plan_payments_status ON public.plan_payments(status);
CREATE INDEX IF NOT EXISTS idx_plan_payments_stripe_id ON public.plan_payments(stripe_payment_id);

-- 4. Adicionar coluna na tabela appointments para marcar se é do plano
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS is_plan_replacement BOOLEAN DEFAULT false;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'; -- 'pending', 'paid', 'free'

-- 5. Criar índices para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_plan_status ON public.appointments(is_plan_replacement);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);

-- 6. RLS Policy para plan_payments
ALTER TABLE public.plan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes podem ver seus próprios pagamentos" ON public.plan_payments
  FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM public.clients WHERE id = client_id)
    OR 
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins podem gerenciar todos os pagamentos" ON public.plan_payments
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin'));
