import { useState, useEffect } from "react";
import { Search, UserCog, Phone, Mail, Plus, Edit2, Trash2, Package, AlertTriangle, TrendingDown, Barcode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { logAction } from "@/lib/auditLog";
import { SalesCommissionsTab } from "@/components/SalesCommissionsTab";
import { FinancialAuthModal } from "@/components/FinancialAuthModal";

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  hire_date: string;
  salary?: number;
  active: boolean;
  sales_count?: number;
  attendance_count?: number;
  installations_count?: number;
}

interface Product {
     id: string;
     name: string;
     category: string;
     quantity: number;
     min_quantity: number;
     price: number;
     supplier: string;
     store?: string;
     cost_price?: number;
     code?: string;
     description?: string;
}

interface Asset {
    id: string;
    name: string;
    asset_type: "Imóvel" | "Veículo" | "Equipamento" | "Outro";
    value: number;
    acquisition_date?: string;
    notes?: string;
    created_at?: string;
}

const employeeRoles = [
    "Instalador Senior",
    "Instalador",
    "Atendente",
    "Gerente",
    "Auxiliar",
];

const AdminPanel = () => {
     const [employees, setEmployees] = useState<Employee[]>([]);
     const [products, setProducts] = useState<Product[]>([]);
     const [assets, setAssets] = useState<Asset[]>([]);
     const [expenses, setExpenses] = useState<any[]>([]);
     const [sales, setSales] = useState<any[]>([]);
     const [search, setSearch] = useState("");
     const [activeTab, setActiveTab] = useState<"employees" | "inventory" | "estoque" | "patrimonio" | "financial" | "comissoes">("employees");
     const [activeFinancialTab, setActiveFinancialTab] = useState<"receitas" | "despesas" | "patrimonio" | "estoque" | "vendas">("despesas");
     const [loading, setLoading] = useState(true);
     const { toast } = useToast();
     const [dialogOpen, setDialogOpen] = useState(false);
     const [empForm, setEmpForm] = useState({ name: "", role: "", phone: "", email: "", salary: "1600", password: "" });
     const [submitting, setSubmitting] = useState(false);
     const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
     const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
     const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);
     const [invDialogOpen, setInvDialogOpen] = useState(false);
     const [invForm, setInvForm] = useState({ name: "", category: "", quantity: "", minQuantity: "", price: "", supplier: "", store: "", costPrice: "", code: "", description: "" });
     const [editingProduct, setEditingProduct] = useState<Product | null>(null);
     const [productDeleteConfirmOpen, setProductDeleteConfirmOpen] = useState(false);
     const [productToDelete, setProductToDelete] = useState<Product | null>(null);
     const [assetDialogOpen, setAssetDialogOpen] = useState(false);
     const [assetForm, setAssetForm] = useState({ name: "", asset_type: "Outro", notes: "", value: "" });
     const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
     const [assetDeleteConfirmOpen, setAssetDeleteConfirmOpen] = useState(false);
     const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
     const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
     const [expenseForm, setExpenseForm] = useState({ description: "", category: "Compra", amount: "", notes: "" });
     const [quantityModalOpen, setQuantityModalOpen] = useState(false);
     const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
     const [quantityChange, setQuantityChange] = useState("");
     const [financialAuthOpen, setFinancialAuthOpen] = useState(false);
     const [financialAuthenticated, setFinancialAuthenticated] = useState(false);

    const fetchEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from("employees")
                .select("*")
                .order("hire_date", { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedEmployees: Employee[] = data.map((emp: any) => ({
                  id: emp.id,
                  name: emp.name,
                  role: emp.role,
                  phone: emp.phone,
                  email: emp.email,
                  hire_date: emp.hire_date,
                  salary: emp.salary,
                  active: emp.active || true,
                }));
                setEmployees(mappedEmployees);
            }
        } catch (error: any) {
            console.error("Erro ao carregar funcionários:", error);
            toast({
                title: "Erro ao carregar funcionários",
                description: error.message,
                variant: "destructive",
            });
        }
    };

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
        }
    };

    const fetchAssets = async () => {
        try {
            const { data, error } = await supabase
                .from("assets")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAssets(data || []);
        } catch (error: any) {
            console.error("Erro ao carregar patrimônio:", error);
            toast({
                title: "Erro ao carregar patrimônio",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const fetchExpenses = async () => {
      try {
        const { data, error } = await supabase
          .from("expenses")
          .select("*")
          .order("expense_date", { ascending: false });

        if (error) throw error;
        setExpenses(data || []);
      } catch (error: any) {
        console.error("Erro ao carregar despesas:", error);
      }
    };

    const fetchSales = async () => {
      try {
        const { data, error } = await supabase
          .from("sales")
          .select("*")
          .order("sale_date", { ascending: false });

        if (error) throw error;
        setSales(data || []);
      } catch (error: any) {
        console.error("Erro ao carregar vendas:", error);
      }
    };

    useEffect(() => {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchEmployees(), fetchProducts(), fetchAssets(), fetchExpenses(), fetchSales()]);
        setLoading(false);
      };
      loadData();
    }, []);

    // Verificar se já está autenticado na sessão
    useEffect(() => {
      const isAuthenticated = sessionStorage.getItem("financial_auth") === "true";
      setFinancialAuthenticated(isAuthenticated);
    }, []);

    const filtered = employees.filter(
        (e) =>
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.role.toLowerCase().includes(search.toLowerCase())
    );

    // Cálculos para índices de desempenho dos funcionários
    const totalEmployees = employees.length;
    const totalSalesCount = employees.reduce((sum, e) => sum + (e.sales_count || 0), 0);
    const totalAttendanceCount = employees.reduce((sum, e) => sum + (e.attendance_count || 0), 0);
    const totalInstallationsCount = employees.reduce((sum, e) => sum + (e.installations_count || 0), 0);
    
    // Top performers
    const topSeller = employees.length > 0 ? [...employees].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))[0] : null;
    const topAttendant = employees.length > 0 ? [...employees].sort((a, b) => (b.attendance_count || 0) - (a.attendance_count || 0))[0] : null;
    const topInstaller = employees.length > 0 ? [...employees].sort((a, b) => (b.installations_count || 0) - (a.installations_count || 0))[0] : null;
    
    // Top 3 em cada categoria
    const topSellers = employees
      .map(e => ({ ...e, metric: e.sales_count || 0 }))
      .sort((a, b) => b.metric - a.metric)
      .slice(0, 3)
      .filter(e => e.metric > 0);
    
    const topAttendants = employees
      .map(e => ({ ...e, metric: e.attendance_count || 0 }))
      .sort((a, b) => b.metric - a.metric)
      .slice(0, 3)
      .filter(e => e.metric > 0);
    
    const topInstallers = employees
      .map(e => ({ ...e, metric: e.installations_count || 0 }))
      .sort((a, b) => b.metric - a.metric)
      .slice(0, 3)
      .filter(e => e.metric > 0);

    const handleAddEmployee = async () => {
        if (!empForm.name || !empForm.role || !empForm.email) {
            toast({ title: "Preencha os campos obrigatórios (Nome, Cargo, Email)", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            if (editingEmp) {
                const { error } = await supabase
                    .from("employees")
                    .update({
                        name: empForm.name,
                        role: empForm.role,
                        phone: empForm.phone,
                        email: empForm.email,
                        salary: parseFloat(empForm.salary) || 1600,
                    })
                    .eq("id", editingEmp.id);

                if (error) throw error;

                // Se preencheu senha, atualizar no auth através da Edge Function
                if (empForm.password && empForm.password.length >= 6) {
                   try {
                        // Get current session token
                        const { data } = await supabase.auth.getSession();
                        const token = data?.session?.access_token;

                        console.log("Token obtido:", token);

                        if (!token) {
                            throw new Error("Sessão expirada. Faça login novamente.");
                        }

                        const response = await fetch(
                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-employee-password`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                    email: empForm.email,
                                    password: empForm.password,
                                }),
                            }
                        );

                        const result = await response.json();
                        
                        console.log("Response status:", response.status);
                        console.log("Response body:", result);
                        
                        if (response.ok && result.success) {
                            toast({ title: "Funcionário atualizado com sucesso! Senha alterada." });
                        } else {
                            console.error("Erro ao atualizar senha:", result.error);
                            toast({ 
                                title: "Funcionário atualizado!", 
                                description: result.error || "Mas houve erro ao atualizar senha.",
                                variant: "destructive"
                            });
                        }
                    } catch (err: any) {
                        console.error("Erro ao chamar Edge Function:", err);
                        toast({ 
                            title: "Funcionário atualizado!", 
                            description: err.message || "Mas houve erro ao atualizar senha.",
                            variant: "destructive"
                        });
                    }
                } else {
                   toast({ title: "Funcionário atualizado com sucesso!" });
                }
            } else {
               // Inserir employee
               const { error: empError } = await supabase
                   .from("employees")
                   .insert({
                       name: empForm.name,
                       role: empForm.role,
                       phone: empForm.phone,
                       email: empForm.email,
                       salary: parseFloat(empForm.salary) || 1600,
                       hire_date: new Date().toISOString().split("T")[0],
                       active: true,
                   });

               if (empError) throw empError;

               // Se tiver senha, criar usuário de auth via Edge Function
               if (empForm.password && empForm.password.length >= 6) {
                   try {
                       // Get current session token
                       const { data } = await supabase.auth.getSession();
                       const token = data?.session?.access_token;

                       if (!token) {
                           throw new Error("Sessão expirada. Faça login novamente.");
                       }

                       const response = await fetch(
                           `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-employee-auth`,
                           {
                               method: "POST",
                               headers: {
                                   "Content-Type": "application/json",
                                   "Authorization": `Bearer ${token}`,
                               },
                               body: JSON.stringify({
                                   email: empForm.email,
                                   password: empForm.password,
                                   full_name: empForm.name,
                               }),
                           }
                       );

                       const result = await response.json();
                       
                       if (response.ok && result.success) {
                           toast({ 
                               title: "Funcionário cadastrado com sucesso!", 
                               description: "Ele pode fazer login com este email e senha." 
                           });
                       } else {
                           console.error("Erro ao criar autenticação:", result.error);
                           toast({ 
                               title: "Funcionário cadastrado!", 
                               description: "Mas houve erro ao criar login. Tente adicionar senha depois.",
                               variant: "destructive"
                           });
                       }
                   } catch (err: any) {
                       console.error("Erro ao chamar Edge Function:", err);
                       toast({ 
                           title: "Funcionário cadastrado!", 
                           description: "Mas houve erro ao criar login. Tente adicionar senha depois.",
                           variant: "destructive"
                       });
                   }
               } else {
                   toast({ title: "Funcionário cadastrado com sucesso!" });
               }
            }

            setEmpForm({ name: "", role: "", phone: "", email: "", salary: "1600", password: "" });
            setEditingEmp(null);
            setDialogOpen(false);
            
            // Log da ação (sem await - roda em background)
            if (editingEmp) {
              logAction("update", "employees", editingEmp.id, editingEmp.name, `Atualizado: ${empForm.name}, ${empForm.role}`);
            } else {
              logAction("create", "employees", empForm.email, empForm.name, `Novo funcionário: ${empForm.role}`);
            }
            
            fetchEmployees();
        } catch (error: any) {
            toast({
                title: "Erro ao salvar funcionário",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditEmployee = (emp: Employee) => {
      setEditingEmp(emp);
      setEmpForm({
        name: emp.name,
        role: emp.role,
        phone: emp.phone || "",
        email: emp.email || "",
        salary: emp.salary?.toString() || "",
        password: "", // Deixa vazio para edição (será preenchido apenas se quiser alterar)
      });
      setDialogOpen(true);
    };

    const handleDeleteEmployee = async () => {
        if (!empToDelete) return;

        try {
            // Primeiro, tenta deletar o usuário de auth (se existir)
            if (empToDelete.email) {
                try {
                    const { data } = await supabase.auth.getSession();
                    const token = data?.session?.access_token;

                    if (token) {
                        await fetch(
                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-employee-auth`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                    email: empToDelete.email,
                                }),
                            }
                        );
                    }
                } catch (err) {
                    console.warn("Aviso ao deletar usuário de auth:", err);
                    // Continua mesmo se falhar o delete do auth
                }
            }

            // Deleta registros relacionados primeiro
            await supabase
                .from("services")
                .delete()
                .eq("employee_id", empToDelete.id);

            await supabase
                .from("replacements")
                .delete()
                .eq("employee_id", empToDelete.id);

            // Depois deleta o registro na tabela employees
            const { error } = await supabase
                .from("employees")
                .delete()
                .eq("id", empToDelete.id);

            if (error) throw error;
            
            // Log da ação
            logAction("delete", "employees", empToDelete.id, empToDelete.name, "Funcionário deletado");
            
            toast({ title: "Funcionário removido com sucesso!" });
            setDeleteConfirmOpen(false);
            setEmpToDelete(null);
            fetchEmployees();
        } catch (error: any) {
            toast({
                title: "Erro ao remover funcionário",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const openDeleteConfirm = (emp: Employee) => {
        setEmpToDelete(emp);
        setDeleteConfirmOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingEmp(null);
        setEmpForm({ name: "", role: "", phone: "", email: "", salary: "1600" });
    };

    const handleAddProduct = async () => {
        if (!invForm.name || !invForm.category || !invForm.quantity) {
            toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            if (editingProduct) {
                // Atualizar produto
                const { error } = await supabase
                    .from("products")
                    .update({
                        name: invForm.name,
                        category: invForm.category,
                        min_quantity: parseInt(invForm.minQuantity) || 1,
                        price: parseFloat(invForm.price) || 0,
                        supplier: invForm.supplier || "N/A",
                        store: invForm.store || null,
                        cost_price: parseFloat(invForm.costPrice) || 0,
                        code: invForm.code || null,
                        description: invForm.description || null,
                        })
                        .eq("id", editingProduct.id);

                if (error) throw error;
                logAction("update", "products", editingProduct.id, editingProduct.name, `Atualizado: ${invForm.name} - Código: ${invForm.code || "N/A"}`);
                toast({ title: "Produto atualizado com sucesso!" });
            } else {
                // Criar novo produto
                const { data, error } = await supabase
                    .from("products")
                    .insert({
                        name: invForm.name,
                        category: invForm.category,
                        quantity: parseInt(invForm.quantity),
                        min_quantity: parseInt(invForm.minQuantity) || 1,
                        price: parseFloat(invForm.price) || 0,
                        supplier: invForm.supplier || "N/A",
                        store: invForm.store || null,
                        cost_price: parseFloat(invForm.costPrice) || 0,
                        code: invForm.code || null,
                        description: invForm.description || null,
                        })
                        .select();

                if (error) throw error;
                if (data && data[0]) {
                    logAction("create", "products", data[0].id, invForm.name, `Código: ${invForm.code || "N/A"} - Categoria: ${invForm.category} - Loja: ${invForm.store}`);
                }
                toast({ title: "Produto cadastrado com sucesso!" });
                }
                setInvForm({ name: "", category: "", quantity: "", minQuantity: "", price: "", supplier: "", store: "", costPrice: "", code: "", description: "" });
                setEditingProduct(null);
                setInvDialogOpen(false);
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

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setInvForm({
            name: product.name,
            category: product.category,
            quantity: product.quantity.toString(),
            minQuantity: product.min_quantity.toString(),
            price: product.price.toString(),
            supplier: product.supplier || "",
            store: product.store || "",
            costPrice: (product.cost_price || 0).toString(),
            code: product.code || "",
            description: product.description || "",
        });
        setInvDialogOpen(true);
    };

    const openProductDeleteConfirm = (product: Product) => {
        setProductToDelete(product);
        setProductDeleteConfirmOpen(true);
    };

    const handleDeleteProduct = async () => {
      if (!productToDelete) return;
      try {
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", productToDelete.id);

        if (error) throw error;
        
        // Log da ação
        await logAction("delete", "products", productToDelete.id, productToDelete.name, `Produto removido do estoque`);
        
        toast({ title: "Produto removido com sucesso!" });
        setProductDeleteConfirmOpen(false);
        setProductToDelete(null);
        fetchProducts();
      } catch (error: any) {
        toast({
          title: "Erro ao remover produto",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    const handleAddAsset = async () => {
        if (!assetForm.name || !assetForm.value) {
            toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from("assets")
                .insert({
                    name: assetForm.name,
                    asset_type: assetForm.asset_type,
                    notes: assetForm.notes,
                    value: parseFloat(assetForm.value),
                    acquisition_date: new Date().toISOString().split("T")[0],
                });

            if (error) throw error;
            toast({ title: "Patrimônio cadastrado com sucesso!" });
            setAssetForm({ name: "", asset_type: "Outro", notes: "", value: "" });
            setAssetDialogOpen(false);
            fetchAssets();
        } catch (error: any) {
            toast({
                title: "Erro ao salvar patrimônio",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditAsset = async () => {
        if (!editingAsset || !assetForm.name || !assetForm.value) {
            toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from("assets")
                .update({
                    name: assetForm.name,
                    asset_type: assetForm.asset_type,
                    notes: assetForm.notes,
                    value: parseFloat(assetForm.value),
                })
                .eq("id", editingAsset.id);

            if (error) throw error;
            toast({ title: "Patrimônio atualizado com sucesso!" });
            setAssetForm({ name: "", asset_type: "Outro", notes: "", value: "" });
            setEditingAsset(null);
            setAssetDialogOpen(false);
            fetchAssets();
        } catch (error: any) {
            toast({
                title: "Erro ao atualizar patrimônio",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const openEditAssetDialog = (asset: Asset) => {
        setEditingAsset(asset);
        setAssetForm({
            name: asset.name,
            asset_type: asset.asset_type,
            notes: asset.notes || "",
            value: asset.value.toString(),
        });
        setAssetDialogOpen(true);
    };

    const handleCloseAssetDialog = () => {
        setAssetDialogOpen(false);
        setEditingAsset(null);
        setAssetForm({ name: "", asset_type: "Outro", notes: "", value: "" });
    };

    const openDeleteAssetConfirm = (asset: Asset) => {
        setAssetToDelete(asset);
        setAssetDeleteConfirmOpen(true);
    };

    const handleDeleteAsset = async () => {
        if (!assetToDelete) return;

        try {
            const { error } = await supabase
                .from("assets")
                .delete()
                .eq("id", assetToDelete.id);

            if (error) throw error;
            
            // Log da ação
            await logAction("delete", "patrimonio", assetToDelete.id, assetToDelete.name, `Patrimônio removido (${assetToDelete.asset_type})`);
            
            toast({ title: "Patrimônio removido com sucesso!" });
            setAssetDeleteConfirmOpen(false);
            setAssetToDelete(null);
            fetchAssets();
        } catch (error: any) {
            toast({
                title: "Erro ao remover patrimônio",
                description: error.message,
                variant: "destructive",
            });
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
      await handleUpdateQuantity(selectedProduct.id, newQuantity);
      toast({ title: `-${change} unidades removidas`, variant: "default" });
      setQuantityModalOpen(false);
    };

    const handleAddExpense = async () => {
      if (!expenseForm.description || !expenseForm.amount) {
        toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
        return;
      }
      setSubmitting(true);
      try {
        const { error } = await supabase
          .from("expenses")
          .insert({
            description: expenseForm.description,
            category: expenseForm.category,
            amount: parseFloat(expenseForm.amount),
            notes: expenseForm.notes || null,
            expense_date: new Date().toISOString().split("T")[0],
          });

        if (error) throw error;
        toast({ title: "Despesa adicionada com sucesso!" });
        setExpenseForm({ description: "", category: "Compra", amount: "", notes: "" });
        setExpenseDialogOpen(false);
        fetchExpenses();
      } catch (error: any) {
        toast({
          title: "Erro ao adicionar despesa",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary">
                        <UserCog className="w-6 h-6 text-primary-foreground" />
                    </div>
                </div>
            </div>
        );
    }

    const productCategories = ["Para-brisa", "Retrovisor", "Vigia", "Farol", "Vidro lateral", "Insumo", "Ferramenta", "Outro"];
const stores = ["Loja 1", "Loja 2", "Loja 3"];

    // Cálculos para saúde do estoque e financeiro
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= (p.min_quantity || 1));
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    
    // Cálculos financeiros
    const totalEmployeeSalaries = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalGastos = totalEmployeeSalaries + totalExpenses;
    const categoryValues = products.reduce((acc: any, p) => {
      acc[p.category] = (acc[p.category] || 0) + (p.quantity * p.price);
      return acc;
    }, {});
    const topCategory = Object.entries(categoryValues).sort((a: any, b: any) => b[1] - a[1])[0];
    
    // Produtos com mais e menos quantidade
    const productsWithQuantity = products
      .map(p => ({ ...p, totalValue: p.quantity * p.price }))
      .sort((a, b) => b.quantity - a.quantity);
    const mostStockedProduct = productsWithQuantity[0];
    const leastStockedProduct = productsWithQuantity[productsWithQuantity.length - 1];
    
    // Produtos mais valiosos
    const mostValuableProducts = products
      .map(p => ({ ...p, totalValue: p.quantity * p.price }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 3);

    return (
        <div>
            <PageHeader
                title="Painel Administrativo"
                description="Gerencie a equipe e estoque"
            />

            {/* Abas */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex gap-2 border-b border-border min-w-max">
                <button
                  onClick={() => {
                    // Limpar autenticação ao sair da aba Financeiro
                    sessionStorage.removeItem("financial_auth");
                    sessionStorage.removeItem("financial_auth_time");
                    setFinancialAuthenticated(false);
                    setActiveTab("employees");
                  }}
                  className={cn(
                    "px-3 md:px-4 py-2 font-medium border-b-2 transition-colors text-sm md:text-base whitespace-nowrap",
                    activeTab === "employees"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Funcionários
                </button>
                <button
                  onClick={() => {
                    // Limpar autenticação ao sair da aba Financeiro
                    sessionStorage.removeItem("financial_auth");
                    sessionStorage.removeItem("financial_auth_time");
                    setFinancialAuthenticated(false);
                    setActiveTab("inventory");
                  }}
                  className={cn(
                    "px-3 md:px-4 py-2 font-medium border-b-2 transition-colors text-sm md:text-base whitespace-nowrap",
                    activeTab === "inventory"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Inventário
                </button>
                <button
                  onClick={() => {
                    // Limpar autenticação ao sair da aba Financeiro
                    sessionStorage.removeItem("financial_auth");
                    sessionStorage.removeItem("financial_auth_time");
                    setFinancialAuthenticated(false);
                    setActiveTab("estoque");
                  }}
                  className={cn(
                    "px-3 md:px-4 py-2 font-medium border-b-2 transition-colors text-sm md:text-base whitespace-nowrap",
                    activeTab === "estoque"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Estoque
                </button>
                <button
                  onClick={() => {
                    // Limpar autenticação ao sair da aba Financeiro
                    sessionStorage.removeItem("financial_auth");
                    sessionStorage.removeItem("financial_auth_time");
                    setFinancialAuthenticated(false);
                    setActiveTab("patrimonio");
                  }}
                  className={cn(
                    "px-3 md:px-4 py-2 font-medium border-b-2 transition-colors text-sm md:text-base whitespace-nowrap",
                    activeTab === "patrimonio"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Patrimônio
                </button>
                <button
                   onClick={() => {
                     if (financialAuthenticated) {
                       setActiveTab("financial");
                     } else {
                       setFinancialAuthOpen(true);
                     }
                   }}
                   className={cn(
                     "px-3 md:px-4 py-2 font-medium border-b-2 transition-colors text-sm md:text-base whitespace-nowrap",
                     activeTab === "financial"
                       ? "border-primary text-primary"
                       : "border-transparent text-muted-foreground hover:text-foreground"
                   )}
                 >
                   Financeiro 🔒
                 </button>
                 <button
                   onClick={() => {
                     // Limpar autenticação ao sair da aba Financeiro
                     sessionStorage.removeItem("financial_auth");
                     sessionStorage.removeItem("financial_auth_time");
                     setFinancialAuthenticated(false);
                     setActiveTab("comissoes");
                   }}
                  className={cn(
                    "px-3 md:px-4 py-2 font-medium border-b-2 transition-colors text-sm md:text-base whitespace-nowrap",
                    activeTab === "comissoes"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Comissões
                </button>
              </div>
            </div>

            {/* SEÇÃO FUNCIONÁRIOS */}
            {activeTab === "employees" && (
                <div>
                    {/* CARDS DE ÍNDICES DE DESEMPENHO */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
                        {/* Total de Funcionários */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-3 md:p-6 rounded-lg border border-border"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Funcionários</p>
                                    <p className="text-lg md:text-3xl font-bold text-primary">{totalEmployees}</p>
                                    <p className="text-xs text-muted-foreground mt-1 hidden md:block">Equipe completa</p>
                                </div>
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                                    <UserCog className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Total de Vendas */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card p-3 md:p-6 rounded-lg border border-border"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Vendas</p>
                                    <p className="text-lg md:text-3xl font-bold text-green-500">{totalSalesCount}</p>
                                    {topSeller && <p className="text-xs text-muted-foreground mt-1 hidden md:block">Top: {topSeller.name}</p>}
                                </div>
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                                    <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Total de Atendimentos */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card p-3 md:p-6 rounded-lg border border-border"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Atendimentos</p>
                                    <p className="text-lg md:text-3xl font-bold text-blue-500">{totalAttendanceCount}</p>
                                    {topAttendant && <p className="text-xs text-muted-foreground mt-1 hidden md:block">Top: {topAttendant.name}</p>}
                                </div>
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Total de Instalações */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="glass-card p-3 md:p-6 rounded-lg border border-border"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Instalações</p>
                                    <p className="text-lg md:text-3xl font-bold text-purple-500">{totalInstallationsCount}</p>
                                    {topInstaller && <p className="text-xs text-muted-foreground mt-1 hidden md:block">Top: {topInstaller.name}</p>}
                                </div>
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                                    <Package className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* CARDS ADICIONAIS DE ANÁLISE */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                        {/* Top 3 Vendedores */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="glass-card p-4 rounded-lg border border-border"
                        >
                            <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase">🏆 Top 3 Vendedores</p>
                            <div className="space-y-2">
                                {topSellers.length > 0 ? (
                                    topSellers.map((e, idx) => (
                                        <div key={e.id} className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground flex-1 truncate">{idx + 1}. {e.name}</p>
                                            <p className="text-xs font-bold text-green-500 whitespace-nowrap ml-2">{e.metric} vendas</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">Nenhuma venda registrada</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Top 3 Atendentes */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="glass-card p-4 rounded-lg border border-border"
                        >
                            <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase">📞 Top 3 Atendentes</p>
                            <div className="space-y-2">
                                {topAttendants.length > 0 ? (
                                    topAttendants.map((e, idx) => (
                                        <div key={e.id} className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground flex-1 truncate">{idx + 1}. {e.name}</p>
                                            <p className="text-xs font-bold text-blue-500 whitespace-nowrap ml-2">{e.metric} atends.</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">Nenhum atendimento registrado</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Top 3 Instaladores */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="glass-card p-4 rounded-lg border border-border"
                        >
                            <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase">🔧 Top 3 Instaladores</p>
                            <div className="space-y-2">
                                {topInstallers.length > 0 ? (
                                    topInstallers.map((e, idx) => (
                                        <div key={e.id} className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground flex-1 truncate">{idx + 1}. {e.name}</p>
                                            <p className="text-xs font-bold text-purple-500 whitespace-nowrap ml-2">{e.metric} inst.</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">Nenhuma instalação registrada</p>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    <div className="mb-6 flex justify-end">
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gradient-primary text-primary-foreground font-semibold gap-2 glow-primary">
                                    <Plus className="w-4 h-4" /> Novo Funcionário
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border">
                                <DialogHeader>
                                    <DialogTitle className="font-display">
                                        {editingEmp ? "Editar Funcionário" : "Cadastrar Funcionário"}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Nome *</Label>
                                            <Input
                                                value={empForm.name}
                                                onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                                                placeholder="Nome completo"
                                            />
                                        </div>
                                        <div>
                                            <Label>Cargo *</Label>
                                            <Select value={empForm.role} onValueChange={(v) => setEmpForm({ ...empForm, role: v })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {employeeRoles.map((r) => (
                                                        <SelectItem key={r} value={r}>
                                                            {r}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Telefone</Label>
                                            <Input
                                                value={empForm.phone}
                                                onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                                                placeholder="(45) 99999-9999"
                                            />
                                        </div>
                                        <div>
                                             <Label>E-mail *</Label>
                                             <Input
                                                 type="email"
                                                 value={empForm.email}
                                                 onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                                                 placeholder="email@iguacu.com"
                                                 autoComplete="email"
                                             />
                                         </div>
                                        </div>
                                        <div>
                                            <Label>
                                                {editingEmp ? "Nova Senha (deixe em branco para não alterar)" : "Senha *"}
                                            </Label>
                                             <Input
                                                 type="password"
                                                 value={empForm.password}
                                                 onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                                                 placeholder={editingEmp ? "Deixe vazio para não alterar" : "Mínimo 6 caracteres"}
                                                 minLength={6}
                                                 autoComplete="new-password"
                                             />
                                             <p className="text-xs text-muted-foreground mt-1">
                                                 {editingEmp ? "Preencha apenas se deseja alterar a senha" : "A senha será usada para fazer login no sistema"}
                                             </p>
                                         </div>
                                        <div>
                                         <Label>Custo Total (Salário + Benefícios)</Label>
                                         <Input
                                             type="number"
                                             value={empForm.salary}
                                             onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })}
                                             placeholder="1600"
                                             autoComplete="off"
                                         />
                                        </div>
                                    <Button
                                        onClick={handleAddEmployee}
                                        disabled={submitting}
                                        className="w-full gradient-primary text-primary-foreground font-semibold"
                                    >
                                        {submitting ? "Salvando..." : editingEmp ? "Atualizar" : "Cadastrar"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou cargo..." className="pl-10 bg-card border-border" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {filtered.map((emp, i) => (
                                <motion.div
                                    key={emp.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass-card p-5"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shrink-0">
                                            <span className="text-lg font-display font-bold text-primary-foreground">
                                                {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground truncate">{emp.name}</p>
                                            <p className="text-sm text-primary font-medium">{emp.role}</p>
                                            <div className="mt-3 space-y-1">
                                                {emp.phone && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <Phone className="w-3 h-3" /> {emp.phone}
                                                    </p>
                                                )}
                                                {emp.email && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <Mail className="w-3 h-3" /> {emp.email}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                              Desde {new Date(emp.hire_date).toLocaleDateString("pt-BR")}
                                            </p>
                                            {/* Performance Metrics */}
                                            <div className="mt-3 pt-3 border-t border-border space-y-1">
                                                {emp.sales_count > 0 && (
                                                    <p className="text-xs text-muted-foreground">💰 {emp.sales_count} vendas</p>
                                                )}
                                                {emp.attendance_count > 0 && (
                                                    <p className="text-xs text-muted-foreground">📞 {emp.attendance_count} atendimentos</p>
                                                )}
                                                {emp.installations_count > 0 && (
                                                    <p className="text-xs text-muted-foreground">🔧 {emp.installations_count} instalações</p>
                                                )}
                                                {emp.salary && (
                                                    <p className="text-xs font-semibold text-primary">R$ {emp.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                                )}
                                            </div>
                                            </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                            <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEditEmployee(emp)}
                                            className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
                                        >
                                            <Edit2 className="w-3 h-3 mr-1" />
                                            Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => openDeleteConfirm(emp)}
                                            className="flex-1"
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" />
                                            Excluir
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Nenhum funcionário encontrado
                        </div>
                    )}

                    {/* Alert Dialog para Confirmação de Exclusão */}
                    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Funcionário</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tem certeza que deseja excluir o funcionário <span className="font-semibold text-foreground">{empToDelete?.name}</span>? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex gap-3 justify-end">
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteEmployee}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Excluir
                                </AlertDialogAction>
                            </div>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

            {/* SEÇÃO INVENTÁRIO */}
            {activeTab === "inventory" && (
                 <div>
                     {/* Cards de Resumo */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                         {/* Total de Produtos */}
                         <motion.div
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="glass-card p-6 rounded-lg border border-border"
                         >
                             <div className="flex items-center justify-between">
                                 <div>
                                     <p className="text-sm text-muted-foreground mb-1">Total de Produtos</p>
                                     <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
                                 </div>
                                 <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
                                     <Barcode className="w-6 h-6 text-primary" />
                                 </div>
                             </div>
                         </motion.div>

                         {/* Produtos com Baixo Estoque */}
                         <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.1 }}
                           className="glass-card p-6 rounded-lg border border-border"
                         >
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="text-sm text-muted-foreground mb-1">Baixo Estoque</p>
                               <p className={cn("text-3xl font-bold", lowStockProducts.length > 0 ? "text-destructive" : "text-foreground")}>
                                 {lowStockProducts.length}
                               </p>
                               {lowStockProducts.length > 0 && (
                                 <div className="mt-2 space-y-1">
                                   {lowStockProducts.slice(0, 2).map(p => (
                                     <p key={p.id} className="text-xs text-destructive">• {p.name}</p>
                                   ))}
                                   {lowStockProducts.length > 2 && (
                                     <p className="text-xs text-muted-foreground">+{lowStockProducts.length - 2} mais</p>
                                   )}
                                 </div>
                               )}
                             </div>
                             <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", lowStockProducts.length > 0 ? "bg-destructive/15" : "bg-success/15")}>
                               <AlertTriangle className={cn("w-6 h-6", lowStockProducts.length > 0 ? "text-destructive" : "text-success")} />
                             </div>
                           </div>
                         </motion.div>
                         </div>

                        {/* Cards Adicionais de Análise */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* Produto Mais Estocado */}
                        {mostStockedProduct && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="glass-card p-4 rounded-lg border border-border"
                          >
                            <p className="text-xs text-muted-foreground mb-2">Maior Quantidade</p>
                            <p className="font-semibold text-foreground truncate text-sm">{mostStockedProduct.name}</p>
                            <p className="text-lg font-bold text-primary mt-1">{mostStockedProduct.quantity} unid.</p>
                            <p className="text-xs text-muted-foreground mt-1">{mostStockedProduct.category}</p>
                          </motion.div>
                        )}

                        {/* Produto Menos Estocado */}
                        {leastStockedProduct && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className={cn("glass-card p-4 rounded-lg border", leastStockedProduct.quantity <= (leastStockedProduct.min_quantity || 1) ? "border-destructive/50 bg-destructive/5" : "border-border")}
                          >
                            <p className="text-xs text-muted-foreground mb-2">Menor Quantidade</p>
                            <p className={cn("font-semibold truncate text-sm", leastStockedProduct.quantity <= (leastStockedProduct.min_quantity || 1) ? "text-destructive" : "text-foreground")}>
                              {leastStockedProduct.name}
                            </p>
                            <p className={cn("text-lg font-bold mt-1", leastStockedProduct.quantity <= (leastStockedProduct.min_quantity || 1) ? "text-destructive" : "text-primary")}>
                              {leastStockedProduct.quantity} unid.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Mín: {leastStockedProduct.min_quantity || 1}</p>
                          </motion.div>
                        )}

                        {/* Produtos Mais Valiosos */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="glass-card p-4 rounded-lg border border-border"
                        >
                          <p className="text-xs text-muted-foreground mb-2">Top 3 Valiosos</p>
                          <div className="space-y-2">
                            {mostValuableProducts.map((p, idx) => (
                              <div key={p.id} className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground flex-1 truncate">{idx + 1}. {p.name}</p>
                                <p className="text-xs font-bold text-primary whitespace-nowrap ml-2">R$ {p.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                        </div>

                    {/* Barra de Busca e Botão */}
                    <div className="mb-6 flex gap-4 justify-between items-center">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nome, código, categoria, fornecedor..."
                                className="pl-10 bg-card border-border"
                            />
                        </div>
                        <Dialog open={invDialogOpen} onOpenChange={setInvDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gradient-primary text-primary-foreground font-semibold gap-2 glow-primary">
                                    <Plus className="w-4 h-4" /> Novo Produto
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
                                 <DialogHeader>
                                     <DialogTitle className="font-display">{editingProduct ? "Editar Produto" : "Cadastrar Produto"}</DialogTitle>
                                 </DialogHeader>
                                 <div className="space-y-4">
                                      <div>
                                          <Label>Código</Label>
                                          <Input
                                              value={invForm.code}
                                              onChange={(e) => setInvForm({ ...invForm, code: e.target.value })}
                                              placeholder="Código do produto"
                                          />
                                      </div>
                                      <div>
                                          <Label>Nome *</Label>
                                          <Input
                                              value={invForm.name}
                                              onChange={(e) => setInvForm({ ...invForm, name: e.target.value })}
                                              placeholder="Nome do produto"
                                              disabled={editingProduct ? false : false}
                                          />
                                      </div>
                                     <div>
                                         <Label>Categoria *</Label>
                                         <Select value={invForm.category} onValueChange={(v) => setInvForm({ ...invForm, category: v })}>
                                             <SelectTrigger>
                                                 <SelectValue placeholder="Selecione..." />
                                             </SelectTrigger>
                                             <SelectContent>
                                                 {productCategories.map((c) => (
                                                     <SelectItem key={c} value={c}>
                                                         {c}
                                                     </SelectItem>
                                                 ))}
                                             </SelectContent>
                                         </Select>
                                     </div>
                                     <div>
                                         <Label>Fornecedor</Label>
                                         <Input
                                             value={invForm.supplier}
                                             onChange={(e) => setInvForm({ ...invForm, supplier: e.target.value })}
                                             placeholder="Nome do fornecedor"
                                         />
                                     </div>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div>
                                             <Label>Quantidade {editingProduct ? "(somente leitura)" : "*"}</Label>
                                             <Input
                                                 type="number"
                                                 value={invForm.quantity}
                                                 onChange={(e) => setInvForm({ ...invForm, quantity: e.target.value })}
                                                 disabled={editingProduct ? true : false}
                                             />
                                         </div>
                                         <div>
                                             <Label>Qtd Mínima</Label>
                                             <Input
                                                 type="number"
                                                 value={invForm.minQuantity}
                                                 onChange={(e) => setInvForm({ ...invForm, minQuantity: e.target.value })}
                                             />
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div>
                                             <Label>Preço de Venda (R$)</Label>
                                             <Input
                                                 type="number"
                                                 step="0.01"
                                                 value={invForm.price}
                                                 onChange={(e) => setInvForm({ ...invForm, price: e.target.value })}
                                             />
                                         </div>
                                         <div>
                                             <Label>Preço de Custo (R$)</Label>
                                             <Input
                                                 type="number"
                                                 step="0.01"
                                                 value={invForm.costPrice}
                                                 onChange={(e) => setInvForm({ ...invForm, costPrice: e.target.value })}
                                                 placeholder="Valor do fornecedor"
                                             />
                                         </div>
                                     </div>
                                     <div>
                                         <Label>Observação</Label>
                                         <Input
                                             value={invForm.description}
                                             onChange={(e) => setInvForm({ ...invForm, description: e.target.value })}
                                             placeholder="Adicione observações sobre o produto"
                                         />
                                     </div>
                                     <div className="flex gap-3">
                                         <Button
                                             onClick={handleAddProduct}
                                             disabled={submitting}
                                             className="flex-1 gradient-primary text-primary-foreground font-semibold"
                                         >
                                             {submitting ? "Salvando..." : editingProduct ? "Atualizar" : "Cadastrar"}
                                         </Button>
                                         {editingProduct && (
                                             <Button
                                                 onClick={() => {
                                                     setEditingProduct(null);
                                                     setInvForm({ name: "", category: "", quantity: "", minQuantity: "", price: "", supplier: "", store: "", costPrice: "", code: "", description: "" });
                                                     setInvDialogOpen(false);
                                                 }}
                                                 variant="outline"
                                                 className="flex-1"
                                             >
                                                 Cancelar
                                             </Button>
                                         )}
                                     </div>
                                 </div>
                             </DialogContent>
                        </Dialog>
                    </div>

                    {/* Tabela de Produtos */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {products
                                         .filter(
                                             (p) =>
                                                 p.name.toLowerCase().includes(search.toLowerCase()) ||
                                                 p.category.toLowerCase().includes(search.toLowerCase()) ||
                                                 (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
                                                 (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase())) ||
                                                 (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
                                                 (p.store && p.store.toLowerCase().includes(search.toLowerCase()))
                                         )
                                        .map((p, i) => {
                                          const isLow = p.quantity <= (p.min_quantity || 1);
                                          const totalValue = p.quantity * p.price;
                                            return (
                                                <motion.tr
                                                     key={p.id}
                                                     initial={{ opacity: 0 }}
                                                     animate={{ opacity: 1 }}
                                                     transition={{ delay: i * 0.03 }}
                                                     className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                                                 >
                                                     <td className="p-4" colSpan={10}>
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
                                                                     <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground mt-2">
                                                                         <div><span className="font-medium">Cat:</span> {p.category}</div>
                                                                         <div><span className="font-medium">Forn:</span> {p.supplier || "—"}</div>
                                                                         <div className={cn("font-bold", isLow ? "text-destructive" : "text-foreground")}><span className="font-medium">Qtd:</span> {p.quantity}</div>
                                                                         <div><span className="font-medium">Mín:</span> {p.min_quantity}</div>
                                                                     </div>
                                                                     <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mt-2">
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
                                                                 <div className="flex gap-2">
                                                                     <Button
                                                                         size="sm"
                                                                         variant="outline"
                                                                         className="border-primary/30 text-primary hover:bg-primary/10"
                                                                         onClick={() => handleEditProduct(p)}
                                                                     >
                                                                         <Edit2 className="w-3 h-3 mr-1" />
                                                                         Editar
                                                                     </Button>
                                                                     <Button
                                                                         size="sm"
                                                                         variant="destructive"
                                                                         onClick={() => openProductDeleteConfirm(p)}
                                                                     >
                                                                         <Trash2 className="w-3 h-3" />
                                                                     </Button>
                                                                 </div>
                                                             </div>
                                                         </div>
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

                    {/* MODAL DE GERENCIAMENTO DE ESTOQUE */}
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

                    {/* AlertDialog para Confirmação de Exclusão de Produto */}
                    <AlertDialog open={productDeleteConfirmOpen} onOpenChange={setProductDeleteConfirmOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tem certeza que deseja excluir o produto <span className="font-semibold text-foreground">{productToDelete?.name}</span>? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex gap-3 justify-end">
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteProduct}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Excluir
                                </AlertDialogAction>
                            </div>
                        </AlertDialogContent>
                    </AlertDialog>
                     </div>
                     )}

                     {/* SEÇÃO ESTOQUE */}
                     {activeTab === "estoque" && (
                      <div>
                          {/* Cards de Resumo */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                              {/* Total de Produtos */}
                              <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="glass-card p-6 rounded-lg border border-border"
                              >
                                  <div className="flex items-center justify-between">
                                      <div>
                                          <p className="text-sm text-muted-foreground mb-1">Total de Produtos</p>
                                          <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
                                      </div>
                                      <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
                                          <Barcode className="w-6 h-6 text-primary" />
                                      </div>
                                  </div>
                              </motion.div>

                              {/* Produtos com Baixo Estoque */}
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="glass-card p-6 rounded-lg border border-border"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Baixo Estoque</p>
                                    <p className={cn("text-3xl font-bold", lowStockProducts.length > 0 ? "text-destructive" : "text-foreground")}>
                                      {lowStockProducts.length}
                                    </p>
                                    {lowStockProducts.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {lowStockProducts.slice(0, 2).map(p => (
                                          <p key={p.id} className="text-xs text-destructive">• {p.name}</p>
                                        ))}
                                        {lowStockProducts.length > 2 && (
                                          <p className="text-xs text-muted-foreground">+{lowStockProducts.length - 2} mais</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", lowStockProducts.length > 0 ? "bg-destructive/15" : "bg-success/15")}>
                                    <AlertTriangle className={cn("w-6 h-6", lowStockProducts.length > 0 ? "text-destructive" : "text-success")} />
                                  </div>
                                </div>
                              </motion.div>
                              </div>

                              {/* Cards Adicionais de Análise */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                              {/* Produto Mais Estocado */}
                              {mostStockedProduct && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.4 }}
                                  className="glass-card p-4 rounded-lg border border-border"
                                >
                                  <p className="text-xs text-muted-foreground mb-2">Maior Quantidade</p>
                                  <p className="font-semibold text-foreground truncate text-sm">{mostStockedProduct.name}</p>
                                  <p className="text-lg font-bold text-primary mt-1">{mostStockedProduct.quantity} unid.</p>
                                  <p className="text-xs text-muted-foreground mt-1">{mostStockedProduct.category}</p>
                                </motion.div>
                              )}

                              {/* Produto Menos Estocado */}
                              {leastStockedProduct && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.5 }}
                                  className={cn("glass-card p-4 rounded-lg border", leastStockedProduct.quantity <= (leastStockedProduct.min_quantity || 1) ? "border-destructive/50 bg-destructive/5" : "border-border")}
                                >
                                  <p className="text-xs text-muted-foreground mb-2">Menor Quantidade</p>
                                  <p className={cn("font-semibold truncate text-sm", leastStockedProduct.quantity <= (leastStockedProduct.min_quantity || 1) ? "text-destructive" : "text-foreground")}>
                                    {leastStockedProduct.name}
                                  </p>
                                  <p className={cn("text-lg font-bold mt-1", leastStockedProduct.quantity <= (leastStockedProduct.min_quantity || 1) ? "text-destructive" : "text-primary")}>
                                    {leastStockedProduct.quantity} unid.
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">Mín: {leastStockedProduct.min_quantity || 1}</p>
                                </motion.div>
                              )}

                              {/* Produtos Mais Valiosos */}
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="glass-card p-4 rounded-lg border border-border"
                              >
                                <p className="text-xs text-muted-foreground mb-2">Top 3 Valiosos</p>
                                <div className="space-y-2">
                                  {mostValuableProducts.map((p, idx) => (
                                    <div key={p.id} className="flex items-center justify-between">
                                      <p className="text-xs text-muted-foreground flex-1 truncate">{idx + 1}. {p.name}</p>
                                      <p className="text-xs font-bold text-primary whitespace-nowrap ml-2">R$ {p.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                              </div>

                          {/* Barra de Busca */}
                          <div className="mb-6 flex gap-4 justify-between items-center">
                              <div className="relative max-w-md flex-1">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                      value={search}
                                      onChange={(e) => setSearch(e.target.value)}
                                      placeholder="Buscar por nome, código, categoria, fornecedor..."
                                      className="pl-10 bg-card border-border"
                                  />
                              </div>
                          </div>

                          {/* Tabela de Produtos */}
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-x-auto">
                              <table className="w-full">
                                  <thead>
                                      <tr className="border-b border-border">
                                          <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      <AnimatePresence>
                                          {products
                                               .filter(
                                                   (p) =>
                                                       p.name.toLowerCase().includes(search.toLowerCase()) ||
                                                       p.category.toLowerCase().includes(search.toLowerCase()) ||
                                                       (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
                                                       (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase())) ||
                                                       (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
                                                       (p.store && p.store.toLowerCase().includes(search.toLowerCase()))
                                               )
                                              .map((p, i) => {
                                                const isLow = p.quantity <= (p.min_quantity || 1);
                                                const totalValue = p.quantity * p.price;
                                                  return (
                                                      <motion.tr
                                                           key={p.id}
                                                           initial={{ opacity: 0 }}
                                                           animate={{ opacity: 1 }}
                                                           transition={{ delay: i * 0.03 }}
                                                           className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                                                       >
                                                           <td className="p-4" colSpan={10}>
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
                                                                           <div className="grid grid-cols-5 gap-4 text-xs text-muted-foreground mt-2">
                                                                               <div><span className="font-medium">Cat:</span> {p.category}</div>
                                                                               <div><span className="font-medium">Loja:</span> {p.store || "Loja 1"}</div>
                                                                               <div><span className="font-medium">Forn:</span> {p.supplier || "—"}</div>
                                                                               <div className={cn("font-bold", isLow ? "text-destructive" : "text-foreground")}><span className="font-medium">Qtd:</span> {p.quantity}</div>
                                                                               <div><span className="font-medium">Mín:</span> {p.min_quantity}</div>
                                                                           </div>
                                                                           <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mt-2">
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
                                                                   </div>
                                                               </div>
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
                                   Nenhum produto no estoque
                               </div>
                           )}
                      </div>
                      )}

                    {/* SEÇÃO PATRIMÔNIO */}
                    {activeTab === "patrimonio" && (
                    <div>
                    <PageHeader title="Patrimônio" description="Gerencie os ativos da empresa" />

                    {/* Total de Patrimônio */}
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-lg border border-border mb-6"
                    >
                    <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm text-muted-foreground mb-1">Valor Total do Patrimônio</p>
                    <p className="text-3xl font-bold text-primary">R$ {assets.reduce((sum, a) => sum + (a.value || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground mt-2">{assets.length} item(ns) registrado(s)</p>
                    </div>
                    <Dialog open={assetDialogOpen} onOpenChange={(open) => { if (!open) handleCloseAssetDialog(); else setAssetDialogOpen(true); }}>
                    <DialogTrigger asChild>
                    <Button className="gradient-primary text-primary-foreground font-semibold gap-2 glow-primary">
                    <Plus className="w-4 h-4" /> Novo Patrimônio
                    </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                    <DialogHeader>
                    <DialogTitle className="font-display">{editingAsset ? "Editar Patrimônio" : "Cadastrar Patrimônio"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                    <div>
                     <Label>Nome *</Label>
                     <Input
                       value={assetForm.name}
                       onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                       placeholder="Nome do patrimônio"
                     />
                    </div>
                    <div>
                     <Label>Tipo *</Label>
                     <Select value={assetForm.asset_type} onValueChange={(v: any) => setAssetForm({ ...assetForm, asset_type: v })}>
                       <SelectTrigger>
                         <SelectValue placeholder="Selecione..." />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Imóvel">Imóvel</SelectItem>
                         <SelectItem value="Veículo">Veículo</SelectItem>
                         <SelectItem value="Equipamento">Equipamento</SelectItem>
                         <SelectItem value="Outro">Outro</SelectItem>
                       </SelectContent>
                     </Select>
                    </div>
                    <div>
                     <Label>Observações</Label>
                     <Input
                       value={assetForm.notes}
                       onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                       placeholder="Detalhes adicionais"
                     />
                    </div>
                    <div>
                     <Label>Valor (R$) *</Label>
                     <Input
                       type="number"
                       step="0.01"
                       value={assetForm.value}
                       onChange={(e) => setAssetForm({ ...assetForm, value: e.target.value })}
                       placeholder="0.00"
                     />
                    </div>
                    <Button
                      onClick={editingAsset ? handleEditAsset : handleAddAsset}
                      disabled={submitting}
                      className="w-full gradient-primary text-primary-foreground font-semibold"
                     >
                      {submitting ? "Salvando..." : editingAsset ? "Atualizar" : "Cadastrar"}
                     </Button>
                    </div>
                    </DialogContent>
                    </Dialog>
                    </div>
                    </motion.div>

                    {/* Tabela de Patrimônio */}
                    {assets.length > 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-x-auto">
                    <table className="w-full">
                    <thead>
                    <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observações</th>
                    <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                    <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    <AnimatePresence>
                    {assets.map((asset) => (
                     <motion.tr
                       key={asset.id}
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                     >
                       <td className="p-4">
                         <p className="font-medium text-foreground">{asset.name}</p>
                       </td>
                       <td className="p-4">
                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
                           {asset.asset_type === "Imóvel" && "🏠"}
                           {asset.asset_type === "Veículo" && "🚗"}
                           {asset.asset_type === "Equipamento" && "🔧"}
                           {asset.asset_type === "Outro" && "📦"}
                           {" " + asset.asset_type}
                         </span>
                       </td>
                       <td className="p-4">
                         <p className="text-sm text-muted-foreground">{asset.notes || "—"}</p>
                       </td>
                       <td className="p-4 text-right">
                         <p className="font-semibold text-primary">R$ {asset.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                       </td>
                       <td className="p-4 text-center">
                         <div className="flex gap-2 justify-center">
                           <Button
                             size="sm"
                             variant="outline"
                             className="border-primary/30 text-primary hover:bg-primary/10"
                             onClick={() => openEditAssetDialog(asset)}
                           >
                             <Edit2 className="w-3 h-3" />
                           </Button>
                           <Button
                             size="sm"
                             variant="destructive"
                             onClick={() => openDeleteAssetConfirm(asset)}
                           >
                             <Trash2 className="w-3 h-3" />
                           </Button>
                         </div>
                       </td>
                     </motion.tr>
                    ))}
                    </AnimatePresence>
                    </tbody>
                    </table>
                    </motion.div>
                    ) : (
                    <div className="text-center py-12 text-muted-foreground glass-card">
                    Nenhum patrimônio cadastrado
                    </div>
                    )}

                    {/* ALERTA DE CONFIRMAÇÃO - DELETE ASSET */}
                    <AlertDialog open={assetDeleteConfirmOpen} onOpenChange={setAssetDeleteConfirmOpen}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Patrimônio</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover <strong>{assetToDelete?.name}</strong>? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAsset} className="bg-destructive hover:bg-destructive/90">
                          Remover
                        </AlertDialogAction>
                      </AlertDialogContent>
                    </AlertDialog>

                    </div>
                    )}

                    {/* SEÇÃO FINANCEIRO */}
      {activeTab === "financial" && (
        <div className="space-y-8">
          {/* FILTROS */}
          <div className="glass-card p-4 border border-border rounded-lg flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Período:</Label>
              <Select defaultValue="current_month">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Este Mês</SelectItem>
                  <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                  <SelectItem value="current_year">Este Ano</SelectItem>
                  <SelectItem value="all_time">Todo o Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SEÇÃO DE RESUMO - CONSOLIDADO DO SISTEMA */}
          <div className="glass-card border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-foreground">📊 Resumo Consolidado do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total de Vendas (vindo da aba Vendas) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-lg border border-success/30 bg-gradient-to-br from-success/10 to-transparent"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">💰 Total de Vendas</p>
                    <p className="text-2xl font-bold text-success">R$ {(
                      sales.reduce((sum, s) => sum + (s.amount || 0), 0)
                    ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </motion.div>

              {/* Valor Total em Estoque (vindo da aba Inventário) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-4 rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">📦 Valor Total em Estoque</p>
                    <p className="text-2xl font-bold text-orange-500">R$ {totalInventoryValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </motion.div>

              {/* Top Categoria (vindo da aba Inventário) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-4 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">🏆 Top Categoria</p>
                    <p className="text-lg font-bold text-foreground">{topCategory?.[0] || "—"}</p>
                    <p className="text-sm text-primary mt-1">R$ {topCategory?.[1]?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0"}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* KPI CARDS - RESUMO EXECUTIVO */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Total Receitas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-lg border border-success/30 bg-gradient-to-br from-success/10 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">💰 Receitas</p>
                  <p className="text-2xl font-bold text-success">R$ {(
                    sales.reduce((sum, s) => sum + (s.amount || 0), 0)
                  ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground mt-1">Vendas de Produtos</p>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Total Despesas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 rounded-lg border border-destructive/30 bg-gradient-to-br from-destructive/10 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">💸 Despesas</p>
                  <p className="text-2xl font-bold text-destructive">R$ {(
                    expenses.reduce((sum, e) => sum + (e.amount || 0), 0) +
                    employees.reduce((sum, e) => sum + (e.salary || 0), 0)
                  ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground mt-1">Salários + Compras</p>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Lucro Líquido */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">📈 Lucro Líquido</p>
                  <p className="text-2xl font-bold text-primary">R$ {(
                    sales.reduce((sum, s) => sum + (s.amount || 0), 0) -
                    (expenses.reduce((sum, e) => sum + (e.amount || 0), 0) + employees.reduce((sum, e) => sum + (e.salary || 0), 0))
                  ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground mt-1">Vendas - Despesas - Salários</p>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Patrimônio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">💎 Patrimônio</p>
                  <p className="text-2xl font-bold text-cyan-500">R$ {assets.reduce((sum, a) => sum + (a.value || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground mt-1">{assets.length} assets</p>
                </div>
              </div>
            </motion.div>

            {/* Card 5: Estoque */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">📦 Estoque</p>
                  <p className="text-2xl font-bold text-orange-500">R$ {totalInventoryValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground mt-1">{products.length} produtos</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ABAS DE TABELAS DETALHADAS */}
          <div className="glass-card border border-border rounded-lg">
            <div className="border-b border-border">
              <div className="flex gap-0 overflow-x-auto">
                <button
                  onClick={() => setActiveFinancialTab("receitas")}
                  className={cn(
                    "px-6 py-3 text-sm font-semibold border-b-2 transition-colors",
                    activeFinancialTab === "receitas"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  💰 Receitas
                </button>
                <button
                  onClick={() => setActiveFinancialTab("despesas")}
                  className={cn(
                    "px-6 py-3 text-sm font-semibold border-b-2 transition-colors",
                    activeFinancialTab === "despesas"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  💸 Despesas
                </button>
                <button
                  onClick={() => setActiveFinancialTab("patrimonio")}
                  className={cn(
                    "px-6 py-3 text-sm font-semibold border-b-2 transition-colors",
                    activeFinancialTab === "patrimonio"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  💎 Patrimônio
                </button>
                <button
                   onClick={() => setActiveFinancialTab("estoque")}
                   className={cn(
                     "px-6 py-3 text-sm font-semibold border-b-2 transition-colors",
                     activeFinancialTab === "estoque"
                       ? "border-primary text-primary"
                       : "border-transparent text-muted-foreground hover:text-foreground"
                   )}
                 >
                   📦 Estoque
                 </button>
                 <button
                   onClick={() => setActiveFinancialTab("vendas")}
                   className={cn(
                     "px-6 py-3 text-sm font-semibold border-b-2 transition-colors",
                     activeFinancialTab === "vendas"
                       ? "border-primary text-primary"
                       : "border-transparent text-muted-foreground hover:text-foreground"
                   )}
                 >
                   🛒 Vendas
                 </button>
                </div>
                </div>

            <div className="p-6">
              {/* TAB: RECEITAS */}
              {activeFinancialTab === "receitas" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Receitas Detalhadas</h3>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-success">R$ 0,00</p>
                    </div>
                  </div>
                  <div className="bg-secondary/20 p-8 rounded-lg text-center text-muted-foreground text-sm">
                    Integração com serviços em desenvolvimento
                  </div>
                </div>
              )}

              {/* TAB: DESPESAS */}
              {activeFinancialTab === "despesas" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Despesas Detalhadas</h3>
                    <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2 gradient-primary">
                          <Plus className="w-4 h-4" /> Adicionar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle className="font-display">Adicionar Despesa</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Descrição *</Label>
                            <Input
                              value={expenseForm.description}
                              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                              placeholder="Ex: Compra de vidros..."
                            />
                          </div>
                          <div>
                            <Label>Categoria</Label>
                            <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Compra">Compra de Produtos</SelectItem>
                                <SelectItem value="Funcionário">Salário Funcionário</SelectItem>
                                <SelectItem value="Aluguel">Aluguel</SelectItem>
                                <SelectItem value="Utilitários">Utilitários</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Valor (R$) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={expenseForm.amount}
                              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label>Observações</Label>
                            <Input
                              value={expenseForm.notes}
                              onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                              placeholder="Notas opcionais..."
                            />
                          </div>
                          <Button
                            onClick={handleAddExpense}
                            disabled={submitting}
                            className="w-full gradient-primary text-primary-foreground font-semibold"
                          >
                            {submitting ? "Salvando..." : "Adicionar Despesa"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Data</th>
                          <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Categoria</th>
                          <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Descrição</th>
                          <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">
                              Nenhuma despesa registrada
                            </td>
                          </tr>
                        ) : (
                          <>
                            {expenses.map((exp) => (
                              <motion.tr
                                key={exp.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                              >
                                <td className="p-3 text-muted-foreground">{new Date(exp.expense_date).toLocaleDateString("pt-BR")}</td>
                                <td className="p-3 text-foreground font-medium">{exp.category}</td>
                                <td className="p-3 text-foreground">{exp.description}</td>
                                <td className="p-3 text-right font-bold text-destructive">R$ {exp.amount?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                              </motion.tr>
                            ))}
                            <tr className="border-t-2 border-primary/30 bg-primary/5">
                              <td colSpan={3} className="p-3 text-right font-semibold">TOTAL:</td>
                              <td className="p-3 text-right font-bold text-destructive text-lg">
                                R$ {expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: PATRIMÔNIO */}
              {activeFinancialTab === "patrimonio" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Patrimônio (Assets)</h3>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-cyan-500">R$ {assets.reduce((sum, a) => sum + (a.value || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  {assets.length === 0 ? (
                    <div className="bg-secondary/20 p-8 rounded-lg text-center text-muted-foreground text-sm">
                      Nenhum ativo registrado
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Nome</th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Tipo</th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Data Aquisição</th>
                            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assets.map((asset) => (
                            <motion.tr
                              key={asset.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                            >
                              <td className="p-3 text-foreground font-medium">{asset.name}</td>
                              <td className="p-3 text-foreground">{asset.asset_type}</td>
                              <td className="p-3 text-muted-foreground">{new Date(asset.acquisition_date || "").toLocaleDateString("pt-BR")}</td>
                              <td className="p-3 text-right font-bold text-cyan-500">R$ {asset.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                            </motion.tr>
                          ))}
                          <tr className="border-t-2 border-primary/30 bg-primary/5">
                            <td colSpan={3} className="p-3 text-right font-semibold">TOTAL PATRIMÔNIO:</td>
                            <td className="p-3 text-right font-bold text-cyan-500 text-lg">
                              R$ {assets.reduce((sum, a) => sum + (a.value || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: ESTOQUE */}
              {activeFinancialTab === "estoque" && (
                 <div>
                     {/* Cards de Resumo */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                         {/* Total de Produtos */}
                         <motion.div
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="glass-card p-6 rounded-lg border border-border"
                         >
                             <div className="flex items-center justify-between">
                                 <div>
                                     <p className="text-sm text-muted-foreground mb-1">Total de Produtos</p>
                                     <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
                                 </div>
                                 <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
                                     <Barcode className="w-6 h-6 text-primary" />
                                 </div>
                             </div>
                         </motion.div>

                         {/* Produtos com Baixo Estoque */}
                         <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.1 }}
                           className="glass-card p-6 rounded-lg border border-border"
                         >
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="text-sm text-muted-foreground mb-1">Baixo Estoque</p>
                               <p className={cn("text-3xl font-bold", lowStockProducts.length > 0 ? "text-destructive" : "text-foreground")}>
                                 {lowStockProducts.length}
                               </p>
                               {lowStockProducts.length > 0 && (
                                 <div className="mt-2 space-y-1">
                                   {lowStockProducts.slice(0, 2).map(p => (
                                     <p key={p.id} className="text-xs text-destructive">• {p.name}</p>
                                   ))}
                                   {lowStockProducts.length > 2 && (
                                     <p className="text-xs text-muted-foreground">+{lowStockProducts.length - 2} mais</p>
                                   )}
                                 </div>
                               )}
                             </div>
                             <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", lowStockProducts.length > 0 ? "bg-destructive/15" : "bg-success/15")}>
                               <AlertTriangle className={cn("w-6 h-6", lowStockProducts.length > 0 ? "text-destructive" : "text-success")} />
                             </div>
                           </div>
                         </motion.div>
                         </div>

                         {/* Cards Adicionais de Análise */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                         {/* Produto Mais Estocado */}
                         {mostStockedProduct && (
                           <motion.div
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 0.4 }}
                             className="glass-card p-4 rounded-lg border border-border"
                           >
                             <p className="text-xs text-muted-foreground mb-2">Maior Quantidade</p>
                             <p className="font-semibold text-foreground truncate text-sm">{mostStockedProduct.name}</p>
                             <p className="text-lg font-bold text-primary mt-1">{mostStockedProduct.quantity} unid.</p>
                             <p className="text-xs text-muted-foreground mt-1">{mostStockedProduct.category}</p>
                           </motion.div>
                         )}

                         {/* Produto Menos Estocado */}
                         {leastStockedProduct && (
                           <motion.div
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 0.5 }}
                             className={cn("glass-card p-4 rounded-lg border", leastStockedProduct.quantity <= (leastStockedProduct.min_quantity || 1) ? "border-destructive/50 bg-destructive/5" : "border-border")}
                           >
                             <p className="text-xs text-muted-foreground mb-2">Menor Quantidade</p>
                             <p className={cn("font-semibold truncate text-sm", leastStockedProduct.quantity <= (leastStockedProduct.min_quantity || 1) ? "text-destructive" : "text-foreground")}>
                               {leastStockedProduct.name}
                             </p>
                             <p className={cn("text-lg font-bold mt-1", leastStockedProduct.quantity <= (leastStockedProduct.min_quantity || 1) ? "text-destructive" : "text-primary")}>
                               {leastStockedProduct.quantity} unid.
                             </p>
                             <p className="text-xs text-muted-foreground mt-1">Mín: {leastStockedProduct.min_quantity || 1}</p>
                           </motion.div>
                         )}

                         {/* Produtos Mais Valiosos */}
                         <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.6 }}
                           className="glass-card p-4 rounded-lg border border-border"
                         >
                           <p className="text-xs text-muted-foreground mb-2">Top 3 Valiosos</p>
                           <div className="space-y-2">
                             {mostValuableProducts.map((p, idx) => (
                               <div key={p.id} className="flex items-center justify-between">
                                 <p className="text-xs text-muted-foreground flex-1 truncate">{idx + 1}. {p.name}</p>
                                 <p className="text-xs font-bold text-primary whitespace-nowrap ml-2">R$ {p.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                               </div>
                             ))}
                           </div>
                         </motion.div>
                         </div>

                     {/* Barra de Busca */}
                     <div className="mb-6 flex gap-4 justify-between items-center">
                         <div className="relative max-w-md flex-1">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                             <Input
                                 value={search}
                                 onChange={(e) => setSearch(e.target.value)}
                                 placeholder="Buscar por nome, código, categoria, fornecedor..."
                                 className="pl-10 bg-card border-border"
                             />
                         </div>
                     </div>

                     {/* Tabela de Produtos */}
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-x-auto">
                         <table className="w-full">
                             <thead>
                                 <tr className="border-b border-border">
                                     <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 <AnimatePresence>
                                     {products
                                          .filter(
                                              (p) =>
                                                  p.name.toLowerCase().includes(search.toLowerCase()) ||
                                                  p.category.toLowerCase().includes(search.toLowerCase()) ||
                                                  (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
                                                  (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase())) ||
                                                  (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
                                                  (p.store && p.store.toLowerCase().includes(search.toLowerCase()))
                                          )
                                         .map((p, i) => {
                                           const isLow = p.quantity <= (p.min_quantity || 1);
                                           const totalValue = p.quantity * p.price;
                                             return (
                                                 <motion.tr
                                                      key={p.id}
                                                      initial={{ opacity: 0 }}
                                                      animate={{ opacity: 1 }}
                                                      transition={{ delay: i * 0.03 }}
                                                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                                                  >
                                                      <td className="p-4" colSpan={10}>
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
                                                                      <div className="grid grid-cols-5 gap-4 text-xs text-muted-foreground mt-2">
                                                                          <div><span className="font-medium">Cat:</span> {p.category}</div>
                                                                          <div><span className="font-medium">Loja:</span> {p.store || "Loja 1"}</div>
                                                                          <div><span className="font-medium">Forn:</span> {p.supplier || "—"}</div>
                                                                          <div className={cn("font-bold", isLow ? "text-destructive" : "text-foreground")}><span className="font-medium">Qtd:</span> {p.quantity}</div>
                                                                          <div><span className="font-medium">Mín:</span> {p.min_quantity}</div>
                                                                      </div>
                                                                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mt-2">
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
                                                              </div>
                                                          </div>
                                                      </td>
                                                  </motion.tr>
                                             );
                                         })}
                                 </AnimatePresence>
                             </tbody>
                         </table>
                     </motion.div>

                     {products.filter(
                       (p) =>
                         p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.category.toLowerCase().includes(search.toLowerCase()) ||
                         (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
                         (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase())) ||
                         (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
                         (p.store && p.store.toLowerCase().includes(search.toLowerCase()))
                     ).length === 0 && (
                       <div className="text-center py-12 text-muted-foreground">
                         Nenhum produto encontrado
                       </div>
                     )}
                 </div>
                 )}

                  {/* TAB: VENDAS */}
                  {activeFinancialTab === "vendas" && (
                  <div className="space-y-4">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-semibold">Histórico de Vendas</h3>
                     <div className="text-right">
                       <p className="text-xs text-muted-foreground">Total em Vendas</p>
                       <p className="text-xl font-bold text-success">R$ {sales.reduce((sum, s) => sum + (s.amount || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                     </div>
                   </div>

                   {sales.length === 0 ? (
                     <div className="bg-secondary/20 p-8 rounded-lg text-center text-muted-foreground text-sm">
                       Nenhuma venda registrada ainda
                     </div>
                   ) : (
                     <div className="overflow-x-auto">
                       <table className="w-full text-sm">
                         <thead>
                           <tr className="border-b border-border">
                             <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Data</th>
                             <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Produto</th>
                             <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Tipo</th>
                             <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Valor</th>
                             <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Observações</th>
                           </tr>
                         </thead>
                         <tbody>
                           {sales.map((sale) => (
                             <motion.tr
                               key={sale.id}
                               initial={{ opacity: 0 }}
                               animate={{ opacity: 1 }}
                               className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                             >
                               <td className="p-3 text-foreground">{new Date(sale.sale_date).toLocaleDateString("pt-BR")}</td>
                               <td className="p-3 text-foreground font-medium">{sale.description}</td>
                               <td className="p-3 text-muted-foreground capitalize">{sale.sale_type}</td>
                               <td className="p-3 text-right font-bold text-success">R$ {(sale.amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                               <td className="p-3 text-muted-foreground text-xs">{sale.notes || "-"}</td>
                             </motion.tr>
                           ))}
                           <tr className="border-t-2 border-primary/30 bg-primary/5">
                             <td colSpan={3} className="p-3 text-right font-semibold">TOTAL VENDAS:</td>
                             <td className="p-3 text-right font-bold text-success text-lg">
                               R$ {sales.reduce((sum, s) => sum + (s.amount || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                             </td>
                             <td></td>
                           </tr>
                         </tbody>
                       </table>
                     </div>
                   )}
                  </div>
                  )}
                  </div>
                  </div>

                  {/* RESUMO FUNCIO: SALÁRIOS */}
          <div className="glass-card p-6 border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">👥 Folha de Pagamento (Salários)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Funcionário</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Cargo</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Salário</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">
                        Nenhum funcionário cadastrado
                      </td>
                    </tr>
                  ) : (
                    <>
                      {employees.map((emp) => (
                        <motion.tr
                          key={emp.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                        >
                          <td className="p-3 text-foreground font-medium">{emp.name}</td>
                          <td className="p-3 text-foreground">{emp.role}</td>
                          <td className="p-3">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              emp.active
                                ? "bg-success/15 text-success"
                                : "bg-destructive/15 text-destructive"
                            )}>
                              {emp.active ? "✓ Ativo" : "✗ Inativo"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-destructive">R$ {(emp.salary || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        </motion.tr>
                      ))}
                      <tr className="border-t-2 border-primary/30 bg-primary/5">
                        <td colSpan={3} className="p-3 text-right font-semibold">TOTAL MENSAL:</td>
                        <td className="p-3 text-right font-bold text-destructive text-lg">
                          R$ {employees.reduce((sum, e) => sum + (e.salary || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* SEÇÃO COMISSÕES DE VENDEDORES */}
         {activeTab === "comissoes" && (
         <SalesCommissionsTab />
         )}
         
         {/* Financial Authentication Modal */}
         <FinancialAuthModal
           isOpen={financialAuthOpen}
           onAuthSuccess={() => {
             setFinancialAuthOpen(false);
             setFinancialAuthenticated(true);
             setActiveTab("financial");
           }}
           onClose={() => {
             setFinancialAuthOpen(false);
           }}
         />
         </div>
         );
         };
        
        export default AdminPanel;
