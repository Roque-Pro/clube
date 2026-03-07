# Funcionalidade de Remanejar Produtos

## Descrição
Permite mover produtos entre as lojas (Loja 1, Loja 2, Loja 3) registrando automaticamente a movimentação no histórico do sistema.

## Localização
- **Acesso**: Painel Admin → Sub-aba Inventário → Botão "Remanejar" (ícone de setas)
- **Botão**: Fica entre o botão "Documentos" e "Editar"

## Como Funciona

### 1. Abrir Modal
- Clique no botão "Remanejar" ao lado do produto que deseja mover
- Abrirá um modal com:
  - Nome do produto
  - Loja atual
  - Quantidade em estoque

### 2. Preencher Informações
- **Loja de Origem**: Selecione a loja de onde o produto sairá
  - Mostra a quantidade disponível
- **Quantidade a Mover**: Digite a quantidade (não pode exceder a disponível)
- **Loja de Destino**: Selecione para onde o produto irá
  - Não pode ser a mesma da origem

### 3. Confirmar
- Clique em "Remanejar" para processar a movimentação

## O Que Acontece Automaticamente

### 1. Atualização do Produto
- A coluna `store` do produto é atualizada para a loja de destino
- O `updated_at` é registrado

### 2. Registros de Movimentação
Duas linhas são criadas na tabela `product_movements`:
- **Saída**: `movimento_type = 'saída'` com a quantidade na loja de origem
- **Entrada**: `movimento_type = 'entrada'` com a mesma quantidade na loja de destino
- Ambos têm `reason = "Remanejar: Loja X → Loja Y"`

### 3. Histórico (Audit Log)
- Uma entrada é criada em `audit_logs` com:
  - `action`: "update"
  - `entity_type`: "products"
  - `entity_name`: Nome do produto
  - `details`: "Remanejar X un. de Loja Y para Loja Z"
  - `user_email`: Email do usuário autenticado
  - `created_at`: Data/hora do evento

## Visualização do Histórico
Acesse **Histórico** na barra lateral para ver:
- Todos os remanejamentos
- Quem fez a movimentação
- Quando foi feita
- Quantidade e lojas envolvidas

## Validações
- Loja de origem e destino não podem ser iguais
- Quantidade deve ser positiva
- Quantidade não pode exceder o estoque disponível
- Ambos os campos obrigatórios devem estar preenchidos

## Lojas Disponíveis
1. **Loja 1** (padrão)
2. **Loja 2**
3. **Loja 3**

## Tabelas Envolvidas
- `products` - Atualiza coluna `store`
- `product_movements` - Registra saída e entrada
- `audit_logs` - Registra ação para histórico

## Limitações Atuais
- Cada renenejamento move 100% da quantidade para a nova loja
- Não permite dividir estoque entre duas lojas do mesmo produto
- A quantidade ao remanejar é a quantidade total do produto
