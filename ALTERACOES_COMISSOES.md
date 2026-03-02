# Integração de Vendas com Comissões de Vendedores

## Resumo das Alterações

O sistema foi modificado para que as **VENDAS** registradas na aba **VENDAS** apareçam automaticamente na sub-aba **COMISSÕES DE VENDEDORES** do PAINEL ADMIN, junto com os **SERVIÇOS** já existentes.

## Arquivos Modificados

### 1. `src/pages/Sales.tsx`
- Adicionado campo para selecionar o **Funcionário/Vendedor** ao registrar uma venda
- As vendas agora salvam `employee_id` e `employee_name`
- Carrega lista de funcionários ativos para seleção

### 2. `src/components/SalesCommissionsTab.tsx`
- Modificado para buscar dados de **VENDAS** além de **SERVIÇOS**
- Transações de vendas e serviços são combinadas e exibidas juntas
- Cálculo de comissão (1%) funciona para ambos os tipos

### 3. `add_employee_to_sales.sql`
- Script SQL para adicionar as colunas necessárias na tabela `sales`:
  - `employee_id` (UUID, foreign key para employees)
  - `employee_name` (TEXT)

## Próximos Passos

### 1. Executar o SQL no Supabase
```sql
ALTER TABLE public.sales 
ADD COLUMN employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
ADD COLUMN employee_name TEXT;
```

**Ação:** Copiar e executar este comando no Supabase Console > SQL Editor

### 2. Implantar as mudanças
- Fazer deploy do código atualizado

## Como Funciona Agora

1. **Registrar Venda (Aba VENDAS)**
   - Campo obrigatório: Selecionar Vendedor/Funcionário
   - A venda é registrada com o ID e nome do funcionário

2. **Ver Comissões (PAINEL ADMIN > ABA COMISSÕES)**
   - Todas as vendas e serviços aparecem no histórico
   - Tabela de comissões mostra total acumulado por vendedor
   - Comissão = 1% do valor total (vendas + serviços)
   - Botão "Imprimir" gera comprovante de comissão

## Observações

- Vendas **sem funcionário atribuído** não aparecerão nas comissões
- Apenas funcionários **ativos** podem ser selecionados
- As comissões se acumulam entre vendas e serviços
- Nenhum dado existente foi removido ou alterado
