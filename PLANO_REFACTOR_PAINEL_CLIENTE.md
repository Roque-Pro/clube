# Plano de Refactor - Painel do Cliente

## Objetivos
1. Liberar agendamento sem limite após cadastro
2. Adicionar botão de pagamento do plano (integração Stripe futura)
3. Após pagamento: liberar 3 trocas gratuitas anuais
4. Criar status para diferenciar clientes com/sem plano ativo
5. Status deve acompanhar cliente para orientar a empresa
6. Exibição clara após pagamento sobre as 3 trocas grátis

## Mudanças no Banco de Dados

### 1. Adicionar Campos na Tabela `clients`
```sql
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'free'; -- 'free', 'active', 'expired'
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS plan_paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS annual_replacements_used INTEGER DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS annual_replacements_max INTEGER DEFAULT 3;
```

### 2. Criar Tabela de Pagamentos
```sql
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
```

## Mudanças no Frontend

### 1. ClientDashboard
- **Seção "Status do Plano"** no topo
  - Se `plan_status = 'free'`: Mostrar botão "Ativar Plano - R$ 239/ano"
  - Se `plan_status = 'active'`: Mostrar "Plano Ativo ✓" com data de renovação
  - Se `plan_status = 'expired'`: Mostrar "Plano Expirado" com botão para renovar

- **Agendamentos Liberados**: Sem limite para qualquer status
  - Mostrar aviso se for cliente free (paga ao agendar/no atendimento)
  - Mostrar benefício se for cliente ativo (3 trocas gratis incluídas)

- **Nova seção: "Minhas Trocas Gratuitas"** (visível quando `plan_status = 'active'`)
  - Mostrar: "Você tem X de 3 trocas gratuitas disponíveis"
  - Progress bar visual
  - Resetar em 01/01 do ano seguinte (ou data do próximo pagamento)

### 2. Modal de Pagamento
- Criar modal/página de checkout
  - Resumo do plano (R$ 239/ano = R$ 19,90/mês)
  - Benefícios (3 trocas gratis, suporte 24/7, etc)
  - Botão "Pagar com Stripe" (placeholder)
  - Após sucesso: Atualizar `plan_status = 'active'`, `plan_paid_at = now()`

### 3. Appointments (Agendamentos)
- Adicionar campo `is_plan_replacement` (boolean)
- Ao criar agendamento de cliente com plano ativo:
  - Marcar como `is_plan_replacement = true`
  - Decrementar `annual_replacements_used`
- Adicionar aviso: "Esta é uma troca gratuita do seu plano"

### 4. Dashboard da Empresa (Atendentes)
- Ao ver cliente no agendamento, mostrar badge:
  - 🟢 "PLANO ATIVO" = cobra 0
  - 🔴 "SEM PLANO" = cobra pelo serviço
  - ⚠️ "PLANO EXPIRADO" = cobra pelo serviço

## Integração com Stripe (Próxima Etapa)

```typescript
// Será implementado depois
const handlePayment = async () => {
  // 1. Criar Checkout Session no Stripe
  // 2. Redirecionar para Stripe Checkout
  // 3. Webhook recebe confirmação
  // 4. Atualizar plan_status e plan_paid_at
}
```

## Fluxo do Cliente

1. **Cadastro** → `plan_status = 'free'`, acesso a agendamentos
2. **Clica "Ativar Plano"** → Modal de pagamento
3. **Pagamento Confirmado** → `plan_status = 'active'`, mostra 3 trocas gratis
4. **Agenda Troca 1** → `annual_replacements_used = 1`, aviso de 2 restantes
5. **Agenda Troca 2** → `annual_replacements_used = 2`, aviso de 1 restante
6. **Agenda Troca 3** → `annual_replacements_used = 3`, próximas trocas pagas
7. **01/01 próximo ano** → Reseta `annual_replacements_used = 0` automaticamente

## Fluxo do Atendente

1. Cliente chega com agendamento
2. Sistema mostra: "🟢 PLANO ATIVO - Troca 2 de 3 (gratuita)" ou "🔴 SEM PLANO - Cobrar pelo serviço"
3. Atendente sabe se cobra ou não
4. Após conclusão: troca registrada automaticamente

## Prioridades

1. ✅ Adicionar campos no banco
2. ✅ Criar seção "Status do Plano" no ClientDashboard
3. ✅ Liberar agendamentos para todos (plan_status qualquer)
4. ✅ Criar modal/página de pagamento (sem Stripe ainda)
5. ✅ Criar seção "Minhas Trocas Gratis"
6. ⏳ Integração Stripe (próximo passo)
7. ⏳ Dashboard do atendente (mostrar status do plano)
