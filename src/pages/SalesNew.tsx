import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, TrendingUp, AlertCircle, Eye, EyeOff, Download, X, Trash2, FileText, Loader, Search } from "lucide-react";
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
    commission_percentage?: number;
}

interface SaleItemEmployee {
    employee_id: string;
    employee_name: string;
    commission_type: string;
    commission_value: number;
}

interface SaleItem {
     product_id: string;
     employees: SaleItemEmployee[];
     quantity: number;
     unit_price?: number;
     product_name?: string;
     commission_type?: string;
     commission_value?: number;
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

interface Store {
    id: string;
    name: string;
    code: string;
}

const SalesNew = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [storeName, setStoreName] = useState("IGUAÇU AUTO VIDROS SOM E ACESSÓRIOS");
    const [selectedStoreId, setSelectedStoreId] = useState<string>("");
    const { toast } = useToast();

    // Form state
     const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
     const [currentItem, setCurrentItem] = useState<Partial<SaleItem> & { employees: SaleItemEmployee[] }>({
         product_id: "",
         employees: [],
         quantity: 0,
         commission_type: "percentual",
         commission_value: 1,
     });
    const [currentEmployeeId, setCurrentEmployeeId] = useState("");
    const [currentEmpCommissionType, setCurrentEmpCommissionType] = useState("percentual");
    const [currentEmpCommissionValue, setCurrentEmpCommissionValue] = useState(1);
    const [notes, setNotes] = useState("");
    const [paymentMethods, setPaymentMethods] = useState<Array<{ method: string; amount: number }>>([
        { method: "dinheiro", amount: 0 }
    ]);
    const [productSearch, setProductSearch] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const productSearchRef = useRef<HTMLDivElement>(null);

    const [totalSales, setTotalSales] = useState(0);
    const [showValues, setShowValues] = useState(true);
    const [generatingReceipt, setGeneratingReceipt] = useState<string | null>(null);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
    const [receiptFileName, setReceiptFileName] = useState("");
    const [generatingReceiptForSaleId, setGeneratingReceiptForSaleId] = useState<string | null>(null);

    // Fetch store name from user profile
    const fetchStoreNameFromUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("profiles")
                .select("store_name")
                .eq("user_id", user.id)
                .single();

