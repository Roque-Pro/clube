import { useState, useEffect } from "react";
import { ShoppingCart, Plus, AlertCircle, Eye, EyeOff, Download } from "lucide-react";
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

interface Sale {
  id: string;
  description: string;
  amount: number;
  sale_type: string;
  sale_date: string;
  notes?: string;
  payment_method?: string;
  quantity?: number;
  unit_price?: number;
  employee_id?: string;
  employee_name?: string;
}

const Sales = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const [saleForm, setSaleForm] = useState({
    product_id: "",
    quantity: "",
    notes: "",
    payment_method: "dinheiro",
    employee_id: "",
  });
  const [totalSales, setTotalSales] = useState(0);
  const [showValues, setShowValues] = useState(true);
  const [generatingReceipt, setGeneratingReceipt] = useState<string | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
  const [receiptFileName, setReceiptFileName] = useState("");
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false);
  const [selectedAdditionalEmployee, setSelectedAdditionalEmployee] = useState("");

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

  const handleAddSale = async () => {
    if (!saleForm.product_id || !saleForm.quantity || !saleForm.employee_id) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const selectedProduct = products.find((p) => p.id === saleForm.product_id);
    if (!selectedProduct) {
      toast({ title: "Produto não encontrado", variant: "destructive" });
      return;
    }

    const selectedEmployee = employees.find((e) => e.id === saleForm.employee_id);
    if (!selectedEmployee) {
      toast({ title: "Funcionário não encontrado", variant: "destructive" });
      return;
    }

    const quantity = Number(saleForm.quantity);
    if (quantity <= 0) {
      toast({ title: "Quantidade deve ser maior que zero", variant: "destructive" });
      return;
    }

    if (quantity > selectedProduct.quantity) {
      toast({
        title: "Quantidade insuficiente em estoque",
        description: `Disponível: ${selectedProduct.quantity}`,
        variant: "destructive",
      });
      return;
    }

    const saleAmount = quantity * selectedProduct.price;

    setSubmitting(true);
    try {
      // Insert sale
      // Usar a data/hora atual do navegador (já está em ISO string corretamente)
      const saleDateTime = new Date();
      const { data: saleData, error: saleError } = await supabase.from("sales").insert({
        description: selectedProduct.name,
        amount: saleAmount,
        sale_type: "pontual",
        sale_date: saleDateTime.toISOString(),
        notes: saleForm.notes || "",
        payment_method: saleForm.payment_method,
        quantity: quantity,
        unit_price: selectedProduct.price,
        employee_id: saleForm.employee_id,
        employee_name: selectedEmployee.name,
      }).select();

      if (saleError) throw saleError;

      // Insert into sale_products_employees to track vendedor per product
      if (saleData && saleData.length > 0) {
        const saleId = saleData[0].id;
        const { error: saleProductError } = await supabase
          .from("sale_products_employees")
          .insert({
            sale_id: saleId,
            product_id: saleForm.product_id,
            employee_id: saleForm.employee_id,
            quantity: quantity,
            unit_price: selectedProduct.price,
            subtotal: saleAmount,
          });

        if (saleProductError) {
          console.warn("Aviso: não foi possível registrar na tabela sale_products_employees:", saleProductError);
          // Não lanço erro aqui pq a venda já foi criada
        }
      }

      // Update product quantity
      const { error: updateError } = await supabase
        .from("products")
        .update({ quantity: selectedProduct.quantity - quantity })
        .eq("id", saleForm.product_id);

      if (updateError) throw updateError;

      // Log product movement
      const { error: movementError } = await supabase.from("product_movements").insert({
        product_id: saleForm.product_id,
        movement_type: "saída",
        quantity: quantity,
        reason: "venda",
      });

      if (movementError) throw movementError;

      // Log da ação
      await logAction(
        "register",
        "vendas",
        selectedProduct.id,
        selectedProduct.name,
        `Venda de ${quantity} un. - R$ ${saleAmount.toFixed(2)}`
      );

      toast({
        title: "Venda registrada com sucesso!",
        description: `${selectedProduct.name} - R$ ${saleAmount.toFixed(2)}`,
      });

      // Gerar cupom automaticamente
      if (saleData && saleData.length > 0) {
        const sale = saleData[0];
        try {
          // Verifica se é vidro (parabrisa ou vigia)
          const isGlass = selectedProduct.category === "Para-brisa" || selectedProduct.category === "Vigia";
          
          const blob = await generateReceipt({
            saleId: sale.id,
            storeName: "IGUAÇU AUTO VIDROS SOM E ACESSÓRIOS",
            storeContact: "(21) 2697-0825",
            storeAddress: "Av Marques Rollo, 1123 - Nova Iguaçu - RJ",
            storeEmail: "iguassuautocentral@gmail.com",
            productName: selectedProduct.name,
            quantity: quantity,
            unitPrice: selectedProduct.price,
            totalAmount: saleAmount,
            paymentMethod: saleForm.payment_method,
            saleDate: sale.sale_date,
            notes: saleForm.notes,
            isGlassWarranty: isGlass,
          });
          setReceiptBlob(blob);
          setReceiptFileName(`recibo_${sale.id}_${new Date().toISOString().split("T")[0]}.pdf`);
          setReceiptModalOpen(true);
          
          // Guardar dados da venda para permitir adicionar outro colaborador
          setLastSaleData({
            saleId: sale.id,
            productId: saleForm.product_id,
            quantity: quantity,
            unitPrice: selectedProduct.price,
            saleAmount: saleAmount,
          });
        } catch (err) {
          console.warn("Erro ao gerar cupom:", err);
        }
      }

      setSaleForm({ product_id: "", quantity: "", notes: "", payment_method: "dinheiro", employee_id: "" });
      setDialogOpen(false);
      
      // Abrir dialog para adicionar outro colaborador após um pequeno delay
      setTimeout(() => {
        setAddEmployeeDialogOpen(true);
      }, 500);
      
      fetchProducts();
      fetchEmployees();
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

  const handleAddAdditionalEmployee = async () => {
    if (!selectedAdditionalEmployee || !lastSaleData) {
      toast({ title: "Selecione um colaborador", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("sale_products_employees")
        .insert({
          sale_id: lastSaleData.saleId,
          product_id: lastSaleData.productId,
          employee_id: selectedAdditionalEmployee,
          quantity: lastSaleData.quantity,
          unit_price: lastSaleData.unitPrice,
          subtotal: lastSaleData.saleAmount,
        });

      if (error) throw error;

      toast({
        title: "Colaborador adicionado!",
        description: "Este produto agora está associado a múltiplos vendedores.",
      });

      setAddEmployeeDialogOpen(false);
      setSelectedAdditionalEmployee("");
      setLastSaleData(null);
      fetchSales();
    } catch (err: any) {
      toast({
        title: "Erro ao adicionar colaborador",
        description: err.message,
        variant: "destructive",
      });
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
        description="Registre vendas de produtos e controle seu lucro"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nova Venda</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                 <div>
                   <Label htmlFor="employee">Vendedor/Funcionário *</Label>
                   <Select value={saleForm.employee_id} onValueChange={(value) => setSaleForm({ ...saleForm, employee_id: value })}>
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione um funcionário" />
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

                 <div>
                   <Label htmlFor="product">Produto *</Label>
                   <Select value={saleForm.product_id} onValueChange={(value) => setSaleForm({ ...saleForm, product_id: value })}>
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione um produto" />
                     </SelectTrigger>
                     <SelectContent>
                       {products.map((product) => (
                         <SelectItem key={product.id} value={product.id}>
                           {product.name} (Estoque: {product.quantity})
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>

                {saleForm.product_id && (
                  <div className="p-4 bg-muted rounded-lg">
                    {(() => {
                      const product = products.find((p) => p.id === saleForm.product_id);
                      return (
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Preço unitário:</strong> R$ {product?.price.toFixed(2)}
                          </p>
                          <p>
                            <strong>Estoque:</strong> {product?.quantity} unidades
                          </p>
                          {saleForm.quantity && (
                            <p className="text-success font-semibold">
                              <strong>Total:</strong> R$ {(Number(saleForm.quantity) * (product?.price || 0)).toFixed(2)}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                  />
                </div>

                <div>
                   <Label htmlFor="payment">Método de Pagamento *</Label>
                   <Select value={saleForm.payment_method} onValueChange={(value) => setSaleForm({ ...saleForm, payment_method: value })}>
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione o método" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="dinheiro">Dinheiro</SelectItem>
                       <SelectItem value="pix">PIX</SelectItem>
                       <SelectItem value="cartao">Cartão</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                <div>
                   <Label htmlFor="notes">Observações</Label>
                   <Input
                     id="notes"
                     placeholder="Informações adicionais"
                     value={saleForm.notes}
                     onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                   />
                 </div>

                <Button onClick={handleAddSale} disabled={submitting} className="w-full">
                   {submitting ? "Registrando..." : "Confirmar Venda"}
                 </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sales History */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass-card rounded-lg border border-border"
         >
           <div className="p-6 border-b border-border flex items-center justify-between">
             <h3 className="text-lg font-semibold text-foreground">Histórico de Vendas</h3>
             <button
               onClick={() => setShowValues(!showValues)}
               className="p-2 hover:bg-muted rounded-lg transition-colors"
               title={showValues ? "Esconder valores" : "Mostrar valores"}
             >
               {showValues ? (
                 <Eye className="w-5 h-5 text-muted-foreground" />
               ) : (
                 <EyeOff className="w-5 h-5 text-muted-foreground" />
               )}
             </button>
           </div>

          {sales.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">Nenhuma venda registrada ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                   <tr className="border-b border-border">
                     <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Data</th>
                     <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">Produto</th>
                     <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Valor</th>
                     <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Pagamento</th>
                     <th className="px-3 md:px-6 py-3 text-center text-xs font-semibold text-muted-foreground">Ações</th>
                   </tr>
                 </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border hover:bg-muted/50 transition-colors text-xs md:text-sm">
                      <td className="px-3 md:px-6 py-3 text-foreground">
                        {new Date(sale.sale_date).toLocaleDateString("pt-BR", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 md:px-6 py-3 text-foreground hidden sm:table-cell truncate">{sale.description}</td>
                      <td className="px-3 md:px-6 py-3 font-semibold text-success">
                        {showValues ? `R$ ${Number(sale.amount).toFixed(2)}` : "••••••"}
                      </td>
                      <td className="px-3 md:px-6 py-3 text-foreground hidden md:table-cell">
                        {sale.payment_method === "dinheiro" && "💵"}
                        {sale.payment_method === "pix" && "📱"}
                        {sale.payment_method === "cartao" && "💳"}
                      </td>
                      <td className="px-3 md:px-6 py-3 text-center">
                        <button
                            onClick={() => {
                              setGeneratingReceipt(sale.id);
                              // Verifica se é vidro (parabrisa ou vigia)
                              const product = products.find(p => p.name === sale.description);
                              const isGlass = product && (product.category === "Para-brisa" || product.category === "Vigia");
                              
                              generateReceipt({
                                saleId: sale.id,
                                storeName: "IGUAÇU AUTO VIDROS SOM E ACESSÓRIOS",
                                storeContact: "(21) 2697-0825",
                                storeAddress: "Av Marques Rollo, 1123 - Nova Iguaçu - RJ",
                                storeEmail: "iguassuautocentral@gmail.com",
                                productName: sale.description,
                                quantity: sale.quantity || 1,
                                unitPrice: sale.unit_price || 0,
                                totalAmount: Number(sale.amount),
                                paymentMethod: sale.payment_method || "dinheiro",
                                saleDate: sale.sale_date,
                                notes: sale.notes,
                                isGlassWarranty: isGlass,
                              }).then((blob) => {
                                setReceiptBlob(blob);
                                setReceiptFileName(`recibo_${sale.id}_${new Date().toISOString().split("T")[0]}.pdf`);
                                setReceiptModalOpen(true);
                              }).finally(() => setGeneratingReceipt(null));
                            }}
                            disabled={generatingReceipt === sale.id}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50"
                            title="Visualizar cupom fiscal"
                          >
                            <Download className="w-4 h-4" />
                            <span className="text-xs">PDF</span>
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

      {/* Dialog to add additional employee */}
      <Dialog open={addEmployeeDialogOpen} onOpenChange={setAddEmployeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar outro colaborador ao produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Deseja associar outro vendedor a este produto? A comissão será compartilhada.
            </p>
            <div>
              <Label htmlFor="additional-employee">Selecione o colaborador *</Label>
              <Select value={selectedAdditionalEmployee} onValueChange={setSelectedAdditionalEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
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
            <div className="flex gap-3">
              <Button
                onClick={handleAddAdditionalEmployee}
                className="flex-1"
              >
                Adicionar
              </Button>
              <Button
                onClick={() => {
                  setAddEmployeeDialogOpen(false);
                  setSelectedAdditionalEmployee("");
                  setLastSaleData(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Não adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
