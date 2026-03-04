# Implementação: Vendas com Múltiplos Vendedores por Produto

## Resumo
Implementação de um novo fluxo de vendas que permite associar **diferentes vendedores a cada produto** dentro da mesma venda, mantendo a lógica de comissões já existente.

## Arquivos Criados

### 1. Migração de Banco de Dados
**Arquivo:** `create_sale_products_employees_table.sql`

Cria a tabela `sale_products_employees` que funciona como uma tabela de junção entre:
- `sales` (venda principal)
- `products` (produto vendido)
- `employees` (vendedor responsável)

Estrutura:
```sql
CREATE TABLE sale_products_employees (
  id UUID PRIMARY KEY,
  sale_id UUID (refs sales),
  product_id UUID (refs products),
  employee_id UUID (refs employees),
  quantity INTEGER,
  unit_price DECIMAL,
  subtotal DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Índices criados:**
- `sale_id` - para buscar produtos de uma venda
- `employee_id` - para calcular comissões do vendedor
- `product_id` - para rastreamento de movimentação

**Como executar:**
1. Copie o SQL do arquivo
2. Cole no editor SQL do Supabase (no painel da sua base de dados)
3. Execute o script

### 2. Nova Página de Vendas
**Arquivo:** `src/pages/SalesNew.tsx`

Página completa com UI melhorada que permite:
- Adicionar **múltiplos produtos** a uma única venda
- Associar um **vendedor específico a cada produto**
- Ver o **total da venda** em tempo real
- Remover itens antes de confirmar

**Fluxo:**
1. Usuário clica "Registrar Venda"
2. Seleciona produto → vendedor → quantidade
3. Clica "Adicionar Item"
4. Repete para múltiplos itens
5. Confirma a venda completa

**Dados salvos:**
- Tabela `sales` (registro principal da venda)
- Tabela `sale_products_employees` (vinculação de cada produto com vendedor)
- Tabela `product_movements` (movimentação de estoque)
- Tabela `audit_logs` (log de ações)

### 3. Hook para Consulta
**Arquivo:** `src/hooks/useSaleProductsEmployees.ts`

Hook custom que busca dados da tabela `sale_products_employees`:
```typescript
const { data, loading, error, refetch } = useSaleProductsEmployees();
```

## Próximos Passos

### 1. Atualizar SalesCommissionsTab
Modificar `src/components/SalesCommissionsTab.tsx` para:
- Usar `sale_products_employees` ao invés de campo direto `employee_id` em `sales`
- Calcular comissões baseado em cada produto-vendedor
- Fórmula: **comissão = subtotal_produto * 0.01** (1%)

**Lógica sugerida:**
```typescript
// Ao invés de buscar de "sales.employee_id"
// Buscar de "sale_products_employees"
const { data: saleProductsData } = await supabase
  .from("sale_products_employees")
  .select("*");

// Para cada item, associar ao vendedor
saleProductsData.forEach((item) => {
  // item.employee_id = vendedor
  // item.subtotal = valor base para comissão
  const commission = item.subtotal * 0.01;
});
```

### 2. Migrar Página de Vendas
**Opção A (Recomendada):** Substituir `src/pages/Sales.tsx` pela nova `SalesNew.tsx`
- Renomear `Sales.tsx` → `Sales_old.tsx` (backup)
- Renomear `SalesNew.tsx` → `Sales.tsx`
- Atualizar import em rotas se necessário

**Opção B:** Manter ambas e deixar usuário escolher (mais trabalho)

### 3. Testar Comissões
Verificar no painel Admin → Comissões:
- Vendedor A vendeu 2 produtos na mesma venda
- Vendedor B vendeu 1 produto na mesma venda
- Comissões devem refletir isso corretamente

**Teste prático:**
1. Criar venda com 3 produtos
2. Produto 1: R$ 100 → Vendedor A
3. Produto 2: R$ 150 → Vendedor B
4. Produto 3: R$ 200 → Vendedor A
5. **Resultado esperado:**
   - Vendedor A: R$ 300 em vendas (comissão = R$ 3)
   - Vendedor B: R$ 150 em vendas (comissão = R$ 1,50)

### 4. Atualizar Tabela de Histórico de Vendas
Adicionar coluna que mostre os vendedores associados (ex: "Prod 1: João, Prod 2: Maria")

## Dados de Teste

Para testar a nova tabela, insira dados manualmente:

```sql
-- Após executar a migração
INSERT INTO sale_products_employees (
  sale_id, product_id, employee_id, quantity, unit_price, subtotal
) VALUES (
  '12345-uuid-here',  -- sale_id real
  '67890-uuid-here',  -- product_id real
  'abc-employee-id',  -- employee_id real
  2,                  -- quantidade
  150.00,             -- preço unitário
  300.00              -- subtotal
);
```

## Estrutura de Dados no Banco

### Antes (Layout Atual)
```
vendas (sales)
  ├── id
  ├── employee_id (ÚNICO vendedor)
  ├── amount
  └── description
```

### Depois (Nova Estrutura)
```
vendas (sales)
  ├── id
  ├── amount (SOMA de todos os produtos)
  └── description

sale_products_employees (NOVA)
  ├── sale_id → sales.id
  ├── product_id → products.id
  ├── employee_id → employees.id (específico por produto)
  ├── quantity
  ├── unit_price
  └── subtotal
```

## Compatibilidade

- ✅ Não altera tabela `sales` existente
- ✅ Não altera tabela `employees` existente
- ✅ Não altera tabela `products` existente
- ✅ Cria tabela **nova** sem impacto em dados atuais
- ⚠️ Código antigo continuará funcionar (campo `employee_id` em `sales` ainda existe)
- ✅ Transição pode ser gradual

## Rollback

Se precisar reverter:
```sql
DROP TABLE IF EXISTS sale_products_employees CASCADE;
```

Dados em `sales` não serão afetados.

---

**Status:** Pronto para teste local
**Próximo passo:** Executar migração SQL no Supabase
