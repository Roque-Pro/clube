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
     store?: string;
     code?: string;
     description?: string;
}

const productCategories = ["Para-brisa", "Retrovisor", "Vigia", "Farol", "Janela", "Porta", "Óculos", "Insumo", "Ferramenta", "Outro"];

const stores = ["Loja 1", "Loja 2", "Loja 3"];

const Inventory = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [selectedStore, setSelectedStore] = useState("Loja 1");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [form, setForm] = useState({ name: "", category: "", quantity: "", minQuantity: "", price: "", supplier: "", costPrice: "", store: "Loja 1", code: "", description: "" });
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
        (p) => {
            const searchLower = search.toLowerCase();
            return (
                p.name.toLowerCase().includes(searchLower) ||
                p.category.toLowerCase().includes(searchLower) ||
                p.supplier.toLowerCase().includes(searchLower) ||
                (p.code && p.code.toLowerCase().includes(searchLower)) ||
                (p.description && p.description.toLowerCase().includes(searchLower)) ||
                (p.store && p.store.toLowerCase().includes(searchLower)) ||
                p.quantity.toString().includes(searchLower) ||
                p.price.toString().includes(searchLower) ||
                (p.cost_price && p.cost_price.toString().includes(searchLower))
            );
        }
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
                    store: form.store || "Loja 1",
                    code: form.code || null,
                    description: form.description || null,
                })
                .select();

            if (error) throw error;

            // Log da ação
            if (data && data[0]) {
                logAction("create", "products", data[0].id, form.name, `Código: ${form.code || "N/A"} - Categoria: ${form.category} - Qtd: ${form.quantity} - Fornecedor: ${form.supplier || "N/A"}`);
            }

            toast({ title: "Produto cadastrado com sucesso!" });
            setForm({ name: "", category: "", quantity: "", minQuantity: "", price: "", supplier: "", costPrice: "", store: "Loja 1", code: "", description: "" });
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
                                 <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Código do produto" /></div>
                                 <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do produto" /></div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <Label>Categoria *</Label>
                                         <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                             <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                             <SelectContent>{productCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                         </Select>
                                     </div>
                                     <div>
                                         <Label>Loja *</Label>
                                         <Select value={form.store} onValueChange={(v) => setForm({ ...form, store: v })}>
                                             <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                             <SelectContent>{stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                         </Select>
                                     </div>
                                 </div>
                                 <div><Label>Fornecedor</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Nome do fornecedor" /></div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div><Label>Quantidade *</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                                     <div><Label>Qtd Mínima</Label><Input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} /></div>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div><Label>Preço de Venda (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                                     <div><Label>Preço de Custo (R$)</Label><Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="Valor do fornecedor" /></div>
                                 </div>
                                 <div><Label>Observação</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Adicione observações sobre o produto" /></div>
                                 <Button onClick={handleAdd} disabled={submitting} className="w-full gradient-primary text-primary-foreground font-semibold">{submitting ? "Salvando..." : "Cadastrar"}</Button>
                                 </div>
                                 </DialogContent>
                                 </Dialog>
                }
            />

            <div className="mb-6 flex gap-4 items-end">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, categoria, fornecedor, código, descrição, loja, quantidade ou preço..." className="pl-10 bg-card border-border" />
                </div>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
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
                                             <td className="p-4" colSpan={9}>
                                                 <div className="flex items-start justify-between gap-3 w-full">
                                                     <div className="flex items-start gap-3 flex-1">
                                                         <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", isLow ? "bg-destructive/15" : "bg-primary/15")}>
                                                             <Package className={cn("w-4 h-4", isLow ? "text-destructive" : "text-primary")} />
                                                         </div>
                                                         <div className="flex-1 min-w-0">
                                                             <div className="flex items-center gap-2">
                                                                 <span className="font-medium text-foreground text-sm">{p.name}</span>
                                                                 {p.code && (
                                                                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                                                                         <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                                         {p.code}
                                                                     </span>
                                                                 )}
                                                             </div>
                                                             <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-xs text-muted-foreground mt-2">
                                                                 <div><span className="font-medium">Cat:</span> {p.category}</div>
                                                                 <div><span className="font-medium">Loja:</span> {p.store || "—"}</div>
                                                                 <div><span className="font-medium">Forn:</span> {p.supplier || "—"}</div>
                                                                 <div className={cn("font-bold", isLow ? "text-destructive" : "text-foreground")}><span className="font-medium">Qtd:</span> {p.quantity}</div>
                                                             </div>
                                                             <div className="grid grid-cols-2 gap-2 md:gap-4 text-xs text-muted-foreground mt-2">
                                                                 <div><span className="font-medium">Custo:</span> R$ {(p.cost_price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                                                                 <div><span className="font-medium">Venda:</span> R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                                                             </div>
                                                             {p.description && (
                                                                 <div className="mt-2 flex items-start gap-2">
                                                                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600 border border-blue-500/30 flex-shrink-0">
                                                                         <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                                         Descrição
                                                                     </span>
                                                                     <p className="text-xs text-muted-foreground italic">{p.description}</p>
                                                                 </div>
                                                             )}
                                                             {isLow && <p className="text-xs text-destructive mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Estoque baixo!</p>}
                                                         </div>
                                                     </div>
                                                     <div className="flex items-center gap-2 flex-shrink-0">
                                                         {!isLow && (
                                                             <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/15 text-success whitespace-nowrap">
                                                                 OK
                                                             </span>
                                                         )}
                                                         <Button
                                                             size="sm"
                                                             variant="outline"
                                                             className="border-primary/30 text-primary hover:bg-primary/10 whitespace-nowrap"
                                                             onClick={() => openQuantityModal(p)}
                                                         >
                                                             Gerenciar
                                                         </Button>
                                                     </div>
                                                 </div>
                                             </td>
                                         </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
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
