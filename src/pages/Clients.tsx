import { useState, useEffect } from "react";
import { Plus, Search, UserCheck, UserX, Repeat, Edit2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import ClientStatusBadge from "@/components/ClientStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, Replacement } from "@/types";
import { mockReplacements as initialReplacements, mockEmployees, replacementItems } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/auditLog";

const Clients = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [replacements, setReplacements] = useState<Replacement[]>([]);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [replDialogOpen, setReplDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewedClient, setViewedClient] = useState<Client | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const { toast } = useToast();

    // Fetch clients, employees and replacements from Supabase
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, employeesRes] = await Promise.all([
                    supabase
                        .from("clients")
                        .select("*")
                        .order("created_at", { ascending: false }),
                    supabase
                        .from("employees")
                        .select("*")
                        .eq("active", true)
                        .order("name", { ascending: true }),
                ]);

                if (clientsRes.error) throw clientsRes.error;
                if (employeesRes.error) throw employeesRes.error;

                if (clientsRes.data) {
                    const mappedClients: Client[] = clientsRes.data.map((client: any) => ({
                        id: client.id,
                        name: client.name,
                        phone: client.phone,
                        email: client.email,
                        cpf: client.cpf,
                        vehicle: client.vehicle,
                        plate: client.plate,
                        planStart: client.plan_start,
                        planEnd: client.plan_end,
                        replacementsUsed: client.replacements_used || 0,
                        maxReplacements: client.max_replacements || 3,
                        active: client.active || true,
                        planActive: client.plan_active !== false, // Padrão true se não existir
                    }));
                    setClients(mappedClients);
                }

                if (employeesRes.data) {
                    setEmployees(employeesRes.data);
                }
            } catch (error: any) {
                console.error("Erro ao carregar dados:", error);
                toast({
                    title: "Erro ao carregar dados",
                    description: error.message,
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        fetchReplacements();
    }, []);

    const [form, setForm] = useState({ name: "", phone: "", email: "", cpf: "", vehicle: "", plate: "", password: "" });
    const [replForm, setReplForm] = useState({ item: "", employeeId: "", notes: "", value: "" });
    const [submitting, setSubmitting] = useState(false);

    const fetchClients = async (): Promise<Client[]> => {
        try {
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedClients: Client[] = data.map((client: any) => ({
                    id: client.id,
                    name: client.name,
                    phone: client.phone,
                    email: client.email,
                    cpf: client.cpf,
                    vehicle: client.vehicle,
                    plate: client.plate,
                    planStart: client.plan_start,
                    planEnd: client.plan_end,
                    replacementsUsed: client.replacements_used || 0,
                    maxReplacements: client.max_replacements || 3,
                    active: client.active || true,
                    planActive: client.plan_active !== false,
                }));
                setClients(mappedClients);
                return mappedClients;
            }
            return [];
        } catch (error: any) {
            console.error("Erro ao buscar clientes:", error);
            return [];
        }
    };

    const fetchReplacements = async () => {
        try {
            const { data, error } = await supabase
                .from("replacements")
                .select("*")
                .order("date", { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedReplacements: Replacement[] = data.map((r: any) => ({
                    id: r.id,
                    clientId: r.client_id,
                    clientName: r.client_name,
                    item: r.item,
                    date: r.date,
                    employeeId: r.employee_id,
                    employeeName: r.employee_name,
                    notes: r.notes,
                }));
                setReplacements(mappedReplacements);
            }
        } catch (error: any) {
            console.error("Erro ao buscar trocas:", error);
        }
    };

    const filtered = clients.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.plate.toLowerCase().includes(search.toLowerCase()) ||
            c.vehicle.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddClient = async () => {
        if (!form.name || !form.phone || !form.vehicle || !form.email) {
            toast({ title: "Preencha todos os campos obrigatórios (Email é obrigatório)", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            // 0. Validar se email ou CPF já existem
            console.log("🔍 Validando email e CPF...", { email: form.email, cpf: form.cpf });
            
            const [emailCheck, cpfCheck] = await Promise.all([
                supabase
                    .from("clients")
                    .select("id, email")
                    .eq("email", form.email)
                    .maybeSingle(),
                form.cpf ? supabase
                    .from("clients")
                    .select("id, cpf")
                    .eq("cpf", form.cpf)
                    .maybeSingle() : Promise.resolve({ data: null, error: null })
            ]);

            console.log("📋 Resultado da validação:", { emailCheck, cpfCheck });

            if (emailCheck.error) {
                console.warn("⚠️ Erro ao validar email:", emailCheck.error);
            }
            
            if (cpfCheck.error) {
                console.warn("⚠️ Erro ao validar CPF:", cpfCheck.error);
            }

            if (emailCheck.data) {
                console.warn("❌ Email duplicado:", form.email);
                toast({
                    title: "Email já cadastrado",
                    description: `O email "${form.email}" já existe no sistema.`,
                    variant: "destructive",
                });
                setSubmitting(false);
                return;
            }

            if (cpfCheck.data) {
                console.warn("❌ CPF duplicado:", form.cpf);
                toast({
                    title: "CPF já cadastrado",
                    description: `O CPF "${form.cpf}" já está associado a outro cliente.`,
                    variant: "destructive",
                });
                setSubmitting(false);
                return;
            }

            // Gerar senha padrão se não fornecida
            const password = form.password || `Cliente${form.phone.slice(-4)}`;

            // 1. Criar usuário no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: form.email,
                password: password,
                options: {
                    data: {
                        full_name: form.name,
                    },
                },
            });

            if (authError) throw new Error(`Erro ao criar usuário: ${authError.message}`);
            if (!authData.user?.id) throw new Error("User ID não retornado após signup");

            const userId = authData.user.id;

            const now = new Date();
            const end = new Date(now);
            end.setFullYear(end.getFullYear() + 1);
            const planStart = now.toISOString().split("T")[0];
            const planEnd = end.toISOString().split("T")[0];

            // 2. Inserir na tabela clients com user_id
            const { data, error } = await supabase
                .from("clients")
                .insert({
                    user_id: userId,
                    name: form.name,
                    phone: form.phone,
                    email: form.email,
                    cpf: form.cpf,
                    vehicle: form.vehicle,
                    plate: form.plate,
                    plan_start: planStart,
                    plan_end: planEnd,
                    replacements_used: 0,
                    max_replacements: 3,
                    active: true,
                })
                .select();

            if (error) throw error;

            if (data) {
                const newClient: Client = {
                    id: data[0].id,
                    name: data[0].name,
                    phone: data[0].phone,
                    email: data[0].email,
                    cpf: data[0].cpf,
                    vehicle: data[0].vehicle,
                    plate: data[0].plate,
                    planStart: data[0].plan_start,
                    planEnd: data[0].plan_end,
                    replacementsUsed: data[0].replacements_used || 0,
                    maxReplacements: data[0].max_replacements || 3,
                    active: data[0].active || true,
                };
                setClients([newClient, ...clients]);
            }

            setForm({ name: "", phone: "", email: "", cpf: "", vehicle: "", plate: "", password: "" });
            setDialogOpen(false);

            // Log da ação
            if (data && data[0]) {
                logAction("create", "clients", data[0].id, form.name, `Novo cliente: ${form.vehicle} (${form.plate}) - Email: ${form.email}`);
            }

            toast({
                title: "Cliente cadastrado com sucesso!",
                description: `Email: ${form.email} | Senha: ${password}`
            });
        } catch (error: any) {
            console.error("❌ Erro ao cadastrar cliente:", error);
            
            // Tratamento específico para duplicatas
            if (error.message?.includes("23505") || error.message?.includes("duplicate")) {
                if (error.message?.includes("cpf")) {
                    toast({
                        title: "CPF já cadastrado",
                        description: `O CPF "${form.cpf}" já existe no sistema.`,
                        variant: "destructive",
                    });
                } else if (error.message?.includes("email")) {
                    toast({
                        title: "Email já cadastrado",
                        description: `O email "${form.email}" já existe no sistema.`,
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Dado duplicado",
                        description: "Este email ou CPF já está cadastrado.",
                        variant: "destructive",
                    });
                }
            } else {
                toast({
                    title: "Erro ao cadastrar cliente",
                    description: error.message,
                    variant: "destructive",
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClient = async () => {
        if (!editingClient || !form.name || !form.phone || !form.vehicle) {
            toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from("clients")
                .update({
                    name: form.name,
                    phone: form.phone,
                    email: form.email,
                    cpf: form.cpf,
                    vehicle: form.vehicle,
                    plate: form.plate,
                })
                .eq("id", editingClient.id);

            if (error) throw error;

            // Se preencheu senha, atualizar no auth através da Edge Function
            if (form.password && form.password.length >= 6) {
                try {
                    // Get current session token
                    const { data } = await supabase.auth.getSession();
                    const token = data?.session?.access_token;

                    console.log("Token obtido:", token);

                    if (!token) {
                        throw new Error("Sessão expirada. Faça login novamente.");
                    }

                    const response = await fetch(
                        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-client-password`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                email: form.email,
                                password: form.password,
                            }),
                        }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.error || "Erro ao atualizar senha");
                    }

                    console.log("Resultado da atualização de senha:", result);
                } catch (passwordError: any) {
                    console.error("Erro ao atualizar senha:", passwordError);
                    toast({
                        title: "Erro ao atualizar senha",
                        description: passwordError.message,
                        variant: "destructive",
                    });
                    setSubmitting(false);
                    return;
                }
            }

            const updatedClients = clients.map((c) =>
                c.id === editingClient.id
                    ? {
                        ...c,
                        name: form.name,
                        phone: form.phone,
                        email: form.email,
                        cpf: form.cpf,
                        vehicle: form.vehicle,
                        plate: form.plate,
                    }
                    : c
            );
            setClients(updatedClients);
            setForm({ name: "", phone: "", email: "", cpf: "", vehicle: "", plate: "", password: "" });
            setEditingClient(null);
            setEditDialogOpen(false);

            // Log da ação
            logAction("update", "clients", editingClient.id, form.name, `Atualizado: ${form.vehicle} (${form.plate})`);

            toast({ title: "Cliente atualizado com sucesso!" });
        } catch (error: any) {
            toast({
                title: "Erro ao atualizar cliente",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const openEditDialog = (client: Client) => {
        setEditingClient(client);
        setForm({
            name: client.name,
            phone: client.phone,
            email: client.email || "",
            cpf: client.cpf || "",
            vehicle: client.vehicle,
            plate: client.plate || "",
            password: "",
        });
        setEditDialogOpen(true);
    };

    const togglePlanActive = async (client: Client) => {
        try {
            const newStatus = !client.planActive;
            const updateData: any = { plan_active: newStatus };

            // Se ativando o plano, atualizar data de término para 1 ano a partir de hoje
            if (newStatus) {
                const today = new Date();
                const nextYear = new Date(today);
                nextYear.setFullYear(nextYear.getFullYear() + 1);
                const planEnd = nextYear.toISOString().split("T")[0];
                updateData.plan_end = planEnd;
            }

            const { error } = await supabase
                .from("clients")
                .update(updateData)
                .eq("id", client.id);

            if (error) throw error;

            const updatedClients = clients.map((c) =>
                c.id === client.id
                    ? {
                        ...c,
                        planActive: newStatus,
                        planEnd: updateData.plan_end || c.planEnd
                    }
                    : c
            );
            setClients(updatedClients);

            // Log da ação
            logAction("update", "clients", client.id, client.name, newStatus ? "Plano ativado (válido por 1 ano)" : "Plano desativado");

            toast({
                title: newStatus ? "Plano ativado! Válido por 1 ano." : "Plano desativado!",
                variant: newStatus ? "default" : "destructive",
            });
        } catch (error: any) {
            toast({
                title: "Erro ao atualizar plano",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleAddReplacement = async () => {
        if (!selectedClient || !replForm.item || !replForm.employeeId) {
            toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
            return;
        }
        if (selectedClient.replacementsUsed >= selectedClient.maxReplacements) {
            toast({ title: "Cliente atingiu o limite de trocas!", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const emp = employees.find((e) => e.id === replForm.employeeId);

            // Inserir na tabela de serviços com informações completas
            const { error: serviceError } = await supabase
                .from("services")
                .insert({
                    client_id: selectedClient.id,
                    client_name: selectedClient.name,
                    vehicle: selectedClient.vehicle,
                    plate: selectedClient.plate,
                    service_type: replForm.item,
                    description: replForm.notes,
                    value: parseFloat(replForm.value) || 0,
                    employee_id: replForm.employeeId,
                    employee_name: emp?.name || "",
                    installations: 1, // Marcando como 1 instalação ao registrar troca
                    service_date: new Date().toISOString().split("T")[0],
                });

            if (serviceError) throw serviceError;

            // Inserir na tabela de replacements (mantendo compatibilidade)
            const { data: replacementData, error: replacementError } = await supabase
                .from("replacements")
                .insert({
                    client_id: selectedClient.id,
                    client_name: selectedClient.name,
                    item: replForm.item,
                    date: new Date().toISOString().split("T")[0],
                    employee_id: replForm.employeeId,
                    employee_name: emp?.name || "",
                    notes: replForm.notes,
                })
                .select();

            if (replacementError) throw replacementError;

            // Log da ação
            if (replacementData && replacementData[0]) {
                logAction("register", "replacements", replacementData[0].id, selectedClient.name, `Item trocado: ${replForm.item} - Funcionário: ${emp?.name || "N/A"} - ${replForm.notes ? "Obs: " + replForm.notes : ""}`);
            }

            // Refetch trocas e clientes para garantir dados atualizados
            await Promise.all([fetchReplacements(), fetchClients()]);

            setReplForm({ item: "", employeeId: "", notes: "", value: "" });
            setReplDialogOpen(false);
            setSelectedClient(null);
            toast({ title: "Troca registrada com sucesso!" });
        } catch (error: any) {
            toast({
                title: "Erro ao registrar troca",
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
                        <UserCheck className="w-6 h-6 text-primary-foreground" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Clientes"
                description="Gestão de clientes e planos do Clube do Vidro"
                actions={
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gradient-primary text-primary-foreground font-semibold gap-2 glow-primary">
                                <Plus className="w-4 h-4" /> Novo Cliente
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                            <DialogHeader>
                                <DialogTitle className="font-display">Cadastrar Cliente</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" /></div>
                                    <div><Label>Telefone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(45) 99999-9999" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>E-mail *</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" /></div>
                                    <div><Label>Senha</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Deixar vazio para gerar automaticamente" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
                                    <div><Label>Veículo *</Label><Input value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} placeholder="Honda Civic 2022" /></div>
                                </div>
                                <div>
                                    <Label>Placa</Label>
                                    <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="ABC-1D23" />
                                </div>
                                <Button onClick={handleAddClient} disabled={submitting} className="w-full gradient-primary text-primary-foreground font-semibold">
                                    {submitting ? "Cadastrando..." : "Cadastrar"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome, veículo ou placa..."
                        className="pl-10 bg-card border-border"
                    />
                </div>
            </div>

            <div className="grid gap-4">
                <AnimatePresence>
                    {filtered.map((client, i) => {
                        const planEnd = new Date(client.planEnd);
                        const isExpired = planEnd < new Date();
                        return (
                            <motion.div
                                key={client.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card p-5"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${client.active && !isExpired ? "bg-success/15" : "bg-destructive/15"}`}>
                                            {client.active && !isExpired ? <UserCheck className="w-5 h-5 text-success" /> : <UserX className="w-5 h-5 text-destructive" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-foreground truncate">{client.name}</p>
                                                <ClientStatusBadge
                                                    planStatus={client.planActive ? "active" : "free"}
                                                    size="sm"
                                                />
                                            </div>
                                            <p className="text-sm text-muted-foreground">{client.vehicle} • {client.plate}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Telefone</p>
                                            <p className="text-xs md:text-sm text-foreground truncate">{client.phone}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Plano até</p>
                                            <p className={`text-xs md:text-sm font-medium ${isExpired ? "text-destructive" : "text-foreground"}`}>
                                                {planEnd.toLocaleDateString("pt-BR")}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Trocas</p>
                                            <div className="flex gap-1 mt-1 justify-center">
                                                {Array.from({ length: client.maxReplacements }).map((_, i) => {
                                                    let bgColor = "bg-slate-400";
                                                    if (client.planActive) {
                                                        if (i < client.replacementsUsed) {
                                                            bgColor = client.replacementsUsed === client.maxReplacements ? "bg-destructive" : "bg-red-500";
                                                        } else {
                                                            bgColor = "bg-primary";
                                                        }
                                                    }
                                                    return <div key={i} className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${bgColor}`} />;
                                                })}
                                            </div>
                                        </div>
                                        <div className="text-center hidden md:block">
                                            <p className="text-xs text-muted-foreground">Status</p>
                                            <p className={`text-xs md:text-sm font-medium ${client.planActive ? "text-success" : "text-destructive"}`}>
                                                {client.planActive ? "Ativo" : "Inativo"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 md:gap-3">
                                        <Button
                                            size="sm"
                                            variant={client.planActive ? "outline" : "destructive"}
                                            className="gap-1 text-xs md:text-sm flex-1 md:flex-none"
                                            onClick={() => togglePlanActive(client)}
                                        >
                                            {client.planActive ? "Ativo" : "Inativo"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="gap-1 text-xs md:text-sm flex-1 md:flex-none"
                                            onClick={() => { setViewedClient(client); setViewDialogOpen(true); }}
                                        >
                                            <Eye className="w-4 h-4" /> Ver
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="gap-1 text-xs md:text-sm flex-1 md:flex-none"
                                            onClick={() => openEditDialog(client)}
                                        >
                                            <Edit2 className="w-4 h-4" /> Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1 text-xs md:text-sm flex-1 md:flex-none border-primary/30 text-primary hover:bg-primary/10"
                                            disabled={client.replacementsUsed >= client.maxReplacements || isExpired || !client.planActive}
                                            onClick={() => { setSelectedClient(client); setReplDialogOpen(true); }}
                                        >
                                            <Repeat className="w-4 h-4" /> Troca
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* View Client Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="font-display">{viewedClient?.name}</DialogTitle>
                    </DialogHeader>
                    {viewedClient && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Nome</Label>
                                    <p className="font-semibold">{viewedClient.name}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                                    <p className="font-semibold">{viewedClient.phone}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">E-mail</Label>
                                    <p className="font-semibold">{viewedClient.email || "—"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">CPF</Label>
                                    <p className="font-semibold">{viewedClient.cpf || "—"}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Veículo</Label>
                                    <p className="font-semibold">{viewedClient.vehicle}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Placa</Label>
                                    <p className="font-semibold">{viewedClient.plate}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Plano de</Label>
                                    <p className="font-semibold">{new Date(viewedClient.planStart).toLocaleDateString("pt-BR")}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Plano até</Label>
                                    <p className="font-semibold">{new Date(viewedClient.planEnd).toLocaleDateString("pt-BR")}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Client Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="font-display">Editar Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" /></div>
                            <div><Label>Telefone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(45) 99999-9999" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" /></div>
                            <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Veículo *</Label><Input value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} placeholder="Honda Civic 2022" /></div>
                            <div><Label>Placa</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="ABC-1D23" /></div>
                        </div>
                        <div>
                            <Label>Nova Senha (deixe em branco para não alterar)</Label>
                            <Input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="Deixe vazio para não alterar"
                                minLength={6}
                                autoComplete="new-password"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Preencha apenas se deseja alterar a senha</p>
                        </div>
                        <Button onClick={handleEditClient} disabled={submitting} className="w-full gradient-primary text-primary-foreground font-semibold">{submitting ? "Salvando..." : "Salvar Alterações"}</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Replacement dialog */}
            <Dialog open={replDialogOpen} onOpenChange={setReplDialogOpen}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="font-display">Registrar Troca — {selectedClient?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Item trocado *</Label>
                            <Select value={replForm.item} onValueChange={(v) => setReplForm({ ...replForm, item: v })}>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>{replacementItems.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Funcionário responsável *</Label>
                            <Select value={replForm.employeeId} onValueChange={(v) => setReplForm({ ...replForm, employeeId: v })}>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Valor (R$)</Label>
                            <Input type="number" step="0.01" value={replForm.value} onChange={(e) => setReplForm({ ...replForm, value: e.target.value })} placeholder="0.00" />
                        </div>
                        <div>
                            <Label>Observações</Label>
                            <Input value={replForm.notes} onChange={(e) => setReplForm({ ...replForm, notes: e.target.value })} placeholder="Opcional..." />
                        </div>
                        <Button onClick={handleAddReplacement} disabled={submitting} className="w-full gradient-primary text-primary-foreground font-semibold">{submitting ? "Registrando..." : "Registrar Troca"}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Clients;
