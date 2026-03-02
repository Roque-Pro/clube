import { useState, useEffect } from "react";
import { Plus, Search, AlertTriangle, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/auditLog";

interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  price: number;
  supplier: string;
  cost_price?: number;
}

const productCategories = ["Para-brisa", "Retrovisor", "Vigia", "Farol", "Vidro lateral", "Insumo", "Ferramenta", "Outro"];

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", category: "", quantity: "", minQuantity: "", price: "", supplier: "", costPrice: "" });
  const [submitting, setSubmitting] = useState(false);
  const [quantityModalOpen, setQuantityModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityChange, setQuantityChange] = useState("");

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar produtos:", error);
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name || !form.category || !form.quantity) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
         .from("products")
         .insert({
           name: form.name,
           category: form.category,
           quantity: parseInt(form.quantity),
           min_quantity: parseInt(form.minQuantity) || 1,
           price: parseFloat(form.price) || 0,
           cost_price: parseFloat(form.costPrice) || 0,
           supplier: form.supplier || "N/A",
         })
         .select();

      if (error) throw error;
      
      // Log da ação
      if (data && data[0]) {
        logAction("create", "products", data[0].id, form.name, `Categoria: ${form.category} - Qtd: ${form.quantity} - Fornecedor: ${form.supplier || "N/A"}`);
      }
      
      toast({ title: "Produto cadastrado com sucesso!" });
      setForm({ name: "", category: "", quantity: "", minQuantity: "", price: "", supplier: "", costPrice: "" });
      setDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar produto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 0) {
      toast({ title: "Quantidade não pode ser negativa", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase
        .from("products")
        .update({ quantity: newQuantity })
        .eq("id", id);

      if (error) throw error;
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar quantidade",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openQuantityModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantityChange("");
    setQuantityModalOpen(true);
  };

  const handleAddStock = async () => {
    if (!selectedProduct || !quantityChange) {
      toast({ title: "Digite a quantidade", variant: "destructive" });
      return;
    }
    const change = parseInt(quantityChange);
    if (isNaN(change) || change <= 0) {
      toast({ title: "Digite uma quantidade válida", variant: "destructive" });
      return;
    }
    const newQuantity = selectedProduct.quantity + change;
    await handleUpdateQuantity(selectedProduct.id, newQuantity);
    
    // Log da ação
    logAction("update", "products", selectedProduct.id, selectedProduct.name, `Adicionado +${change} unidades (Compra registrada)`);
    
    toast({ title: `+${change} unidades adicionadas`, variant: "default" });
    setQuantityModalOpen(false);
  };

  const handleRemoveStock = async () => {
     if (!selectedProduct || !quantityChange) {
       toast({ title: "Digite a quantidade", variant: "destructive" });
       return;
     }
     const change = parseInt(quantityChange);
     if (isNaN(change) || change <= 0) {
       toast({ title: "Digite uma quantidade válida", variant: "destructive" });
       return;
     }
     const newQuantity = selectedProduct.quantity - change;
     if (newQuantity < 0) {
       toast({ title: "Quantidade insuficiente em estoque", variant: "destructive" });
       return;
     }
     
     try {
       await handleUpdateQuantity(selectedProduct.id, newQuantity);
       
       // Log da ação
       logAction("update", "products", selectedProduct.id, selectedProduct.name, `Removido -${change} unidades (Venda registrada)`);
       
       // Nota: As vendas são registradas como remoção de itens do estoque
       // O indicador "Vendas" no Dashboard é atualizado pelo sales_count dos employees
       // Esta remoção contribui para as estatísticas gerais de estoque
       
       toast({ title: `-${change} unidades removidas (Venda registrada)`, variant: "default" });
       setQuantityModalOpen(false);
     } catch (error) {
       toast({ title: "Erro ao atualizar estoque", variant: "destructive" });
     }
   };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary">
            <Package className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Controle de produtos e insumos"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground font-semibold gap-2 glow-primary">
                <Plus className="w-4 h-4" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display">Cadastrar Produto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do produto" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{productCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Fornecedor</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Nome do fornecedor" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div><Label>Quantidade *</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                   <div><Label>Qtd Mínima</Label><Input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div><Label>Preço de Venda (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                   <div><Label>Preço de Custo (R$)</Label><Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="Valor do fornecedor" /></div>
                 </div>
                <Button onClick={handleAdd} disabled={submitting} className="w-full gradient-primary text-primary-foreground font-semibold">{submitting ? "Salvando..." : "Cadastrar"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto, categoria ou fornecedor..." className="pl-10 bg-card border-border" />
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fornecedor</th>
              <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qtd</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Venda</th>
              <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((p, i) => {
                const isLow = p.quantity <= p.min_quantity;
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isLow ? "bg-destructive/15" : "bg-primary/15")}>
                          <Package className={cn("w-4 h-4", isLow ? "text-destructive" : "text-primary")} />
                        </div>
                        <span className="font-medium text-foreground text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{p.category}</td>
                     <td className="p-4 text-sm text-muted-foreground">{p.supplier || "—"}</td>
                     <td className={cn("p-4 text-center font-bold text-sm", isLow ? "text-destructive" : "text-foreground")}>{p.quantity}</td>
                     <td className="p-4 text-right text-sm text-foreground">R$ {(p.cost_price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                     <td className="p-4 text-right text-sm text-foreground">R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-center">
                       {isLow ? (
                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/15 text-destructive">
                           <AlertTriangle className="w-3 h-3" /> Baixo
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
                           OK
                         </span>
                       )}
                     </td>
                     <td className="p-4 text-center">
                       <Button
                         size="sm"
                         variant="outline"
                         className="border-primary/30 text-primary hover:bg-primary/10"
                         onClick={() => openQuantityModal(p)}
                       >
                         Gerenciar
                       </Button>
                     </td>
                    </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {products.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum produto cadastrado
        </div>
      )}

      <Dialog open={quantityModalOpen} onOpenChange={setQuantityModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Gerenciar Estoque</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="p-4 bg-secondary/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Produto</p>
                <p className="font-semibold text-lg text-foreground">{selectedProduct.name}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Estoque atual: <span className="font-bold text-primary">{selectedProduct.quantity} unidades</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Quantidade a ajustar *</Label>
                <Input
                  type="number"
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(e.target.value)}
                  placeholder="Digite o número de unidades"
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAddStock}
                  className="gradient-primary text-primary-foreground font-semibold gap-2"
                >
                  ➕ Adicionar (Compra)
                </Button>
                <Button
                  onClick={handleRemoveStock}
                  variant="destructive"
                  className="font-semibold gap-2"
                >
                  ➖ Remover (Venda)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