            if (error) throw error;
            if (data?.store_name) {
                setStoreName(data.store_name);
            }
        } catch (err: any) {
            console.error("Erro ao buscar store_name:", err);
        }
    };

    // Fetch stores
    const fetchStores = async () => {
        try {
            const { data, error } = await supabase
                .from("stores")
                .select("*")
                .eq("is_active", true)
                .order("name");

            if (error) throw error;
            setStores(data || []);
            
            // Set first store as default
            if (data && data.length > 0) {
                setSelectedStoreId(data[0].id);
            }
        } catch (err: any) {
            console.error("Erro ao carregar lojas:", err);
            toast({
                title: "Erro ao carregar lojas",
                description: err.message,
                variant: "destructive",
            });
        }
    };

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
                .select("id, name, commission_percentage")
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
        fetchStoreNameFromUser();
        fetchStores();
        fetchProducts();
        fetchEmployees();
        fetchSales();
    }, []);

    // Fechar dropdown quando clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (productSearchRef.current && !productSearchRef.current.contains(event.target as Node)) {
                setShowProductDropdown(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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

         // Puxar comissão do cadastro do funcionário
         const commissionPercentage = employee.commission_percentage || 1;

         const newEmployees = [...(currentItem.employees || []), { 
             employee_id: currentEmployeeId, 
             employee_name: employee.name,
             commission_type: "percentual",
             commission_value: commissionPercentage,
         }];

         console.log("Adicionando colaborador. newEmployees:", newEmployees);
         setCurrentItem({
             ...currentItem,
             employees: newEmployees,
         });

         setCurrentEmployeeId("");
         setCurrentEmpCommissionType("percentual");
         setCurrentEmpCommissionValue(1);
         toast({ title: "Colaborador adicionado", description: `${employee.name} - Comissão: ${commissionPercentage}% (do cadastro)` });
     };

    // Add item to sale
    const handleAddItem = () => {
        console.log("handleAddItem called. currentItem:", currentItem);
        
        if (!currentItem.product_id) {
            toast({ title: "Selecione um produto", variant: "destructive" });
            return;
        }

        if (!currentItem.employees || currentItem.employees.length === 0) {
            console.log("Sem colaboradores! employees:", currentItem.employees);
            toast({ title: "Adicione pelo menos um colaborador ao produto", variant: "destructive" });
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

        if (currentItem.unit_price === undefined || currentItem.unit_price === null || currentItem.unit_price === "") {
            toast({
                title: "Preço unitário obrigatório",
                description: "Preencha o preço unitário antes de adicionar o produto",
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
                 commission_type: currentItem.commission_type || "percentual",
                 commission_value: currentItem.commission_value || 1,
             },
         ]);

         // Reset current item
         setCurrentItem({ product_id: "", employees: [], quantity: 0, commission_type: "percentual", commission_value: 1 });
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
                storeName: storeName,
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

    // Calculate payment methods total
    const calculatePaymentMethodsTotal = () => {
        return paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
    };

    // Submit sale
    const handleSubmitSale = async () => {
        if (saleItems.length === 0) {
            toast({ title: "Adicione pelo menos um produto", variant: "destructive" });
            return;
        }

        if (!selectedStoreId) {
            toast({ title: "Selecione uma loja antes de confirmar a venda", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const totalAmount = calculateTotal();
            const saleDateTime = new Date();

            // Insert main sale record
             const paymentMethodsStr = paymentMethods
                 .map((pm) => `${pm.method}:${pm.amount.toFixed(2)}`)
                 .join("|");

             const { data: saleData, error: saleError } = await supabase
                 .from("sales")
                 .insert({
                     description: `Venda com ${saleItems.length} produto(s)`,
                     amount: totalAmount,
                     sale_type: "pontual",
                     sale_date: saleDateTime.toISOString(),
                     notes: notes || "",
                     payment_method: paymentMethodsStr,
                     quantity: saleItems.reduce((sum, item) => sum + item.quantity, 0),
                     unit_price: totalAmount / saleItems.reduce((sum, item) => sum + item.quantity, 0),
                     employee_id: saleItems[0].employees?.[0]?.employee_id || null, // Store first employee as primary
                     employee_name: saleItems[0].employees?.[0]?.employee_name || "",
                     store_id: selectedStoreId,
                 })
                 .select();

            if (saleError) throw saleError;
            if (!saleData || saleData.length === 0) throw new Error("Falha ao criar venda");

            const saleId = saleData[0].id;

            // Insert sale items with all employee associations (múltiplos colaboradores por produto)
            // Calcula comissão total somando todas as comissões individuais dos colaboradores
            let totalCalculatedCommission = 0;
            const itemsToInsert: any[] = [];
            
            saleItems.forEach((item) => {
                // Para cada produto, criar um registro para cada colaborador
                item.employees.forEach((emp) => {
                    const subtotal = (item.unit_price || 0) * item.quantity;
                    const empCommission = emp.commission_type === "percentual" 
                      ? (subtotal * emp.commission_value) / 100
                      : emp.commission_value;
                    
                    totalCalculatedCommission += empCommission;
                    
                    itemsToInsert.push({
                        sale_id: saleId,
                        product_id: item.product_id,
                        employee_id: emp.employee_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price || 0,
                        subtotal: subtotal,
                    });
                });
            });
            
            // Atualizar sale com comissão total
            const { error: updateSaleError } = await supabase
                .from("sales")
                .update({
                    commission_type: "fixo",
                    commission_value: totalCalculatedCommission,
                    calculated_commission: totalCalculatedCommission,
                })
                .eq("id", saleId);
            
            if (updateSaleError) throw updateSaleError;

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

                    const paymentMethodDisplay = paymentMethods
                         .map((pm) => `${pm.method}: R$${pm.amount.toFixed(2)}`)
                         .join(" | ");

                     const blob = await generateReceipt({
                         saleId: sale.id,
                         storeName: storeName,
                         storeContact: "(21) 2697-0825",
                         storeAddress: "Av Marques Rollo, 1123 - Nova Iguaçu - RJ",
                         storeEmail: "iguassuautocentral@gmail.com",
                         products: receiptProducts,
                         totalAmount: totalAmount,
                         paymentMethod: paymentMethodDisplay,
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
              setCurrentItem({ product_id: "", employees: [], quantity: 0 });
             setNotes("");
             setPaymentMethods([{ method: "dinheiro", amount: 0 }]);
             setProductSearch("");
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
                {/* New Sale Button */}
                <div className="mb-6 md:mb-8">
                    <Dialog open={dialogOpen} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setProductSearch("");
                    }}>
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
                                {/* Seletor de Loja */}
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                    <Label htmlFor="store" className="font-semibold mb-2 block">🏪 Selecione a Loja *</Label>
                                    <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                                        <SelectTrigger id="store">
                                            <SelectValue placeholder="Escolha uma loja" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stores.map((store) => (
                                                <SelectItem key={store.id} value={store.id}>
                                                    {store.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedStoreId && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            ✓ Loja selecionada: {stores.find(s => s.id === selectedStoreId)?.name}
                                        </p>
                                    )}
                                </div>
                                {/* Add Items Section */}
                                <div className="border rounded-lg p-4 bg-muted/30">
                                    <h3 className="font-semibold mb-4">Adicionar Produto à Venda</h3>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div>
                                                 <Label htmlFor="product">Produto *</Label>
                                                 <div ref={productSearchRef} className="relative">
                                                     <div className="relative">
                                                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                         <Input
                                                             id="product-search"
                                                             type="text"
                                                             placeholder="Digite o nome do produto..."
                                                             value={productSearch}
                                                             onChange={(e) => {
                                                                 setProductSearch(e.target.value);
                                                                 setShowProductDropdown(true);
                                                             }}
                                                             onFocus={() => setShowProductDropdown(true)}
                                                             className="pl-10 pr-10"
                                                         />
                                                         {productSearch && (
                                                             <button
                                                                 type="button"
                                                                 onClick={() => {
                                                                     setProductSearch("");
                                                                     setShowProductDropdown(false);
                                                                 }}
                                                                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                             >
                                                                 <X className="w-4 h-4" />
                                                             </button>
                                                         )}
                                                     </div>
                                                     
                                                     {showProductDropdown && (
                                                         <motion.div
                                                             initial={{ opacity: 0, y: -10 }}
                                                             animate={{ opacity: 1, y: 0 }}
                                                             exit={{ opacity: 0, y: -10 }}
                                                             className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                                                         >
                                                             {products
                                                                 .filter((product) =>
                                                                     product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                                                     product.category.toLowerCase().includes(productSearch.toLowerCase())
                                                                 )
                                                                 .length === 0 ? (
                                                                 <div className="p-4 text-center text-muted-foreground text-sm">
                                                                     Nenhum produto encontrado
                                                                 </div>
                                                             ) : (
                                                                 products
                                                                     .filter((product) =>
                                                                         product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                                                         product.category.toLowerCase().includes(productSearch.toLowerCase())
                                                                     )
                                                                     .map((product) => (
                                                                         <button
                                                                             key={product.id}
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 setCurrentItem({ ...currentItem, product_id: product.id });
                                                                                 setProductSearch(product.name);
                                                                                 setShowProductDropdown(false);
                                                                             }}
                                                                             className="w-full text-left px-4 py-2 hover:bg-muted/50 border-b border-border/50 last:border-0 transition-colors flex justify-between items-center"
                                                                         >
                                                                             <div>
                                                                                 <div className="font-medium text-foreground text-sm">{product.name}</div>
                                                                                 <div className="text-xs text-muted-foreground">{product.category}</div>
                                                                             </div>
                                                                             <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                                                 Est: {product.quantity}
                                                                             </div>
                                                                         </button>
                                                                     ))
                                                             )}
                                                         </motion.div>
                                                     )}
                                                 </div>
                                             </div>

                                            <div>
                                                 <Label htmlFor="quantity">Quantidade *</Label>
                                                 <Input
                                                     id="quantity"
                                                     type="number"
                                                     placeholder="Digite a quantidade"
                                                     value={currentItem.quantity === undefined || currentItem.quantity === 0 ? "" : currentItem.quantity}
                                                     onChange={(e) => {
                                                         const val = e.target.value;
                                                         setCurrentItem({ ...currentItem, quantity: val === "" ? undefined : Number(val) });
                                                     }}
                                                 />
                                                 {!currentItem.quantity && (
                                                     <p className="text-xs text-orange-600 mt-1">⚠️ Preencha a quantidade antes de adicionar o produto</p>
                                                 )}
                                             </div>
                                        </div>

                                        {currentItem.product_id && (
                                            <div className="space-y-3">
                                                <div>
                                                    <Label>Preço Unitário (R$) *</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder={String(products.find((p) => p.id === currentItem.product_id)?.price || 0)}
                                                        value={currentItem.unit_price !== undefined && currentItem.unit_price !== null ? currentItem.unit_price : ""}
                                                        onChange={(e) =>
                                                            setCurrentItem({ ...currentItem, unit_price: e.target.value ? parseFloat(e.target.value) : undefined })
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
                                                        {currentItem.employees.map((emp, idx) => {
                                                             const subtotal = currentItem.quantity * (currentItem.unit_price || 0);
                                                             const empComm = emp.commission_type === "percentual"
                                                               ? (subtotal * emp.commission_value) / 100
                                                               : emp.commission_value;
                                                             return (
                                                                 <div
                                                                     key={idx}
                                                                     className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
                                                                 >
                                                                     <div>
                                                                         <span className="text-sm font-medium text-foreground">{emp.employee_name}</span>
                                                                         <p className="text-xs font-semibold text-green-900">
                                                                             Comissão: R$ {empComm.toFixed(2)}
                                                                         </p>
                                                                     </div>
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
                                                             );
                                                         })}
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <div>
                                                        <Label>Colaborador *</Label>
                                                        <Select value={currentEmployeeId} onValueChange={setCurrentEmployeeId}>
                                                            <SelectTrigger>
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
                                                    </div>

                                                    {currentEmployeeId && (
                                                         <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                                             <p className="text-xs text-blue-900">
                                                                 <span className="font-semibold">Comissão automática:</span> Será usada a comissão cadastrada do colaborador
                                                             </p>
                                                             <p className="text-xs text-blue-800 mt-1">
                                                                 Comissão: {employees.find(e => e.id === currentEmployeeId)?.commission_percentage || 1}%
                                                             </p>
                                                         </div>
                                                     )}

                                                    <Button onClick={handleAddEmployeeToItem} className="w-full gap-1">
                                                        <Plus className="w-4 h-4" />
                                                        Adicionar Colaborador
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

</div>

                                    <Button 
                                        onClick={handleAddItem}
                                        disabled={!currentItem.product_id || !currentItem.employees || currentItem.employees.length === 0 || !currentItem.quantity || !currentItem.unit_price}
                                        className="w-full mt-6 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg py-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
                                    >
                                         <Plus className="w-6 h-6" />
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
                                        <div className="flex items-center justify-between mb-3">
                                            <Label>Métodos de Pagamento *</Label>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setPaymentMethods([
                                                    ...paymentMethods,
                                                    { method: "dinheiro", amount: 0 }
                                                ])}
                                                className="h-8"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Adicionar método
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {paymentMethods.map((pm, idx) => (
                                                <div key={idx} className="flex gap-2 items-end">
                                                    <Select 
                                                        value={pm.method}
                                                        onValueChange={(value) => {
                                                            const updated = [...paymentMethods];
                                                            updated[idx].method = value;
                                                            setPaymentMethods(updated);
                                                        }}
                                                    >
                                                        <SelectTrigger className="flex-1 max-w-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                                                            <SelectItem value="pix">📱 PIX</SelectItem>
                                                            <SelectItem value="cartao">💳 Cartão</SelectItem>
                                                            <SelectItem value="revenda">🔄 Revenda</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <div className="flex-1">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="R$ 0.00"
                                                            value={pm.amount || ""}
                                                            onChange={(e) => {
                                                                const updated = [...paymentMethods];
                                                                updated[idx].amount = parseFloat(e.target.value) || 0;
                                                                setPaymentMethods(updated);
                                                            }}
                                                            max={calculateTotal()}
                                                        />
                                                    </div>
                                                    {paymentMethods.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setPaymentMethods(paymentMethods.filter((_, i) => i !== idx))}
                                                            className="text-destructive hover:bg-destructive/10"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Payment methods validation */}
                                         <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                                             <div className="flex justify-between text-sm mb-1">
                                                 <span className="text-muted-foreground">Total da venda:</span>
                                                 <span className="font-semibold">R$ {calculateTotal().toFixed(2)}</span>
                                             </div>
                                             <div className="flex justify-between text-sm mb-1">
                                                 <span className="text-muted-foreground">Total pagamento:</span>
                                                 <span className={`font-semibold ${
                                                     Math.abs(calculatePaymentMethodsTotal() - calculateTotal()) < 0.01
                                                         ? "text-success"
                                                         : "text-destructive"
                                                 }`}>
                                                     R$ {calculatePaymentMethodsTotal().toFixed(2)}
                                                 </span>
                                             </div>
                                             <div className="flex justify-between text-sm">
                                                 <span className="text-muted-foreground">Falta pagar:</span>
                                                 <span className={`font-semibold ${
                                                     calculateTotal() - calculatePaymentMethodsTotal() > 0.01
                                                         ? "text-orange-600"
                                                         : "text-success"
                                                 }`}>
                                                     R$ {Math.max(0, calculateTotal() - calculatePaymentMethodsTotal()).toFixed(2)}
                                                 </span>
                                             </div>
                                             {Math.abs(calculatePaymentMethodsTotal() - calculateTotal()) > 0.01 && (
                                                 <p className="text-xs text-destructive mt-2">
                                                     ⚠️ Total de pagamento não corresponde ao total da venda
                                                 </p>
                                             )}
                                         </div>

                                         {/* Comissões Resumo */}
                                         {saleItems.length > 0 && (
                                             <div className="mt-3 p-3 rounded-lg bg-blue-50/50 border border-blue-200">
                                                 <p className="text-xs font-semibold text-blue-900 mb-2">💰 COMISSÕES DEFINIDAS</p>
                                                 {saleItems.map((item, itemIdx) => {
                                                     const product = products.find((p) => p.id === item.product_id);
                                                     return item.employees.map((emp, empIdx) => {
                                                         const subtotal = item.quantity * (item.unit_price || 0);
                                                         const empComm = emp.commission_type === "percentual"
                                                           ? (subtotal * emp.commission_value) / 100
                                                           : emp.commission_value;
                                                         return (
                                                             <div key={`${itemIdx}-${empIdx}`} className="flex justify-between text-xs mb-1">
                                                                 <span className="text-blue-900">{emp.employee_name}</span>
                                                                 <span className="font-semibold text-blue-900">R$ {empComm.toFixed(2)}</span>
                                                             </div>
                                                         );
                                                     });
                                                 })}
                                                 {saleItems.some(item => item.employees.length > 0) && (
                                                     <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between text-xs font-bold">
                                                         <span className="text-blue-900">Total Comissões:</span>
                                                         <span className="text-blue-900">
                                                             R$ {saleItems.reduce((total, item) => {
                                                                 const itemTotal = item.employees.reduce((sum, emp) => {
                                                                     const subtotal = item.quantity * (item.unit_price || 0);
                                                                     const empComm = emp.commission_type === "percentual"
                                                                       ? (subtotal * emp.commission_value) / 100
                                                                       : emp.commission_value;
                                                                     return sum + empComm;
                                                                 }, 0);
                                                                 return total + itemTotal;
                                                             }, 0).toFixed(2)}
                                                         </span>
                                                     </div>
                                                 )}
                                             </div>
                                         )}
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
                                        disabled={
                                            submitting || 
                                            saleItems.length === 0 ||
                                            Math.abs(calculatePaymentMethodsTotal() - calculateTotal()) > 0.01
                                        }
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
