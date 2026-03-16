# ClientStatusBadge - Guia de Uso

## O que é?

Componente reutilizável que mostra um **círculo de status** ao lado do nome do cliente:
- 🔴 **Vermelho** = Sem plano ativo (plan_status = 'free')
- 🟢 **Verde** = Plano ativo (plan_status = 'active')

## Importação

```typescript
import ClientStatusBadge from "@/components/ClientStatusBadge";
```

## Uso Básico

```typescript
<ClientStatusBadge
    planStatus={clientData.plan_status || "free"}
    size="md"
/>
```

## Props

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `planStatus` | "free" \| "active" \| "expired" | "free" | Status do plano do cliente |
| `size` | "sm" \| "md" \| "lg" | "md" | Tamanho do círculo |
| `showLabel` | boolean | false | Mostrar nome do cliente junto |
| `clientName` | string | undefined | Nome para exibir (se showLabel=true) |

## Tamanhos

- **sm**: w-2 h-2 (pequeno, para listas)
- **md**: w-3 h-3 (médio, padrão)
- **lg**: w-4 h-4 (grande, para destaque)

## Exemplos

### Com nome
```typescript
<ClientStatusBadge
    planStatus="active"
    size="md"
    showLabel={true}
    clientName="João Silva"
/>
```

### Em lista
```typescript
<div className="flex items-center gap-2">
    <p>{client.name}</p>
    <ClientStatusBadge
        planStatus={client.plan_status || "free"}
        size="sm"
    />
</div>
```

### Em tabela
```typescript
<td>
    <div className="flex items-center gap-2">
        <span>{appointment.client_name}</span>
        <ClientStatusBadge
            planStatus={appointment.client_plan_status}
            size="sm"
        />
    </div>
</td>
```

## ✅ Já Integrado Em

1. **ClientDashboard.tsx** - Bem-vindo (tamanho md)
2. **Clients.tsx** (Painel de Gerenciamento) - Lista de clientes (tamanho sm)

## ⏳ Precisa Ser Integrado Em

### 1. **Dashboard.tsx** - Painel de Atendentes
Quando visualizam agendamentos pendentes:
```typescript
<ClientStatusBadge
    planStatus={appointment.client_plan_status || "free"}
    size="sm"
/>
```

### 2. **Sales.tsx** - Gestão de Vendas
Ao listar vendas por cliente:
```typescript
<ClientStatusBadge
    planStatus={client.plan_status || "free"}
    size="sm"
/>
```

### 3. **Services.tsx** - Gestão de Serviços
Ao listar serviços prestados:
```typescript
<ClientStatusBadge
    planStatus={service.client_plan_status || "free"}
    size="sm"
/>
```

### 4. **Appointments** (Modal/Dialog)
Quando mostra detalhes do agendamento:
```typescript
<div className="flex items-center gap-2 mb-4">
    <h3>{appointment.client_name}</h3>
    <ClientStatusBadge
        planStatus={appointment.client_plan_status}
        size="sm"
    />
</div>
```

### 5. **Replacements.tsx** - Histórico de Trocas
Ao listar trocas realizadas:
```typescript
<ClientStatusBadge
    planStatus={replacement.client_plan_status || "free"}
    size="sm"
/>
```

### 6. **Analytics.tsx** - Relatórios
Ao mostrar ranking de clientes, vendas, etc:
```typescript
<ClientStatusBadge
    planStatus={client.plan_status || "free"}
    size="md"
/>
```

## 🎨 Características

- ✅ Animação de aparecer (spring animation)
- ✅ Pulsação continua do badge
- ✅ Tooltip ao passar o mouse
- ✅ Cores dinâmicas (vermelho/verde)
- ✅ Responsivo (diferentes tamanhos)
- ✅ Sem necessidade de dados extra

## 📋 Dados Necessários

O componente espera que o cliente tenha:
- `plan_status` ← Campo que você criou no Supabase

Se estiver faltando, use `|| "free"` como fallback!

## 🔄 Próximas Etapas

1. Integrar nas páginas listadas acima
2. Passar `plan_status` junto nos dados de agendamentos, serviços, etc
3. Garantir que todo cliente tem `plan_status` preenchido
4. Testar visualmente
