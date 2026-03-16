# Próximas Etapas - Integração do Sistema de Pagamento

## ✅ Já Criado

### Arquivos SQL
- `add_plan_payment_fields.sql` - Migration para adicionar campos no banco

### Componentes React
1. `PlanStatusCard.tsx` - Card mostrando status do plano (free/active/expired)
2. `FreeTrocasCard.tsx` - Card mostrando trocas gratuitas disponíveis
3. `PlanPaymentModal.tsx` - Modal de pagamento do plano

### Documentação
- `PLANO_REFACTOR_PAINEL_CLIENTE.md` - Estratégia completa

## ⏳ Próximas Etapas

### 1. **Executar Migration no Banco** (URGENTE)
```bash
# Copiar e executar o SQL em:
# Supabase Console → SQL Editor
cat add_plan_payment_fields.sql
```

Isso vai:
- Adicionar campos: `plan_status`, `plan_paid_at`, `annual_replacements_used`, `annual_replacements_max`
- Criar tabela `plan_payments`
- Configurar RLS policies

### 2. **Integrar Componentes no ClientDashboard**

```typescript
// No topo do ClientDashboard.tsx
import PlanStatusCard from "@/components/PlanStatusCard";
import FreeTrocasCard from "@/components/FreeTrocasCard";
import PlanPaymentModal from "@/components/PlanPaymentModal";

// No estado
const [paymentModalOpen, setPaymentModalOpen] = useState(false);

// Renderizar antes dos dados pessoais
{clientData && (
    <>
        <PlanStatusCard
            planStatus={clientData.plan_status || 'free'}
            planPaidAt={clientData.plan_paid_at}
            planEnd={clientData.plan_end}
            onPaymentClick={() => setPaymentModalOpen(true)}
            onRenewClick={() => setPaymentModalOpen(true)}
        />
        <FreeTrocasCard
            replacementsUsed={clientData.annual_replacements_used || 0}
            maxReplacements={clientData.annual_replacements_max || 3}
            planStatus={clientData.plan_status || 'free'}
        />
        <PlanPaymentModal
            isOpen={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            onPaymentClick={handlePayment}
            clientName={clientData.name}
        />
    </>
)}
```

### 3. **Implementar Função de Pagamento (Placeholder por enquanto)**

```typescript
// Adicionar no ClientDashboard.tsx
const handlePayment = async () => {
    try {
        // TODO: Integrar com Stripe
        // 1. Chamar backend para criar Checkout Session
        // 2. Redirecionar para Stripe
        // 3. Webhook atualizará plan_status quando confirmado
        
        console.log("Redirecionar para Stripe...");
        // window.location.href = stripeCheckoutUrl;
    } catch (err) {
        console.error("Erro ao iniciar pagamento:", err);
    }
};
```

### 4. **Liberar Agendamentos para Todos**

Modificar a lógica de agendamentos para:
- ✅ Clientes `free` podem agendar (mas pagam no atendimento)
- ✅ Clientes `active` podem agendar (paga 3x grátis, depois paga)
- ✅ Remover limite de agendamentos

```typescript
// No diálogo de agendamento
const handleSubmitAppointment = async () => {
    // Liberar agendamento para qualquer status
    // Ao criar: marcar is_plan_replacement = true se plan_status === 'active'
    // Decrementar annual_replacements_used se necessário
};
```

### 5. **Preparar Dashboard para Atendentes** (Próxima fase)

No painel de atendimento, ao ver um agendamento:

```typescript
// Mostrar badge
const getPlanBadge = (client) => {
    switch(client.plan_status) {
        case 'active':
            return {
                label: '🟢 PLANO ATIVO',
                color: 'bg-green-100 text-green-800',
                description: `Troca ${client.annual_replacements_used + 1} de 3 (GRATUITA)`
            };
        case 'expired':
            return {
                label: '⚠️ PLANO EXPIRADO',
                color: 'bg-orange-100 text-orange-800',
                description: 'COBRAR PELO SERVIÇO'
            };
        case 'free':
        default:
            return {
                label: '🔴 SEM PLANO',
                color: 'bg-red-100 text-red-800',
                description: 'COBRAR PELO SERVIÇO'
            };
    }
};
```

## 🎯 Fluxo Completo (Quando Integrado)

1. Cliente acessa ClientDashboard
   - Se `plan_status = 'free'`: Ver card "Ativar Plano - R$ 239/ano"
   - Se `plan_status = 'active'`: Ver card "Plano Ativo ✓" + "Trocas Gratis: 2 de 3"

2. Cliente clica "Ativar Plano"
   - Modal de pagamento abre
   - Vê os benefícios
   - Clica "Pagar com Stripe"
   - (Futuramente) Redirecionado ao Stripe Checkout

3. Após pagamento confirmado (webhook)
   - `plan_status = 'active'`
   - `plan_paid_at = now()`
   - `annual_replacements_used = 0`
   - `annual_replacements_max = 3`

4. Cliente agenda serviço
   - Se `plan_status = 'active'` e `annual_replacements_used < 3`:
     - Marcar como `is_plan_replacement = true`
     - Decrementar `annual_replacements_used`
     - Mostrar: "Esta é sua X de 3 trocas gratuitas"

5. Atendente vê o agendamento
   - Badge mostra: "🟢 PLANO ATIVO - Troca 2 de 3 (GRATUITA)"
   - Sabe que não cobra

## 📋 Checklist

- [ ] Executar migration SQL no Supabase
- [ ] Integrar PlanStatusCard no ClientDashboard
- [ ] Integrar FreeTrocasCard no ClientDashboard
- [ ] Integrar PlanPaymentModal no ClientDashboard
- [ ] Criar função handlePayment (placeholder)
- [ ] Testar fluxo de exibição dos componentes
- [ ] Liberar agendamentos para todos (remover restrições)
- [ ] Implementar lógica de is_plan_replacement no appointment
- [ ] Implementar webhook Stripe (próxima fase)
- [ ] Dashboard atendente com badge de status (próxima fase)

## 🔗 Links Importantes

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Webhooks Stripe](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 🚨 Observações Importantes

- **NÃO integrar Stripe ainda** - Apenas preparar estructura
- **Botão de Pagamento** pode ficar como placeholder ("Pagar com Stripe")
- **Status do Plano** já pode ser testado alterando manualmente no Supabase
- **Agendamentos** devem funcionar para qualquer status desde já
- **Badge para atendente** é de segunda prioridade
