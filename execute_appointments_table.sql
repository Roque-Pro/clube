-- ============================================
-- APPOINTMENTS TABLE - Agendamentos de Serviços
-- Execute este script no Supabase para criar a tabela de agendamentos
-- ============================================

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  service_type TEXT NOT NULL, -- 'Para-brisa', 'Retrovisor', 'Vigia', 'Farol', 'Vidro lateral', 'Insumo', 'Ferramenta', 'Outro'
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'confirmado', 'cancelado', 'concluído'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Authenticated users can view all appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Clients can create their own appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Clients can update their own appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all appointments"
  ON public.appointments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- ============================================
-- FIM - Agendamentos criados com sucesso!
-- ============================================
