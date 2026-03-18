import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Shield, Edit, Save, X, Mail, Phone, User, Car, DollarSign, LogOut, Calendar, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVehicleValidation } from "@/hooks/useVehicleValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PlanStatusCard from "@/components/PlanStatusCard";
import FreeTrocasCard from "@/components/FreeTrocasCard";
import PlanPaymentModal from "@/components/PlanPaymentModal";
import PlanPromotionCard from "@/components/PlanPromotionCard";
import ClientStatusBadge from "@/components/ClientStatusBadge";

interface ClientProfile {
    id?: string;
    name: string;
    email: string;
    phone: string;
    cpf: string;
    vehicle: string;
    plate: string;
    replacements_used?: number;
    max_replacements?: number;
    plan_status?: "free" | "active" | "expired";
    plan_paid_at?: string;
    plan_start?: string;
    plan_end?: string;
}

interface ClientVehicle {
    id: string;
    vehicle: string;
    plate: string;
    is_national: boolean;
    is_primary: boolean;
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
    vehicle_id?: string;
    original_scheduled_date?: string;
    original_scheduled_time?: string;
    time_changed_at?: string;
    time_change_reason?: string;
}

const ClientDashboard = () => {
    const navigate = useNavigate();
    const { session, loading, user, signOut } = useAuth();
    const { toast } = useToast();
    const { validateVehicle, loading: validatingVehicle } = useVehicleValidation();
    const [clientData, setClientData] = useState<ClientProfile | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [editingSection, setEditingSection] = useState<"personal" | "vehicle" | null>(null);
    const [formData, setFormData] = useState<ClientProfile>({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        vehicle: "",
        plate: "",
    });
    const [saving, setSaving] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
    const [submittingAppointment, setSubmittingAppointment] = useState(false);
    const [appointmentForm, setAppointmentForm] = useState({
        service_type: "",
        scheduled_date: "",
        scheduled_time: "",
        notes: "",
        vehicle_id: "",
    });
    const [clientVehicles, setClientVehicles] = useState<ClientVehicle[]>([]);
    const [addVehicleDialogOpen, setAddVehicleDialogOpen] = useState(false);
    const [newVehicleForm, setNewVehicleForm] = useState({ vehicle: "", plate: "" });
    const [validatingNewVehicle, setValidatingNewVehicle] = useState(false);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [editAppointmentDialogOpen, setEditAppointmentDialogOpen] = useState(false);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [editAppointmentForm, setEditAppointmentForm] = useState({
        scheduled_date: "",
        scheduled_time: "",
    });
    const [submittingEditAppointment, setSubmittingEditAppointment] = useState(false);
    const [confirmingChangedAppointmentId, setConfirmingChangedAppointmentId] = useState<string | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    const replacementItems = ["Para-brisa", "Retrovisor", "Vigia", "Farol", "Janela", "Porta", "Óculos", "Insumo", "Ferramenta", "Outro"];

    // Handle payment click
    const handlePaymentClick = async () => {
        toast({
            title: "Pagamento",
            description: "Integração com Stripe será implementada em breve",
            variant: "default",
        });
        // TODO: Integrar com Stripe quando disponível
    };

    // All hooks must be called before any conditional logic below

    // Fetch client vehicles
    const fetchClientVehicles = useCallback(async (clientId: string) => {
        try {
            const { data, error } = await supabase
                .from("client_vehicles")
                .select("*")
                .eq("client_id", clientId)
                .order("is_primary", { ascending: false });

            if (error) throw error;
            setClientVehicles(data || []);
        } catch (err) {
            console.error("Erro ao carregar veículos:", err);
        }
    }, []);

    // Fetch appointments callback
    const fetchAppointments = useCallback(async (clientId: string) => {
        try {
            const { data, error } = await supabase
                .from("appointments")
                .select("*")
                .eq("client_id", clientId)
                .order("scheduled_date", { ascending: false });

            if (error) throw error;
            setAppointments(data || []);
        } catch (err) {
            console.error("Erro ao carregar agendamentos:", err);
        }
    }, []);

    // Fetch client profile data and appointments
    useEffect(() => {
        const fetchClientData = async () => {
            try {
                const userId = session.user?.id;
                const userEmail = session.user?.email;
                console.log("🔍 Buscando cliente por User ID:", userId);
                console.log("📧 Email:", userEmail);

                if (!userId) {
                    console.warn("⚠️ User ID não disponível");
                    setDataLoading(false);
                    return;
                }

                // Search by user_id first (mais confiável)
                const { data, error } = await supabase
                    .from("clients")
                    .select("*")
                    .eq("user_id", userId)
                    .maybeSingle();

                console.log("📋 Resposta da query por user_id:", { data, error });

                if (error && error.code !== "PGRST116") {
                    console.error("❌ Erro ao buscar cliente:", error);
                    setClientData(null);
                } else if (data) {
                    console.log("✅ Cliente encontrado por user_id:", data);
                    setClientData(data);
                    setFormData(data);
                    // Fetch appointments and vehicles for this client
                    fetchAppointments(data.id);
                    fetchClientVehicles(data.id);
                } else {
                    console.warn("⚠️ Nenhum cliente encontrado para user_id:", userId);
                    // Fallback: tentar buscar por email
                    console.log("🔄 Tentando fallback por email:", userEmail);
                    const { data: emailData, error: emailError } = await supabase
                        .from("clients")
                        .select("*")
                        .eq("email", userEmail)
                        .maybeSingle();

                    if (emailData) {
                        console.log("✅ Cliente encontrado por email:", emailData);
                        setClientData(emailData);
                        setFormData(emailData);
                        fetchAppointments(emailData.id);
                        fetchClientVehicles(emailData.id);
                    } else {
                        console.warn("⚠️ Nenhum cliente encontrado. Email:", userEmail, "Error:", emailError);
                        setClientData(null);
                    }
                }
            } catch (err) {
                console.error("❌ Erro ao carregar dados:", err);
                setClientData(null);
            } finally {
                setDataLoading(false);
            }
        };

        if (session?.user?.id) {
            fetchClientData();
        } else {
            console.warn("⚠️ Session não pronta ou user não autenticado", session?.user);
            setDataLoading(false);
        }
    }, [session, fetchAppointments, fetchClientVehicles]);

    // Auto-refresh appointments every 30 seconds
    useEffect(() => {
        if (!clientData?.id) {
            return;
        }

        const interval = setInterval(() => {
            fetchAppointments(clientData.id!);
        }, 30000);

        return () => clearInterval(interval);
    }, [clientData?.id, fetchAppointments]);

    const handleValidateAndAddVehicle = async () => {
        if (!newVehicleForm.vehicle || !newVehicleForm.plate) {
            toast({ title: "Preencha veículo e placa", variant: "destructive" });
            return;
        }

        if (!clientData) return;

        setValidatingNewVehicle(true);
        try {
            const result = await validateVehicle(newVehicleForm.vehicle);

            if (!result) {
                toast({ title: "Erro ao validar veículo", variant: "destructive" });
                return;
            }

            if (!result.isNational) {
                toast({
                    title: "Veículo importado",
                    description: "Apenas veículos nacionais podem ser adicionados ao plano",
                    variant: "destructive",
                });
                return;
            }

            setValidationResult(result);
        } catch (err: any) {
            toast({
                title: "Erro ao validar",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setValidatingNewVehicle(false);
        }
    };

    const handleConfirmAddVehicle = async () => {
        if (!clientData || !validationResult) return;

        try {
            const isPrimary = clientVehicles.length === 0;

            const { error } = await supabase
                .from("client_vehicles")
                .insert({
                    client_id: clientData.id,
                    vehicle: newVehicleForm.vehicle,
                    plate: newVehicleForm.plate,
                    is_national: true,
                    is_primary: isPrimary,
                });

            if (error) throw error;

            setNewVehicleForm({ vehicle: "", plate: "" });
            setValidationResult(null);
            setAddVehicleDialogOpen(false);
            fetchClientVehicles(clientData.id);
            toast({ title: "Veículo adicionado com sucesso!" });
        } catch (err: any) {
            toast({
                title: "Erro ao adicionar veículo",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    const handleDeleteVehicle = async (vehicleId: string) => {
        if (!clientData) return;

        try {
            const { error } = await supabase
                .from("client_vehicles")
                .delete()
                .eq("id", vehicleId);

            if (error) throw error;

            fetchClientVehicles(clientData.id);
            toast({ title: "Veículo removido" });
        } catch (err: any) {
            toast({
                title: "Erro ao remover veículo",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    const handleAddAppointment = async () => {
        if (!appointmentForm.service_type || !appointmentForm.scheduled_date || !appointmentForm.scheduled_time || !appointmentForm.vehicle_id || !clientData) {
            toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
            return;
        }

        // Check if client has reached appointment limit (only count active appointments)
        const appointmentsThisYear = appointments.filter((apt) => {
            const aptYear = new Date(apt.scheduled_date).getFullYear();
            return aptYear === new Date().getFullYear() && apt.status !== "cancelado";
        });

        if (appointmentsThisYear.length >= (clientData.max_replacements || 3)) {
            toast({ title: "Você já atingiu o limite de agendamentos para este ano", variant: "destructive" });
            return;
        }

        setSubmittingAppointment(true);
        try {
            // Corrigir timezone: adicionar 1 dia à data
            const dateObj = new Date(appointmentForm.scheduled_date);
            dateObj.setDate(dateObj.getDate() + 1);
            const correctedDate = dateObj.toISOString().split('T')[0];
            
            console.log("📅 Cliente criando agendamento - Original:", appointmentForm.scheduled_date);
            console.log("📤 Cliente criando agendamento - Corrigida:", correctedDate);
            
            const { error } = await supabase
                .from("appointments")
                .insert({
                    client_id: clientData.id,
                    client_name: clientData.name,
                    service_type: appointmentForm.service_type,
                    scheduled_date: correctedDate,
                    scheduled_time: appointmentForm.scheduled_time,
                    status: "pendente",
                    notes: appointmentForm.notes,
                    vehicle_id: appointmentForm.vehicle_id,
                });

            if (error) throw error;

            setAppointmentForm({ service_type: "", scheduled_date: "", scheduled_time: "", notes: "", vehicle_id: "" });
            setAppointmentDialogOpen(false);
            fetchAppointments(clientData.id);
            toast({ title: "Agendamento realizado com sucesso!" });
        } catch (err: any) {
            toast({
                title: "Erro ao agendar",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSubmittingAppointment(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("clients")
                .update(formData)
                .eq("email", session.user?.email);

            if (error) throw error;

            setClientData(formData);
            setEditingSection(null);
            toast({ title: "Dados atualizados com sucesso!" });
        } catch (err: any) {
            toast({
                title: "Erro ao salvar",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelAppointment = async (appointmentId: string) => {
        try {
            // Update appointment status to cancelled
            const { error: updateError } = await supabase
                .from("appointments")
                .update({ status: "cancelado" })
                .eq("id", appointmentId);

            if (updateError) throw updateError;

            // Refresh appointments list
            if (clientData?.id) {
                fetchAppointments(clientData.id);
            }

            toast({ title: "Agendamento cancelado", description: "Crédito devolvido com sucesso!" });
        } catch (err: any) {
            toast({
                title: "Erro ao cancelar",
                description: err.message,
                variant: "destructive",
            });
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
        });
        setEditAppointmentDialogOpen(true);
    };

    const handleEditAppointment = async () => {
        if (!appointmentToEdit || !editAppointmentForm.scheduled_date || !editAppointmentForm.scheduled_time) {
            toast({ title: "Preencha data e hora", variant: "destructive" });
            return;
        }

        // Garantir que as datas estão no formato correto (YYYY-MM-DD)
        const currentDateStr = typeof appointmentToEdit.scheduled_date === 'string' 
            ? appointmentToEdit.scheduled_date.split('T')[0]
            : appointmentToEdit.scheduled_date;
        
        const newDateStr = editAppointmentForm.scheduled_date;

        // Validar se o novo horário é posterior ao horário original/atual
        // Comparação simples de strings no formato YYYY-MM-DD HH:mm funciona corretamente
        const currentTimeStr = `${currentDateStr} ${appointmentToEdit.scheduled_time}`;
        const newTimeStr = `${newDateStr} ${editAppointmentForm.scheduled_time}`;

        if (newTimeStr < currentTimeStr) {
            toast({
                title: "Horário inválido",
                description: "Você só pode alterar para um horário posterior. Não é permitido alterar para trás.",
                variant: "destructive",
            });
            return;
        }

        setSubmittingEditAppointment(true);
        try {
            // Corrigir timezone: adicionar 1 dia à data
            const dateObj = new Date(newDateStr);
            dateObj.setDate(dateObj.getDate() + 1);
            const correctedDate = dateObj.toISOString().split('T')[0];
            
            console.log("📅 Cliente - ANTES DE ENVIAR:", newDateStr);
            console.log("📤 Cliente - Data corrigida:", correctedDate);
            
            const { error } = await supabase
                .from("appointments")
                .update({
                    scheduled_date: correctedDate,
                    scheduled_time: editAppointmentForm.scheduled_time,
                })
                .eq("id", appointmentToEdit.id);

            if (error) throw error;

            setEditAppointmentDialogOpen(false);
            if (clientData?.id) {
                fetchAppointments(clientData.id);
            }
            toast({ title: "Horário confirmado com sucesso!" });
        } catch (err: any) {
            toast({
                title: "Erro ao alterar agendamento",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSubmittingEditAppointment(false);
        }
    };

    const handleConfirmChangedAppointment = async (appointmentId: string) => {
        setConfirmingChangedAppointmentId(appointmentId);
        try {
            const { error } = await supabase
                .from("appointments")
                .update({ status: "confirmado" })
                .eq("id", appointmentId);

            if (error) throw error;

            if (clientData?.id) {
                fetchAppointments(clientData.id);
            }
            toast({ title: "Horário confirmado! A loja foi notificada." });
        } catch (err: any) {
            toast({
                title: "Erro ao confirmar",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setConfirmingChangedAppointmentId(null);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate("/");
    };

    // Redirect if not logged in
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary animate-pulse">
                    <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/plan-auth" replace />;
    }

    if (dataLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary animate-pulse">
                    <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-border/40 bg-background/80">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary">
                            <Shield className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold text-foreground">Clube do Vidro</h1>
                            <p className="text-xs text-muted-foreground">Minha Conta</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Welcome Section */}
                    <div className="glass-card p-8 border border-primary/30 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-display font-bold text-foreground">
                                Bem-vindo, {clientData?.name}! 👋
                            </h2>
                            {clientData && (
                                <ClientStatusBadge
                                    planStatus={clientData.plan_status || "free"}
                                    size="md"
                                />
                            )}
                        </div>
                        <p className="text-lg text-muted-foreground mb-6">
                            Você faz parte da família Clube do Vidro. Aqui você pode gerenciar seus dados e acompanhar seu plano.
                        </p>
                    </div>

                    {/* Plan Status Card - Replaced old card */}
                     {clientData && (
                         <PlanStatusCard
                             planStatus={clientData.plan_status || "free"}
                             planPaidAt={clientData.plan_paid_at}
                             planEnd={clientData.plan_end}
                             onPaymentClick={() => setPaymentModalOpen(true)}
                             onRenewClick={() => setPaymentModalOpen(true)}
                         />
                     )}

                     {/* Plan Promotion Card */}
                     {clientData && (
                         <PlanPromotionCard
                             planStatus={clientData.plan_status || "free"}
                         />
                     )}

                     {/* Free Trocas Card */}
                    {clientData && (
                        <FreeTrocasCard
                            replacementsUsed={clientData.replacements_used || 0}
                            maxReplacements={clientData.max_replacements || 3}
                            planStatus={clientData.plan_status || "free"}
                        />
                    )}

                    {/* Payment Modal */}
                    <PlanPaymentModal
                        isOpen={paymentModalOpen}
                        onClose={() => setPaymentModalOpen(false)}
                        onPaymentClick={handlePaymentClick}
                        clientName={clientData?.name}
                    />

                    {/* Appointments Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-8 rounded-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                Agendar Serviço
                            </h3>
                            <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Novo Agendamento
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border">
                                    <DialogHeader>
                                        <DialogTitle className="font-display">Agendar Novo Serviço</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Serviço *</Label>
                                            <Select value={appointmentForm.service_type} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, service_type: v })}>
                                                <SelectTrigger><SelectValue placeholder="Selecione um serviço..." /></SelectTrigger>
                                                <SelectContent>
                                                    {replacementItems.map((item) => (
                                                        <SelectItem key={item} value={item}>{item}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Data *</Label>
                                            <Input
                                                type="date"
                                                value={appointmentForm.scheduled_date}
                                                onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduled_date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Hora *</Label>
                                            <Input
                                                type="time"
                                                value={appointmentForm.scheduled_time}
                                                onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduled_time: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Veículo *</Label>
                                            {clientVehicles.length === 0 ? (
                                                <p className="text-sm text-red-600 mb-2">Adicione um veículo para continuar</p>
                                            ) : (
                                                <Select value={appointmentForm.vehicle_id} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, vehicle_id: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Selecione um veículo..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {clientVehicles.map((vehicle) => (
                                                            <SelectItem key={vehicle.id} value={vehicle.id}>
                                                                {vehicle.vehicle} - {vehicle.plate}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                        <div>
                                            <Label>Observações</Label>
                                            <Input
                                                value={appointmentForm.notes}
                                                onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                                                placeholder="Algo especial que devemos saber?"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleAddAppointment}
                                            disabled={submittingAppointment}
                                            className="w-full"
                                        >
                                            {submittingAppointment ? "Agendando..." : "Confirmar Agendamento"}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Appointments List */}
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground mb-4">
                                Agendamentos: <strong>{appointments.filter((apt) => new Date(apt.scheduled_date).getFullYear() === new Date().getFullYear() && apt.status !== "cancelado").length}</strong> de <strong>{clientData?.max_replacements || 3}</strong> por ano
                            </p>
                            {appointments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">Nenhum agendamento realizado ainda</p>
                            ) : (
                                appointments.map((apt) => {
                                    const bgColor = apt.status === "pendente" ? "bg-amber-50 dark:bg-amber-950/20" : apt.status === "confirmado" ? "bg-blue-50 dark:bg-blue-950/20" : apt.status === "cancelado" ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20";
                                    const borderColor = apt.status === "pendente" ? "border-amber-200" : apt.status === "confirmado" ? "border-blue-200" : apt.status === "cancelado" ? "border-red-200" : "border-green-200";
                                    const canCancel = apt.status !== "concluido" && apt.status !== "cancelado";
                                    return (
                                        <div key={apt.id} className={`p-4 ${bgColor} rounded-lg border ${borderColor} border-l-4`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-medium text-foreground">{apt.service_type}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        📅 {new Date(apt.scheduled_date).toLocaleDateString("pt-BR")} às {apt.scheduled_time}
                                                    </p>
                                                    {apt.time_changed_at && (
                                                         <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded">
                                                             <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-1">
                                                                 🔔 Horário Alterado
                                                             </p>
                                                             <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                                                 Anterior: {apt.original_scheduled_date} às {apt.original_scheduled_time}
                                                             </p>
                                                             {apt.time_change_reason && (
                                                                 <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                                                     Motivo: {apt.time_change_reason}
                                                                 </p>
                                                             )}
                                                             {apt.status === "pendente" && (
                                                                 <div className="flex gap-2 mt-2">
                                                                     <Button
                                                                         size="sm"
                                                                         className="text-xs h-7 flex-1 bg-green-600 hover:bg-green-700"
                                                                         onClick={() => handleConfirmChangedAppointment(apt.id)}
                                                                         disabled={confirmingChangedAppointmentId === apt.id}
                                                                     >
                                                                         ✅ Aceitar Horário
                                                                     </Button>
                                                                 </div>
                                                             )}
                                                         </div>
                                                     )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                     <span className={`px-3 py-1 rounded-full text-xs font-semibold ${apt.status === "pendente" ? "bg-amber-100 text-amber-700" : apt.status === "confirmado" ? "bg-blue-100 text-blue-700" : apt.status === "cancelado" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                                         {apt.status === "pendente" ? "⏳ Aguardando confirmação da loja" : apt.status === "confirmado" ? "⏱️ Confirmado" : apt.status === "cancelado" ? "✕ Cancelado" : "✓ Concluído"}
                                                     </span>
                                                     {apt.status !== "cancelado" && apt.status !== "concluído" && (
                                                         <Button
                                                             variant="outline"
                                                             size="sm"
                                                             onClick={() => openEditAppointmentDialog(apt)}
                                                             className="text-xs h-7"
                                                         >
                                                             ✏️ Alterar
                                                         </Button>
                                                     )}
                                                     {canCancel && (
                                                         <Button
                                                             variant="ghost"
                                                             size="sm"
                                                             onClick={() => handleCancelAppointment(apt.id)}
                                                             className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                         >
                                                             <Trash2 className="w-4 h-4" />
                                                         </Button>
                                                     )}
                                                 </div>
                                            </div>
                                            {apt.notes && <p className="text-sm text-muted-foreground">💬 {apt.notes}</p>}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>

                    {/* Vehicles Management Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="glass-card p-8 rounded-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                                <Car className="w-5 h-5 text-primary" />
                                Meus Veículos
                            </h3>
                            <Dialog open={addVehicleDialogOpen} onOpenChange={setAddVehicleDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Adicionar Veículo
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border">
                                    <DialogHeader>
                                        <DialogTitle className="font-display">Adicionar Novo Veículo</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        {!validationResult ? (
                                            <>
                                                <div>
                                                    <Label>Veículo (marca e modelo) *</Label>
                                                    <Input
                                                        value={newVehicleForm.vehicle}
                                                        onChange={(e) => setNewVehicleForm({ ...newVehicleForm, vehicle: e.target.value })}
                                                        placeholder="Ex: Honda Civic 2022"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Placa *</Label>
                                                    <Input
                                                        value={newVehicleForm.plate}
                                                        onChange={(e) => setNewVehicleForm({ ...newVehicleForm, plate: e.target.value })}
                                                        placeholder="ABC-1234"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleValidateAndAddVehicle}
                                                    disabled={validatingNewVehicle}
                                                    className="w-full"
                                                >
                                                    {validatingNewVehicle ? "Verificando..." : "Verificar com IA"}
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className={`p-4 rounded-lg border-2 ${validationResult.isNational ? "border-success bg-success/10" : "border-destructive bg-destructive/10"}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {validationResult.isNational ? (
                                                            <Check className="w-5 h-5 text-success" />
                                                        ) : (
                                                            <AlertCircle className="w-5 h-5 text-destructive" />
                                                        )}
                                                        <p className="font-semibold">
                                                            {validationResult.isNational ? "Veículo Nacional ✓" : "Veículo Importado"}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm">{validationResult.message}</p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Marca: {validationResult.brand} | Modelo: {validationResult.model} | Confiança: {Math.round(validationResult.confidence * 100)}%
                                                    </p>
                                                </div>
                                                {validationResult.isNational && (
                                                    <Button
                                                        onClick={handleConfirmAddVehicle}
                                                        className="w-full gap-2"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Confirmar e Adicionar
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setValidationResult(null);
                                                        setNewVehicleForm({ vehicle: "", plate: "" });
                                                    }}
                                                    className="w-full"
                                                >
                                                    Voltar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Vehicles List */}
                        <div className="space-y-3">
                            {clientVehicles.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">Nenhum veículo adicionado ainda</p>
                            ) : (
                                clientVehicles.map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        className="p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Car className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="font-medium text-foreground">{vehicle.vehicle}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Placa: {vehicle.plate} {vehicle.is_primary && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Principal</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteVehicle(vehicle.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Personal Data Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-8 rounded-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Dados Pessoais
                            </h3>
                            {editingSection !== "personal" && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingSection("personal")}
                                    className="gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                </Button>
                            )}
                        </div>

                        {editingSection === "personal" ? (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Nome</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Seu nome"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="seu@email.com"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="(45) 99999-9999"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="cpf">CPF</Label>
                                    <Input
                                        id="cpf"
                                        value={formData.cpf}
                                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                        placeholder="000.000.000-00"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? "Salvando..." : "Salvar"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setEditingSection(null)}
                                        className="flex-1 gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Nome</p>
                                    <p className="text-foreground font-medium">{clientData?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                                    <p className="text-foreground font-medium">{clientData?.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                                    <p className="text-foreground font-medium">{clientData?.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">CPF</p>
                                    <p className="text-foreground font-medium">{clientData?.cpf}</p>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Vehicle Data Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-8 rounded-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                                <Car className="w-5 h-5 text-primary" />
                                Dados do Veículo
                            </h3>
                            {editingSection !== "vehicle" && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingSection("vehicle")}
                                    className="gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                </Button>
                            )}
                        </div>

                        {editingSection === "vehicle" ? (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="vehicle">Veículo</Label>
                                    <Input
                                        id="vehicle"
                                        value={formData.vehicle}
                                        onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                                        placeholder="Honda Civic 2022"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="plate">Placa</Label>
                                    <Input
                                        id="plate"
                                        value={formData.plate}
                                        onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                                        placeholder="ABC-1D23"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? "Salvando..." : "Salvar"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setEditingSection(null)}
                                        className="flex-1 gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Veículo</p>
                                    <p className="text-foreground font-medium">{clientData?.vehicle}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Placa</p>
                                    <p className="text-foreground font-medium">{clientData?.plate}</p>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Dialog para Alterar Horário de Agendamento */}
                    <Dialog open={editAppointmentDialogOpen} onOpenChange={setEditAppointmentDialogOpen}>
                        <DialogContent className="bg-card border-border">
                            <DialogHeader>
                                <DialogTitle className="font-display">Alterar Horário do Agendamento</DialogTitle>
                            </DialogHeader>
                            {appointmentToEdit && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-1">Serviço</p>
                                        <p className="font-semibold text-foreground">{appointmentToEdit.service_type}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Horário atual: {new Date(appointmentToEdit.scheduled_date).toLocaleDateString("pt-BR")} às {appointmentToEdit.scheduled_time}
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
                                    <Button
                                        onClick={handleEditAppointment}
                                        disabled={submittingEditAppointment}
                                        className="w-full gradient-primary text-primary-foreground font-semibold"
                                    >
                                        {submittingEditAppointment ? "Alterando..." : "Confirmar Horário"}
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </motion.div>
            </main>
        </div>
    );
};

export default ClientDashboard;
