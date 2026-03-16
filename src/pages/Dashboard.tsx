import { Calendar, TrendingUp, Users, CheckCircle, Clock, AlertCircle, Plus, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import ClientStatusBadge from "@/components/ClientStatusBadge";
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
     client_plan_status?: "free" | "active" | "expired";
     service_type: string;
     scheduled_date: string;
     scheduled_time: string;
     status: string;
     notes?: string;
     vehicle_id?: string;
     vehicle?: string;
     plate?: string;
     original_scheduled_date?: string;
     original_scheduled_time?: string;
     time_changed_at?: string;
     time_change_reason?: string;
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
    const [activeTab, setActiveTab] = useState<"pendentes" | "concluidos">("pendentes");
    const [completeAppointmentDialogOpen, setCompleteAppointmentDialogOpen] = useState(false);
    const [selectedEmployeeForCompletion, setSelectedEmployeeForCompletion] = useState("");
    const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);
    const [editAppointmentDialogOpen, setEditAppointmentDialogOpen] = useState(false);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [editAppointmentForm, setEditAppointmentForm] = useState({
        scheduled_date: "",
        scheduled_time: "",
        reason: "",
    });
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
            const [empData, servData, clientData, userRoleData] = await Promise.all([
                supabase.from("employees").select("*").order("name", { ascending: false }),
                supabase.from("services").select("*").order("service_date", { ascending: false }),
                supabase.from("clients").select("id, name, vehicle, plate").order("name", { ascending: true }),
                session?.user?.id ? supabase.from("user_roles").select("role").eq("user_id", session.user.id).single() : Promise.resolve({ data: null }),
            ]);

            // Fetch appointments with vehicle info and client plan status
             const aptData = await supabase
                 .from("appointments")
                 .select(`
                     id,
                     client_id,
                     client_name,
                     service_type,
                     scheduled_date,
                     scheduled_time,
                     status,
                     notes,
                     vehicle_id,
                     client_vehicles(vehicle, plate),
                     clients(plan_status)
                 `)
                 .order("scheduled_date", { ascending: true });

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

            // Map appointments to include vehicle info and client plan status
            const appointmentsWithVehicles = (aptData.data || []).map((apt: any) => ({
                ...apt,
                vehicle: apt.client_vehicles?.vehicle,
                plate: apt.client_vehicles?.plate,
                client_plan_status: apt.clients?.plan_status || "free",
            }));

            setEmployees(empData.data || []);
            setServices(servData.data || []);
            setAppointments(appointmentsWithVehicles);
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
            const vehicleInfo = appointment.vehicle ? ` - ${appointment.vehicle} (${appointment.plate})` : "";
            logAction("update", "appointments", appointmentId, appointment.client_name, `Agendamento confirmado: ${appointment.service_type}${vehicleInfo} para ${new Date(appointment.scheduled_date).toLocaleDateString("pt-BR")} às ${appointment.scheduled_time}`);

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

    const openCompleteAppointmentDialog = (appointment: Appointment) => {
        setAppointmentToComplete(appointment);
        setSelectedEmployeeForCompletion("");
        setCompleteAppointmentDialogOpen(true);
    };

    const handleCompleteAppointment = async () => {
        if (!appointmentToComplete || !selectedEmployeeForCompletion) {
            toast({ title: "Selecione um funcionário", variant: "destructive" });
            return;
        }

        const appointmentId = appointmentToComplete.id;
        const appointment = appointmentToComplete;
        const selectedEmployee = employees.find((e) => e.id === selectedEmployeeForCompletion);

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
                    employee_id: selectedEmployee?.id || null,
                    employee_name: selectedEmployee?.name || "Não definido",
                    notes: appointment.notes || "",
                });

            if (replError) throw replError;

            // Registrar também na tabela services para contar nos indicadores
            const { error: serviceError } = await supabase
                .from("services")
                .insert({
                    client_id: appointment.client_id,
                    client_name: appointment.client_name,
                    service_type: appointment.service_type,
                    service_date: new Date().toISOString().split("T")[0],
                    employee_id: selectedEmployee?.id || null,
                    employee_name: selectedEmployee?.name || "Não definido",
                    value: 0,
                    installations: 0,
                    notes: appointment.notes || "",
                });

            if (serviceError) throw serviceError;

            // Log da ação
            const vehicleInfoComplete = appointment.vehicle ? ` - ${appointment.vehicle} (${appointment.plate})` : "";
            logAction("register", "replacements", appointmentId, appointment.client_name, `Agendamento concluído e troca registrada: ${appointment.service_type}${vehicleInfoComplete} - Responsável: ${selectedEmployee?.name}`);

            setCompleteAppointmentDialogOpen(false);
             fetchData();
             toast({ title: "Serviço concluído e registrado com sucesso!" });
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

            const openEditAppointmentDialog = (appointment: Appointment) => {
            // Garantir formato correto da data (YYYY-MM-DD)
            const dateStr = typeof appointment.scheduled_date === 'string' 
                ? appointment.scheduled_date.split('T')[0] 
                : appointment.scheduled_date;
            
            setAppointmentToEdit(appointment);
            setEditAppointmentForm({
             scheduled_date: dateStr,
             scheduled_time: appointment.scheduled_time,
             reason: "",
            });
            setEditAppointmentDialogOpen(true);
            };

            const handleEditAppointment = async () => {
            if (!appointmentToEdit || !editAppointmentForm.scheduled_date || !editAppointmentForm.scheduled_time) {
             toast({ title: "Preencha data e hora", variant: "destructive" });
             return;
            }

            setActioningAppointmentId(appointmentToEdit.id);
            try {
             // Corrigir timezone: adicionar 1 dia à data
             const dateObj = new Date(editAppointmentForm.scheduled_date);
             dateObj.setDate(dateObj.getDate() + 1);
             const newDate = dateObj.toISOString().split('T')[0];
             
             console.log("📅 ANTES DE ENVIAR:");
             console.log("Input date do formulário:", editAppointmentForm.scheduled_date);
             console.log("Data corrigida com timezone:", newDate);
             
             // Se a data/hora mudou, atualizar com rastreamento
             const dateChanged = newDate !== appointmentToEdit.scheduled_date;
             const timeChanged = editAppointmentForm.scheduled_time !== appointmentToEdit.scheduled_time;

             if (dateChanged || timeChanged) {
                 console.log("📤 ENVIANDO PARA SUPABASE:");
                 console.log("scheduled_date CORRIGIDA:", newDate);
                 console.log("scheduled_time:", editAppointmentForm.scheduled_time);
                 
                 const { error } = await supabase
                     .from("appointments")
                     .update({
                         scheduled_date: newDate,
                         scheduled_time: editAppointmentForm.scheduled_time,
                         original_scheduled_date: appointmentToEdit.original_scheduled_date || appointmentToEdit.scheduled_date,
                         original_scheduled_time: appointmentToEdit.original_scheduled_time || appointmentToEdit.scheduled_time,
                         time_changed_at: new Date().toISOString(),
                         time_change_reason: editAppointmentForm.reason || "Mudança de disponibilidade",
                     })
                     .eq("id", appointmentToEdit.id);

                 if (error) throw error;

                 // Log da ação
                 const oldTime = `${appointmentToEdit.scheduled_date} ${appointmentToEdit.scheduled_time}`;
                 const newTime = `${newDate} ${editAppointmentForm.scheduled_time}`;
                 logAction("update", "appointments", appointmentToEdit.id, appointmentToEdit.client_name, `Horário alterado de ${oldTime} para ${newTime}. Motivo: ${editAppointmentForm.reason || "Não informado"}`);

                 setEditAppointmentDialogOpen(false);
                 fetchData();
                 toast({ title: "Horário do agendamento alterado com sucesso!" });
             } else {
                 toast({ title: "Nenhuma alteração foi feita", variant: "destructive" });
             }
            } catch (err: any) {
             toast({
                 title: "Erro ao alterar agendamento",
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
                            Serviços
                        </h2>

                        {/* Abas */}
                        <div className="flex gap-2 mb-4 border-b border-border">
                            <button
                                onClick={() => setActiveTab("pendentes")}
                                className={`px-3 py-2 font-medium border-b-2 transition-colors text-sm ${activeTab === "pendentes"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Agendados
                            </button>
                            <button
                                onClick={() => setActiveTab("concluidos")}
                                className={`px-3 py-2 font-medium border-b-2 transition-colors text-sm ${activeTab === "concluidos"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Concluídos
                            </button>
                        </div>

                        <div className="space-y-3 max-h-96 md:max-h-screen overflow-y-auto">
                            {activeTab === "pendentes" ? (
                                // Abas Agendados (pendente + confirmado)
                                appointments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum agendamento</p>
                                ) : (
                                    appointments
                                        .filter((apt) => apt.status !== "cancelado" && apt.status !== "concluído")
                                        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                                        .map((apt) => {
                                            const borderColor = apt.status === "pendente" ? "border-amber-500" : "border-blue-500";
                                            const bgColor = apt.status === "pendente" ? "bg-amber-50 dark:bg-amber-950/20" : "bg-blue-50 dark:bg-blue-950/20";
                                            return (
                                                <div key={apt.id} className={`p-2 md:p-3 rounded-lg ${bgColor} hover:opacity-80 transition-all border-l-4 ${borderColor}`}>
                                                     <div className="flex items-start justify-between gap-2">
                                                         <div className="flex-1">
                                                              <div className="text-sm font-medium text-foreground truncate mb-1">
                                                                  <ClientStatusBadge 
                                                                      clientName={apt.client_name} 
                                                                      planStatus={apt.client_plan_status}
                                                                      size="md"
                                                                  />
                                                              </div>
                                                             <p className="text-xs text-muted-foreground">📋 {apt.service_type}</p>
                                                             {apt.vehicle && <p className="text-xs text-muted-foreground">🚗 {apt.vehicle} ({apt.plate})</p>}
                                                             {apt.notes && <p className="text-xs text-muted-foreground mt-1">💬 {apt.notes}</p>}
                                                             <p className="text-xs text-muted-foreground mt-1">
                                                                 📅 {new Date(apt.scheduled_date).toLocaleDateString("pt-BR")} ⏰ {apt.scheduled_time}
                                                             </p>
                                                         </div>
                                                        <div className="flex flex-col gap-1 flex-shrink-0">
                                                             <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${apt.status === "pendente" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                                                                 {apt.status === "pendente" ? "⏳ Pendente" : "⏱️ Confirmado"}
                                                             </span>
                                                             {apt.time_changed_at && (
                                                                 <span className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-orange-100 text-orange-700">
                                                                     🔔 Horário Alterado
                                                                 </span>
                                                             )}
                                                             <Button
                                                                 size="sm"
                                                                 variant="outline"
                                                                 className="text-xs h-7"
                                                                 onClick={() => openEditAppointmentDialog(apt)}
                                                                 disabled={actioningAppointmentId === apt.id}
                                                             >
                                                                 ✏️ Alterar Horário
                                                             </Button>
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
                                                                     onClick={() => openCompleteAppointmentDialog(apt)}
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
                                )
                            ) : (
                                // Aba Concluídos
                                appointments.filter((apt) => apt.status === "concluído").length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum serviço concluído</p>
                                ) : (
                                    appointments
                                        .filter((apt) => apt.status === "concluído")
                                        .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
                                        .map((apt) => (
                                            <div key={apt.id} className="p-2 md:p-3 rounded-lg bg-green-50 dark:bg-green-950/20 hover:opacity-80 transition-all border-l-4 border-green-500">
                                                 <div className="flex items-start justify-between gap-2">
                                                     <div className="flex-1">
                                                          <div className="text-sm font-medium text-foreground truncate mb-1">
                                                              <ClientStatusBadge 
                                                                  clientName={apt.client_name} 
                                                                  planStatus={apt.client_plan_status}
                                                                  size="md"
                                                              />
                                                          </div>
                                                         <p className="text-xs text-muted-foreground">📋 {apt.service_type}</p>
                                                         {apt.vehicle && <p className="text-xs text-muted-foreground">🚗 {apt.vehicle} ({apt.plate})</p>}
                                                         {apt.notes && <p className="text-xs text-muted-foreground mt-1">💬 {apt.notes}</p>}
                                                         <p className="text-xs text-muted-foreground mt-1">
                                                             📅 {new Date(apt.scheduled_date).toLocaleDateString("pt-BR")} ⏰ {apt.scheduled_time}
                                                         </p>
                                                     </div>
                                                     <div className="flex flex-col gap-1 flex-shrink-0">
                                                         <span className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-green-100 text-green-700">
                                                             ✓ Concluído
                                                         </span>
                                                     </div>
                                                </div>
                                            </div>
                                        ))
                                )
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

                        {/* Dialog para Concluir Agendamento */}
                         <Dialog open={completeAppointmentDialogOpen} onOpenChange={setCompleteAppointmentDialogOpen}>
                             <DialogContent className="bg-card border-border">
                                 <DialogHeader>
                                     <DialogTitle className="font-display">Concluir Agendamento</DialogTitle>
                                 </DialogHeader>
                                 {appointmentToComplete && (
                                     <div className="space-y-4">
                                         <div className="p-3 bg-muted/50 rounded-lg">
                                             <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                                             <p className="font-semibold text-foreground">{appointmentToComplete.client_name}</p>
                                             <p className="text-sm text-muted-foreground mt-2">Serviço: {appointmentToComplete.service_type}</p>
                                         </div>
                                         <div>
                                             <Label>Funcionário Responsável *</Label>
                                             <Select value={selectedEmployeeForCompletion} onValueChange={setSelectedEmployeeForCompletion}>
                                                 <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                 <SelectContent>
                                                     {employees.map((emp) => (
                                                         <SelectItem key={emp.id} value={emp.id}>
                                                             {emp.name}
                                                         </SelectItem>
                                                     ))}
                                                 </SelectContent>
                                             </Select>
                                         </div>
                                         <Button
                                             onClick={handleCompleteAppointment}
                                             disabled={actioningAppointmentId !== null}
                                             className="w-full gradient-primary text-primary-foreground font-semibold"
                                         >
                                             {actioningAppointmentId ? "Processando..." : "Concluir Serviço"}
                                         </Button>
                                     </div>
                                 )}
                             </DialogContent>
                         </Dialog>

                         {/* Dialog para Editar Horário de Agendamento */}
                         <Dialog open={editAppointmentDialogOpen} onOpenChange={setEditAppointmentDialogOpen}>
                             <DialogContent className="bg-card border-border">
                                 <DialogHeader>
                                     <DialogTitle className="font-display">Alterar Horário do Agendamento</DialogTitle>
                                 </DialogHeader>
                                 {appointmentToEdit && (
                                     <div className="space-y-4">
                                         <div className="p-3 bg-muted/50 rounded-lg">
                                             <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                                             <p className="font-semibold text-foreground">{appointmentToEdit.client_name}</p>
                                             <p className="text-sm text-muted-foreground mt-2">Serviço: {appointmentToEdit.service_type}</p>
                                             <p className="text-xs text-muted-foreground mt-1">
                                                 Horário anterior: {appointmentToEdit.scheduled_date} às {appointmentToEdit.scheduled_time}
                                             </p>
                                         </div>
                                         <div>
                                             <Label>Nova Data *</Label>
                                             <Input
                                                 type="date"
                                                 value={editAppointmentForm.scheduled_date}
                                                 onChange={(e) => setEditAppointmentForm({ ...editAppointmentForm, scheduled_date: e.target.value })}
                                             />
                                         </div>
                                         <div>
                                             <Label>Novo Horário *</Label>
                                             <Input
                                                 type="time"
                                                 value={editAppointmentForm.scheduled_time}
                                                 onChange={(e) => setEditAppointmentForm({ ...editAppointmentForm, scheduled_time: e.target.value })}
                                             />
                                         </div>
                                         <div>
                                             <Label>Motivo da Alteração</Label>
                                             <Input
                                                 placeholder="Ex: Indisponibilidade do técnico, cliente solicitou..."
                                                 value={editAppointmentForm.reason}
                                                 onChange={(e) => setEditAppointmentForm({ ...editAppointmentForm, reason: e.target.value })}
                                             />
                                         </div>
                                         <Button
                                             onClick={handleEditAppointment}
                                             disabled={actioningAppointmentId !== null}
                                             className="w-full gradient-primary text-primary-foreground font-semibold"
                                         >
                                             {actioningAppointmentId ? "Processando..." : "Confirmar Alteração"}
                                         </Button>
                                     </div>
                                 )}
                             </DialogContent>
                         </Dialog>

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
