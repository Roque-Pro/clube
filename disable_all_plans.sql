-- ============================================
-- DESATIVAR TODOS OS PLANOS
-- ============================================

-- Deixar todos os planos OFF (plan_active = false)
UPDATE public.clients
SET plan_active = false
WHERE plan_active = true;

-- Verificar quantos planos foram desativados
SELECT COUNT(*) as planos_desativados
FROM public.clients
WHERE plan_active = false;

-- Opcional: Ver todos os clientes com seus status
SELECT id, name, email, plan_active, plan_end
FROM public.clients
ORDER BY updated_at DESC;
