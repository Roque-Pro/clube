-- ============================================
-- ADD TIME CHANGE TRACKING TO APPOINTMENTS
-- ============================================

-- Adicionar campos para rastrear mudanças de horário
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS original_scheduled_date DATE,
ADD COLUMN IF NOT EXISTS original_scheduled_time TIME,
ADD COLUMN IF NOT EXISTS time_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS time_change_reason TEXT;

-- Atualizar registros existentes com os valores originais
UPDATE public.appointments
SET original_scheduled_date = scheduled_date,
    original_scheduled_time = scheduled_time
WHERE original_scheduled_date IS NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointments_time_changed_at ON public.appointments(time_changed_at);

-- ============================================
-- FIM - Campos adicionados com sucesso!
-- ============================================
