import { Calendar, TrendingUp, Users, CheckCircle, Clock, AlertCircle, Plus, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { mockReplacements } from "@/data/mockData";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Service } from "@/types";
import { mockEmployees } from "@/data/mockData";
import { logAction } from "@/lib/auditLog";

interface Employee {
    id: string;
    name: string;
    role: string;
    sales_count?: number;
    attendance_count?: number;
    installations_count?: number;
}

interface Client {
    id: string;
    name: string;
    vehicle: string;
    plate: string;
}

interface Appointment {
    id: string;
    client_id: string;
    client_name: string;
    service_type: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    notes?: string;
}

const Servicos = () => {
    const { session, loading: authLoading } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [actioningAppointmentId, setActioningAppointmentId] = useState<string | null>(null);
    const [isEmployee, setIsEmployee] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const { toast } = useToast();

    const [serviceForm, setServiceForm] = useState({
        clientId: "",
        clientType: "plano", // "plano" ou "avulso"
        serviceType: "",
        description: "",
        value: "",
        employeeId: "",
        installations: "",
        // Dados para cliente avulso
        clientName: "",
        clientVehicle: "",
        clientPlate: "",
    });

    const fetchData = async () => {
        try {
            const [empData, servData, clientData, aptData, userRoleData] = await Promise.all([
                supabase.from("employees").select("*").order("name", { ascending: false }),
                supabase.from("services").select("*").order("service_date", { ascending: false }),
                supabase.from("clients").select("id, name, vehicle, plate").order("name", { ascending: true }),
                supabase.from("appointments").select("*").order("scheduled_date", { ascending: true }),
                session?.user?.id ? supabase.from("user_roles").select("role").eq("user_id", session.user.id).single() : Promise.resolve({ data: null }),
            ]);

            if (empData.error) throw empData.error;
            if (servData.error) throw servData.error;
            if (clientData.error) throw clientData.error;
            if (aptData.error) throw aptData.error;

            // Verificar se o usuário atual é um funcionário ou admin
            if (session?.user?.email) {
                const empCheck = empData.data?.some((emp: any) => emp.email === session.user.email);
                const isAdmin = userRoleData?.data?.role === "admin";
                
                if (!empCheck && !isAdmin) {
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }
                setIsEmployee(true);
            }

            setEmployees(empData.data || []);
            setServices(servData.data || []);
            setAppointments(aptData.data || []);
            setClients(clientData.data || []);
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

    useEffect(() => {
        fetchData();
    }, []);

    const handleConfirmAppointment = async (appointmentId: string, appointment: Appointment) => {
        setActioningAppointmentId(appointmentId);
        try {
            const { error } = await supabase
                .from("appointments")
                .update({ status: "confirmado" })
                .eq("id", appointmentId);

            if (error) throw error;

            // Log da ação
            logAction("update", "appointments", appointmentId, appointment.client_name, `Agendamento confirmado: ${appointment.service_type} para ${new Date(appointment.scheduled_date).toLocaleDateString("pt-BR")} às ${appointment.scheduled_time}`);

            fetchData();
            toast({ title: "Agendamento confirmado!" });
        } catch (err: any) {
            toast({
                title: "Erro ao confirmar agendamento",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setActioningAppointmentId(null);
        }
    };

    const handleCompleteAppointment = async (appointmentId: string, appointment: Appointment) => {
        setActioningAppointmentId(appointmentId);
        try {
            // Atualizar status do agendamento
            const { error: updateError } = await supabase
                .from("appointments")
                .update({ status: "concluído" })
                .eq("id", appointmentId);

            if (updateError) throw updateError;

            // Registrar a troca na tabela replacements
            const { error: replError } = await supabase
                .from("replacements")
                .insert({
                    client_id: appointment.client_id,
                    client_name: appointment.client_name,
                    item: appointment.service_type,
                    date: new Date().toISOString().split("T")[0],
                    employee_id: employees[0]?.id || null, // Usar primeiro funcionário como padrão
                    employee_name: employees[0]?.name || "Não definido",
                    notes: appointment.notes || "",
                });

            if (replError) throw replError;

            // Log da ação
            logAction("register", "replacements", appointmentId, appointment.client_name, `Agendamento concluído e troca registrada: ${appointment.service_type}`);

            fetchData();
            toast({ title: "Serviço concluído e troca registrada!" });
        } catch (err: any) {
            toast({
                title: "Erro ao concluir agendamento",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setActioningAppointmentId(null);
        }
    };

    const handleAddService = async () => {
        if (!serviceForm.serviceType || !serviceForm.employeeId) {
            toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const employee = employees.find((e) => e.id === serviceForm.employeeId);

            if (!employee) {
                toast({ title: "Funcionário não encontrado", variant: "destructive" });
                return;
            }

            let clientId = serviceForm.clientId;
            let clientName = "";
            let clientVehicle = "";
            let clientPlate = "";

            // Se é cliente avulso, criar novo cliente
            if (serviceForm.clientType === "avulso") {
                if (!serviceForm.clientName || !serviceForm.clientPlate) {
                    toast({ title: "Para cliente avulso, preencha nome e placa", variant: "destructive" });
                    return;
                }

                const clientData = {
                    name: serviceForm.clientName,
                    vehicle: serviceForm.clientVehicle || "Veículo",
                    plate: serviceForm.clientPlate,
                    phone: "",
                    email: `avulso-${serviceForm.clientPlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@clubedovidro.local`,
                    plan_start: new Date().toISOString().split("T")[0],
                    plan_end: new Date().toISOString().split("T")[0],
                };

                console.log("Criando cliente avulso:", clientData);

                const { data: newClient, error: clientError } = await supabase
                    .from("clients")
                    .insert(clientData)
                    .select()
                    .single();

                console.log("Resposta do servidor:", { newClient, clientError });

                if (clientError) {
                    console.error("Erro ao criar cliente:", clientError);
                    throw new Error(`Erro ao criar cliente: ${clientError.message}`);
                }

                clientId = newClient.id;
                clientName = newClient.name;
                clientVehicle = newClient.vehicle;
                clientPlate = newClient.plate;
            } else {
                // Cliente de plano
                if (!serviceForm.clientId) {
                    toast({ title: "Selecione um cliente", variant: "destructive" });
                    return;
                }

                const client = clients.find((c) => c.id === serviceForm.clientId);
                if (!client) {
                    toast({ title: "Cliente não encontrado", variant: "destructive" });
                    return;
                }

                clientName = client.name;
                clientVehicle = client.vehicle;
                clientPlate = client.plate;
            }

            const { data, error } = await supabase
                .from("services")
                .insert({
                    client_id: clientId,
                    client_name: clientName,
                    vehicle: clientVehicle,
                    plate: clientPlate,
                    service_type: serviceForm.serviceType,
                    description: serviceForm.description,
                    value: parseFloat(serviceForm.value) || 0,
                    employee_id: serviceForm.employeeId,
                    employee_name: employee.name,
                    installations: parseInt(serviceForm.installations) || 0,
                    service_date: new Date().toISOString().split("T")[0],
                })
                .select();

            if (error) throw error;

            if (data) {
                setServices([data[0], ...services]);
                
                // Log da ação
                logAction("create", "services", data[0].id, clientName, `Serviço: ${serviceForm.serviceType} - R$ ${serviceForm.value}`);
                
                // Sinaliza que houve uma nova venda para a aba de comissões atualizar
                localStorage.setItem('serviceCreated', new Date().toISOString());
                
                toast({ title: "Serviço registrado com sucesso!" });
                fetchData(); // Recarrega clientes
                setServiceForm({
                    clientId: "",
                    clientType: "plano",
                    serviceType: "",
                    description: "",
                    value: "",
                    employeeId: "",
                    installations: "",
                    clientName: "",
                    clientVehicle: "",
                    clientPlate: "",
                });
                setDialogOpen(false);
            }
        } catch (error: any) {
            toast({
                title: "Erro ao registrar serviço",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Cálculos de índices de serviços
    const today = new Date().toISOString().split("T")[0];
    const todayServices = services.filter((s) => s.service_date === today);
    const totalServices = todayServices.length;
    const totalInstallations = employees.reduce((sum, e) => sum + (e.installations_count || 0), 0);
    const totalAttendances = employees.reduce((sum, e) => sum + (e.attendance_count || 0), 0);
    const totalSales = employees.reduce((sum, e) => sum + (e.sales_count || 0), 0);

    useEffect(() => {
        const checkMidnight = setInterval(() => {
            setServices([...services]);
        }, 1000);
        return () => clearInterval(checkMidnight);
    }, [services]);

    const recentServices = [...services]
        .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())
        .slice(0, 8);

    const topInstaller = employees.length > 0
        ? [...employees].sort((a, b) => (b.installations_count || 0) - (a.installations_count || 0))[0]
        : null;

    const topAttendant = employees.length > 0
        ? [...employees].sort((a, b) => (b.attendance_count || 0) - (a.attendance_count || 0))[0]
        : null;

    const topSeller = employees.length > 0
         ? [...employees].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))[0]
         : null;

    // Top 3 funcionários mais serviços (todos os tempos)
    const employeeServices = services.reduce((acc: { [key: string]: number }, service) => {
        acc[service.employee_name] = (acc[service.employee_name] || 0) + 1;
        return acc;
    }, {});

    const top3Employees = Object.entries(employeeServices)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

    // Top 3 funcionários de hoje
    const todayEmployeeServices = todayServices.reduce((acc: { [key: string]: number }, service) => {
        acc[service.employee_name] = (acc[service.employee_name] || 0) + 1;
        return acc;
    }, {});

    const top3EmployeesToday = Object.entries(todayEmployeeServices)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary">
                        <Calendar className="w-6 h-6 text-primary-foreground" />
                    </div>
                </div>
            </div>
        );
    }

    if (accessDenied) {
        return <Navigate to="/client-dashboard" replace />;
    }

    return (
        <div>
            <PageHeader title="Serviços" description="Agendamentos e índices de desempenho" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* LADO ESQUERDO - AGENDAMENTOS */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0 }}
                        className="glass-card p-4 md:p-6 rounded-lg border border-border"
                    >
                        <h2 className="text-base md:text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Agendamentos
                        </h2>
                        <div className="space-y-3 max-h-96 md:max-h-screen overflow-y-auto">
                            {appointments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhum agendamento pendente</p>
                            ) : (
                                appointments
                                    .filter((apt) => apt.status !== "cancelado")
                                    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                                    .slice(0, 10)
                                    .map((apt) => {
                                        const borderColor = apt.status === "pendente" ? "border-amber-500" : apt.status === "confirmado" ? "border-blue-500" : "border-green-500";
                                        const bgColor = apt.status === "pendente" ? "bg-amber-50 dark:bg-amber-950/20" : apt.status === "confirmado" ? "bg-blue-50 dark:bg-blue-950/20" : "bg-green-50 dark:bg-green-950/20";
                                        return (
                                        <div key={apt.id} className={`p-2 md:p-3 rounded-lg ${bgColor} hover:opacity-80 transition-all border-l-4 ${borderColor}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-foreground truncate">{apt.client_name}</p>
                                                    <p className="text-xs text-muted-foreground">📋 {apt.service_type}</p>
                                                    {apt.notes && <p className="text-xs text-muted-foreground mt-1">💬 {apt.notes}</p>}
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        📅 {new Date(apt.scheduled_date).toLocaleDateString("pt-BR")} ⏰ {apt.scheduled_time}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-1 flex-shrink-0">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${apt.status === "pendente" ? "bg-amber-100 text-amber-700" : apt.status === "confirmado" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                                        {apt.status === "pendente" ? "⏳ Pendente" : apt.status === "confirmado" ? "⏱️ Confirmado" : "✓ Concluído"}
                                                    </span>
                                                    {apt.status === "pendente" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs h-7"
                                                            onClick={() => handleConfirmAppointment(apt.id, apt)}
                                                            disabled={actioningAppointmentId === apt.id}
                                                        >
                                                            <Check className="w-3 h-3" /> Confirmar
                                                        </Button>
                                                    )}
                                                    {apt.status === "confirmado" && (
                                                        <Button
                                                            size="sm"
                                                            className="text-xs h-7 bg-success hover:bg-success/90"
                                                            onClick={() => handleCompleteAppointment(apt.id, apt)}
                                                            disabled={actioningAppointmentId === apt.id}
                                                        >
                                                            <CheckCircle className="w-3 h-3" /> Concluir
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* LADO DIREITO - ÍNDICES DE SERVIÇOS */}
                <div className="space-y-4 md:space-y-6">
                    {/* Cards de Resumo */}
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-3 md:p-4 rounded-lg border border-border relative"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground mb-1">Total de Serviços</p>
                                    <p className="text-xl md:text-2xl font-bold text-primary">{totalServices}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Hoje - {new Date().toLocaleDateString("pt-BR")}</p>
                                </div>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            className="h-8 w-8 p-0 bg-primary hover:bg-primary/80 flex-shrink-0 ml-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-border">
                                        <DialogHeader>
                                            <DialogTitle className="font-display">Registrar Novo Serviço</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                        <div>
                                            <Label>Tipo de Cliente *</Label>
                                            <Select value={serviceForm.clientType} onValueChange={(v) => setServiceForm({ ...serviceForm, clientType: v as "plano" | "avulso", clientId: "", clientName: "", clientVehicle: "", clientPlate: "" })}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="plano">Cliente de Plano</SelectItem>
                                                    <SelectItem value="avulso">Cliente Avulso</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {serviceForm.clientType === "plano" ? (
                                            <div>
                                                <Label>Cliente *</Label>
                                                <Select value={serviceForm.clientId} onValueChange={(v) => setServiceForm({ ...serviceForm, clientId: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {clients.map((client) => (
                                                            <SelectItem key={client.id} value={client.id}>
                                                                {client.name} ({client.plate})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <Label>Nome do Cliente *</Label>
                                                    <Input
                                                        value={serviceForm.clientName}
                                                        onChange={(e) => setServiceForm({ ...serviceForm, clientName: e.target.value })}
                                                        placeholder="Nome completo"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label>Veículo</Label>
                                                        <Input
                                                            value={serviceForm.clientVehicle}
                                                            onChange={(e) => setServiceForm({ ...serviceForm, clientVehicle: e.target.value })}
                                                            placeholder="Modelo"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Placa *</Label>
                                                        <Input
                                                            value={serviceForm.clientPlate}
                                                            onChange={(e) => setServiceForm({ ...serviceForm, clientPlate: e.target.value })}
                                                            placeholder="ABC-1234"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <Label>Tipo de Serviço *</Label>
                                            <Input
                                                value={serviceForm.serviceType}
                                                onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value })}
                                                placeholder="Ex: Instalação, Polimento, etc"
                                            />
                                        </div>
                                        <div>
                                            <Label>O que foi feito</Label>
                                            <Input
                                                value={serviceForm.description}
                                                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                                placeholder="Descrição detalhada do serviço"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>Valor (R$)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={serviceForm.value}
                                                    onChange={(e) => setServiceForm({ ...serviceForm, value: e.target.value })}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <Label>Instalações</Label>
                                                <Input
                                                    type="number"
                                                    value={serviceForm.installations}
                                                    onChange={(e) => setServiceForm({ ...serviceForm, installations: e.target.value })}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Funcionário *</Label>
                                            <Select value={serviceForm.employeeId} onValueChange={(v) => setServiceForm({ ...serviceForm, employeeId: v })}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    {employees.filter((e) => e).map((emp) => (
                                                        <SelectItem key={emp.id} value={emp.id}>
                                                            {emp.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            onClick={handleAddService}
                                            disabled={submitting}
                                            className="w-full gradient-primary text-primary-foreground font-semibold"
                                        >
                                            {submitting ? "Registrando..." : "Registrar Serviço"}
                                        </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </motion.div>

                        {/* Top 3 de Hoje */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card p-3 md:p-4 rounded-lg border border-border"
                        >
                            <h3 className="text-base md:text-lg font-display font-semibold text-foreground mb-3">🏆 Top</h3>
                            <div className="space-y-2">
                                {top3EmployeesToday.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-2">Nenhum serviço hoje</p>
                                ) : (
                                    top3EmployeesToday.map((employee, idx) => (
                                        <div key={idx} className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">#{idx + 1}</p>
                                                    <p className="text-xs font-semibold text-foreground">{employee.name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-primary">{employee.count}</p>
                                                    <p className="text-xs text-muted-foreground">serviços</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                        </div>

                        {/* Top Performers */}
                        <motion.div
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.3 }}
                         className="glass-card p-3 md:p-6 rounded-lg border border-border"
                        >
                         <h3 className="text-base md:text-lg font-display font-semibold text-foreground mb-3 md:mb-4">🏆 Geral</h3>

                        <div className="space-y-3">
                            {top3Employees.map((employee, idx) => (
                                <div key={idx} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">#{idx + 1}</p>
                                            <p className="text-sm font-semibold text-foreground">{employee.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-primary">{employee.count}</p>
                                            <p className="text-xs text-muted-foreground">serviços</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default Servicos;
