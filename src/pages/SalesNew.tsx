import { useState, useEffect } from "react";
import { ShoppingCart, Plus, TrendingUp, AlertCircle, Eye, EyeOff, Download, X, Trash2, FileText, Loader } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/auditLog";
import { generateReceipt } from "@/lib/generateReceipt";
import { ReceiptModal } from "@/components/ReceiptModal";

interface Product {
    id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    supplier: string;
}

interface Employee {
    id: string;
    name: string;
}

interface SaleItemEmployee {
    employee_id: string;
    employee_name: string;
}

interface SaleItem {
    product_id: string;
    employees: SaleItemEmployee[];
    quantity: number;
    unit_price?: number;
    product_name?: string;
}

interface Sale {
    id: string;
    description: string;
    amount: number;
    sale_type: string;
    sale_date: string;
    notes?: string;
    payment_method?: string;
}

const SalesNew = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    // Form state
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [currentItem, setCurrentItem] = useState<Partial<SaleItem>>({
        product_id: "",
        employees: [],
        quantity: 1,
    });
    const [currentEmployeeId, setCurrentEmployeeId] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("dinheiro");

    const [totalSales, setTotalSales] = useState(0);
    const [showValues, setShowValues] = useState(true);
    const [generatingReceipt, setGeneratingReceipt] = useState<string | null>(null);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
    const [receiptFileName, setReceiptFileName] = useState("");
    const [generatingReceiptForSaleId, setGeneratingReceiptForSaleId] = useState<string | null>(null);

    // Fetch products
    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .order("name");

            if (error) throw error;
            setProducts(data || []);
        } catch (err: any) {
            toast({
                title: "Erro ao carregar produtos",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    // Fetch employees
    const fetchEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from("employees")
                .select("id, name")
                .eq("active", true)
                .order("name");

            if (error) throw error;
            setEmployees(data || []);
        } catch (err: any) {
            console.error("Erro ao carregar funcionários:", err);
        }
    };

    // Fetch sales
    const fetchSales = async () => {
        try {
            const { data, error } = await supabase
                .from("sales")
                .select("*")
                .order("sale_date", { ascending: false });

            if (error) throw error;
            setSales(data || []);

            // Calculate total
            const total = (data || []).reduce((sum: number, sale: Sale) => sum + Number(sale.amount), 0);
            setTotalSales(total);
        } catch (err: any) {
            toast({
                title: "Erro ao carregar vendas",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchEmployees();
        fetchSales();
    }, []);

    // Add employee to current item
    const handleAddEmployeeToItem = () => {
        if (!currentEmployeeId) {
            toast({ title: "Selecione um colaborador", variant: "destructive" });
            return;
        }

        const employee = employees.find((e) => e.id === currentEmployeeId);

        if (!employee) {
            toast({ title: "Colaborador não encontrado", variant: "destructive" });
            return;
        }

        // Check if employee already in item
        if (currentItem.employees?.some((e) => e.employee_id === currentEmployeeId)) {
            toast({ title: "Este colaborador já foi adicionado", variant: "destructive" });
            return;
        }

        const newEmployees = [...(currentItem.employees || []), { employee_id: currentEmployeeId, employee_name: employee.name }];

        setCurrentItem({
            ...currentItem,
            employees: newEmployees,
        });

        setCurrentEmployeeId("");
        toast({ title: "Colaborador adicionado", description: `${employee.name} associado ao produto` });
    };

    // Add item to sale
    const handleAddItem = () => {
        if (!currentItem.product_id || !currentItem.employees || currentItem.employees.length === 0) {
            toast({ title: "Selecione produto e pelo menos um colaborador", variant: "destructive" });
            return;
        }

        const product = products.find((p) => p.id === currentItem.product_id);
        if (!product) {
            toast({ title: "Produto não encontrado", variant: "destructive" });
            return;
        }

        if (!currentItem.quantity || currentItem.quantity <= 0 || currentItem.quantity > product.quantity) {
            toast({
                title: "Quantidade inválida",
                description: `Disponível: ${product.quantity}`,
                variant: "destructive",
            });
            return;
        }

        // Add item with all employees
        setSaleItems([
            ...saleItems,
            {
                product_id: currentItem.product_id,
                product_name: product.name,
                employees: currentItem.employees,
                quantity: currentItem.quantity,
                unit_price: currentItem.unit_price || product.price,
            },
        ]);

        // Reset current item
        setCurrentItem({ product_id: "", employees: [], quantity: 1 });
        setCurrentEmployeeId("");
        toast({ title: "Produto adicionado à venda" });
    };

    // Remove item from sale
    const handleRemoveItem = (index: number) => {
        setSaleItems(saleItems.filter((_, i) => i !== index));
    };

    // Generate PDF for past sales
    const handleGeneratePdfForSale = async (saleId: string) => {
        try {
            setGeneratingReceiptForSaleId(saleId);

            // Fetch sale products from sale_products_employees table
            const { data: saleProducts, error: fetchError } = await supabase
                .from("sale_products_employees")
                .select("*")
                .eq("sale_id", saleId);

            if (fetchError) throw fetchError;
            if (!saleProducts || saleProducts.length === 0) {
                toast({ title: "Nenhum produto encontrado para essa venda", variant: "destructive" });
                return;
            }

            // Get sale info
            const sale = sales.find((s) => s.id === saleId);
            if (!sale) {
                toast({ title: "Venda não encontrada", variant: "destructive" });
                return;
            }

            // Build receipt products
            const receiptProducts = saleProducts.map((sp: any) => {
                const product = products.find((p) => p.id === sp.product_id);
                const isGlass = product?.category === "Para-brisa" || product?.category === "Vigia";
                return {
                    name: product?.name || "Produto",
                    quantity: sp.quantity,
                    unitPrice: sp.unit_price,
                    subtotal: sp.subtotal,
                    isGlass: isGlass,
                };
            });

            const hasGlassProduct = receiptProducts.some((p: any) => p.isGlass);

            const blob = await generateReceipt({
                saleId: saleId,
                storeName: "IGUAÇU AUTO VIDROS SOM E ACESSÓRIOS",
                storeContact: "(21) 2697-0825",
                storeAddress: "Av Marques Rollo, 1123 - Nova Iguaçu - RJ",
                storeEmail: "iguassuautocentral@gmail.com",
                products: receiptProducts,
                totalAmount: sale.amount,
                paymentMethod: sale.payment_method || "dinheiro",
                saleDate: sale.sale_date,
                notes: sale.notes,
                isGlassWarranty: hasGlassProduct,
            });

            setReceiptBlob(blob);
            setReceiptFileName(
                `recibo_${saleId}_${new Date(sale.sale_date).toISOString().split("T")[0]}.pdf`
            );
            setReceiptModalOpen(true);
        } catch (err: any) {
            toast({
                title: "Erro ao gerar PDF",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setGeneratingReceiptForSaleId(null);
        }
    };

    // Calculate total
    const calculateTotal = () => {
        return saleItems.reduce((sum, item) => {
            const unitPrice = item.unit_price || 0;
            return sum + (unitPrice * item.quantity);
        }, 0);
    };

    // Submit sale
    const handleSubmitSale = async () => {
        if (saleItems.length === 0) {
            toast({ title: "Adicione pelo menos um produto", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const totalAmount = calculateTotal();
            const saleDateTime = new Date();

            // Insert main sale record
            const { data: saleData, error: saleError } = await supabase
                .from("sales")
                .insert({
                    description: `Venda com ${saleItems.length} produto(s)`,
                    amount: totalAmount,
                    sale_type: "pontual",
                    sale_date: saleDateTime.toISOString(),
                    notes: notes || "",
                    payment_method: paymentMethod,
                    quantity: saleItems.reduce((sum, item) => sum + item.quantity, 0),
                    unit_price: totalAmount / saleItems.reduce((sum, item) => sum + item.quantity, 0),
                    employee_id: saleItems[0].employees?.[0]?.employee_id || null, // Store first employee as primary
                    employee_name: saleItems[0].employees?.[0]?.employee_name || "",
                })
                .select();

            if (saleError) throw saleError;
            if (!saleData || saleData.length === 0) throw new Error("Falha ao criar venda");

            const saleId = saleData[0].id;

            // Insert sale items with all employee associations (múltiplos colaboradores por produto)
            const itemsToInsert: any[] = [];
            saleItems.forEach((item) => {
                // Para cada produto, criar um registro para cada colaborador
                item.employees.forEach((emp) => {
                    itemsToInsert.push({
                        sale_id: saleId,
                        product_id: item.product_id,
                        employee_id: emp.employee_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price || 0,
                        subtotal: (item.unit_price || 0) * item.quantity,
                    });
                });
            });

            const { error: itemsError } = await supabase
                .from("sale_products_employees")
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            // Update product quantities and create movement records
            for (const item of saleItems) {
                const product = products.find((p) => p.id === item.product_id);
                if (!product) continue;

                // Update product quantity
                const { error: updateError } = await supabase
                    .from("products")
                    .update({ quantity: product.quantity - item.quantity })
                    .eq("id", item.product_id);

                if (updateError) throw updateError;

                // Log product movement
                const { error: movementError } = await supabase
                    .from("product_movements")
                    .insert({
                        product_id: item.product_id,
                        movement_type: "saída",
                        quantity: item.quantity,
                        reason: "venda",
                    });

                if (movementError) throw movementError;

                // Log action
                const saleValue = (item.unit_price || 0) * item.quantity;
                await logAction(
                    "register",
                    "vendas",
                    product.id,
                    product.name,
                    `Venda de ${item.quantity} un. - Preço: R$ ${(item.unit_price || 0).toFixed(2)} - Total: R$ ${saleValue.toFixed(2)}`
                );
            }

            toast({
                title: "Venda registrada com sucesso!",
                description: `${saleItems.length} produto(s) - R$ ${totalAmount.toFixed(2)}`,
            });

            // Gerar cupom automaticamente
            if (saleData && saleData.length > 0) {
                const sale = saleData[0];
                try {
                    // Montar lista de produtos para o cupom
                    const receiptProducts = saleItems.map((item) => {
                        const product = products.find((p) => p.id === item.product_id);
                        const isGlass =
                            product?.category === "Para-brisa" || product?.category === "Vigia";
                        return {
                            name: product?.name || "Produto",
                            quantity: item.quantity,
                            unitPrice: product?.price || 0,
                            subtotal: (product?.price || 0) * item.quantity,
                            isGlass: isGlass,
                        };
                    });

                    // Verificar se algum produto é vidro
                    const hasGlassProduct = receiptProducts.some((p) => p.isGlass);

                    const blob = await generateReceipt({
                        saleId: sale.id,
                        storeName: "IGUAÇU AUTO VIDROS SOM E ACESSÓRIOS",
                        storeContact: "(21) 2697-0825",
                        storeAddress: "Av Marques Rollo, 1123 - Nova Iguaçu - RJ",
                        storeEmail: "iguassuautocentral@gmail.com",
                        products: receiptProducts,
                        totalAmount: totalAmount,
                        paymentMethod: paymentMethod,
                        saleDate: sale.sale_date,
                        notes: notes,
                        isGlassWarranty: hasGlassProduct,
                    });
                    setReceiptBlob(blob);
                    setReceiptFileName(
                        `recibo_${sale.id}_${new Date().toISOString().split("T")[0]}.pdf`
                    );
                    setReceiptModalOpen(true);
                } catch (err) {
                    console.error("Erro ao gerar cupom:", err);
                    toast({
                        title: "Erro ao gerar cupom",
                        description: String(err),
                        variant: "destructive",
                    });
                }
            }

            // Reset form
            setSaleItems([]);
            setCurrentItem({ product_id: "", employee_id: "", quantity: 1 });
            setNotes("");
            setPaymentMethod("dinheiro");
            setDialogOpen(false);

            fetchProducts();
            fetchSales();
        } catch (err: any) {
            toast({
                title: "Erro ao registrar venda",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary animate-pulse">
                    <ShoppingCart className="w-6 h-6 text-primary-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                icon={ShoppingCart}
                title="Vendas"
                description="Registre vendas de produtos com múltiplos vendedores"
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-4 md:p-6 rounded-lg border border-success/20"
                    >
                        <div className="flex items-start gap-3 md:gap-4">
                            <div className="flex-1">
                                <p className="text-xs md:text-sm text-muted-foreground mb-1">Total em Vendas</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-lg md:text-3xl font-bold text-success">
                                        {showValues ? `R$ ${totalSales.toFixed(2)}` : "••••••"}
                                    </p>
                                    <button
                                        onClick={() => setShowValues(!showValues)}
                                        className="p-1 hover:bg-success/20 rounded transition-colors flex-shrink-0"
                                        title={showValues ? "Esconder valores" : "Mostrar valores"}
                                    >
                                        {showValues ? (
                                            <Eye className="w-4 h-4 md:w-5 md:h-5 text-success" />
                                        ) : (
                                            <EyeOff className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{sales.length} transações</p>
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-success" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-4 md:p-6 rounded-lg border border-primary/20"
                    >
                        <div className="flex items-start gap-3 md:gap-4">
                            <div className="flex-1">
                                <p className="text-xs md:text-sm text-muted-foreground mb-1">Produtos</p>
                                <p className="text-lg md:text-3xl font-bold text-primary">{products.length}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {products.reduce((sum, p) => sum + p.quantity, 0)} unidades
                                </p>
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* New Sale Button */}
                <div className="mb-6 md:mb-8">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 w-full md:w-auto">
                                <Plus className="w-4 h-4" />
                                <span className="hidden md:inline">Registrar Venda</span>
                                <span className="md:hidden">Nova Venda</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Registrar Nova Venda</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Add Items Section */}
                                <div className="border rounded-lg p-4 bg-muted/30">
                                    <h3 className="font-semibold mb-4">Adicionar Produto à Venda</h3>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="product">Produto *</Label>
                                                <Select
                                                    value={currentItem.product_id || ""}
                                                    onValueChange={(value) => setCurrentItem({ ...currentItem, product_id: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione um produto" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map((product) => (
                                                            <SelectItem key={product.id} value={product.id}>
                                                                {product.name} (Est: {product.quantity})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label htmlFor="quantity">Quantidade *</Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    min="1"
                                                    value={currentItem.quantity || 1}
                                                    onChange={(e) =>
                                                        setCurrentItem({ ...currentItem, quantity: Number(e.target.value) || 1 })
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {currentItem.product_id && (
                                            <div className="space-y-3">
                                                <div>
                                                    <Label>Preço Unitário (R$) *</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={currentItem.unit_price || products.find((p) => p.id === currentItem.product_id)?.price || 0}
                                                        onChange={(e) =>
                                                            setCurrentItem({ ...currentItem, unit_price: parseFloat(e.target.value) || 0 })
                                                        }
                                                    />
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        Preço cadastrado: R${" "}
                                                        {products.find((p) => p.id === currentItem.product_id)?.price.toFixed(2)}
                                                    </p>
                                                    <p className="text-sm font-semibold text-success">
                                                        Subtotal: R${" "}
                                                        {(
                                                            currentItem.quantity *
                                                            (currentItem.unit_price || products.find((p) => p.id === currentItem.product_id)?.price || 0)
                                                        ).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Colaboradores do Produto */}
                                        <div>
                                            <Label>Colaboradores do Produto</Label>
                                            <div className="space-y-2">
                                                {currentItem.employees && currentItem.employees.length > 0 && (
                                                    <div className="space-y-2">
                                                        {currentItem.employees.map((emp, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
                                                            >
                                                                <span className="text-sm font-medium">{emp.employee_name}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        const updated = currentItem.employees.filter((_, i) => i !== idx);
                                                                        setCurrentItem({ ...currentItem, employees: updated });
                                                                    }}
                                                                    className="text-destructive hover:bg-destructive/20 rounded p-1"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Select value={currentEmployeeId} onValueChange={setCurrentEmployeeId}>
                                                        <SelectTrigger className="flex-1">
                                                            <SelectValue placeholder="Selecione colaborador" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {employees.map((employee) => (
                                                                <SelectItem key={employee.id} value={employee.id}>
                                                                    {employee.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button onClick={handleAddEmployeeToItem} size="sm" className="gap-1">
                                                        <Plus className="w-4 h-4" />
                                                        Adicionar
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button onClick={handleAddItem} variant="outline" className="w-full mt-4 gap-2">
                                        <Plus className="w-4 h-4" />
                                        Adicionar Produto à Venda
                                    </Button>
                                </div>

                                {/* Items List */}
                                {saleItems.length > 0 && (
                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold mb-4">Itens da Venda ({saleItems.length})</h3>
                                        <div className="space-y-3">
                                            {saleItems.map((item, index) => {
                                                const product = products.find((p) => p.id === item.product_id);
                                                const subtotal = (item.unit_price || 0) * item.quantity;

                                                return (
                                                    <div
                                                        key={index}
                                                        className="p-3 bg-muted/50 rounded-lg border"
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm">{product?.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {item.quantity}x R$ {(item.unit_price || 0).toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-semibold text-sm">R$ {subtotal.toFixed(2)}</p>
                                                                <button
                                                                    onClick={() => handleRemoveItem(index)}
                                                                    className="text-destructive hover:bg-destructive/20 rounded p-1 mt-1"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {item.employees && item.employees.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {item.employees.map((emp, empIdx) => (
                                                                    <span
                                                                        key={empIdx}
                                                                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                                                    >
                                                                        {emp.employee_name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Total */}
                                        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                            <p className="text-lg font-bold text-primary">
                                                Total: R$ {calculateTotal().toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Sale Details */}
                                <div className="space-y-4 border-t pt-4">
                                    <div>
                                        <Label htmlFor="payment">Método de Pagamento *</Label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o método" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                                <SelectItem value="pix">PIX</SelectItem>
                                                <SelectItem value="cartao">Cartão</SelectItem>
                                                <SelectItem value="revenda">Revenda</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="notes">Observações</Label>
                                        <Input
                                            id="notes"
                                            placeholder="Informações adicionais"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSubmitSale}
                                        disabled={submitting || saleItems.length === 0}
                                        className="w-full"
                                    >
                                        {submitting ? "Processando..." : "Confirmar Venda"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Sales History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card rounded-lg p-6"
                >
                    <h2 className="text-2xl font-bold mb-6">Histórico de Vendas</h2>
                    {sales.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Nenhuma venda registrada ainda</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-semibold">Data</th>
                                        <th className="text-left py-3 px-4 font-semibold">Descrição</th>
                                        <th className="text-right py-3 px-4 font-semibold">Valor</th>
                                        <th className="text-left py-3 px-4 font-semibold">Pagamento</th>
                                        <th className="text-center py-3 px-4 font-semibold">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map((sale) => (
                                        <tr key={sale.id} className="border-b hover:bg-muted/50 transition-colors">
                                            <td className="py-3 px-4">
                                                {new Date(sale.sale_date).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="py-3 px-4">{sale.description}</td>
                                            <td className="text-right py-3 px-4 font-semibold">
                                                R$ {sale.amount.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 capitalize">{sale.payment_method || "-"}</td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => handleGeneratePdfForSale(sale.id)}
                                                    disabled={generatingReceiptForSaleId === sale.id}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors disabled:opacity-50"
                                                    title="Gerar e baixar PDF"
                                                >
                                                    {generatingReceiptForSaleId === sale.id ? (
                                                        <Loader className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <FileText className="w-4 h-4" />
                                                    )}
                                                    <span className="text-xs font-medium">PDF</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Receipt Modal */}
            <ReceiptModal
                isOpen={receiptModalOpen}
                onClose={() => setReceiptModalOpen(false)}
                pdfBlob={receiptBlob}
                fileName={receiptFileName}
            />
        </div>
    );
};

export default SalesNew;
