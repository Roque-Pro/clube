import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Shield, Edit, Save, X, Mail, Phone, User, Car, DollarSign, LogOut, Calendar, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const ClientDashboard = () => {
     const navigate = useNavigate();
     const { session, loading, user, signOut } = useAuth();
     const { toast } = useToast();
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
     });

     const replacementItems = ["Para-brisa", "Retrovisor", "Vigia", "Farol", "Vidro lateral", "Insumo", "Ferramenta", "Outro"];

     // All hooks must be called before any conditional logic below

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
           // Search by email to find the client record
           const { data, error } = await supabase
             .from("clients")
             .select("*")
             .eq("email", session.user?.email);

           if (error) {
             console.error("Erro ao buscar cliente:", error);
             throw error;
           }
           
           if (data && data.length > 0) {
             const clientRecord = data[0];
             setClientData(clientRecord);
             setFormData(clientRecord);
             // Fetch appointments for this client
             fetchAppointments(clientRecord.id);
           } else {
             console.warn("Nenhum cliente encontrado para este usuário");
             // Create empty profile if not found
             setClientData(null);
           }
         } catch (err) {
           console.error("Erro ao carregar dados:", err);
         } finally {
           setDataLoading(false);
         }
       };

       if (session?.user?.email) {
         fetchClientData();
       }
     }, [session, fetchAppointments]);

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

    const handleAddAppointment = async () => {
        if (!appointmentForm.service_type || !appointmentForm.scheduled_date || !appointmentForm.scheduled_time || !clientData) {
            toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
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
            const { error } = await supabase
                .from("appointments")
                .insert({
                    client_id: clientData.id,
                    client_name: clientData.name,
                    service_type: appointmentForm.service_type,
                    scheduled_date: appointmentForm.scheduled_date,
                    scheduled_time: appointmentForm.scheduled_time,
                    status: "pendente",
                    notes: appointmentForm.notes,
                });

            if (error) throw error;

            setAppointmentForm({ service_type: "", scheduled_date: "", scheduled_time: "", notes: "" });
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
                        <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                            Bem-vindo, {clientData?.name}! 👋
                        </h2>
                        <p className="text-lg text-muted-foreground mb-6">
                            Você faz parte da família Clube do Vidro. Aqui você pode gerenciar seus dados e acompanhar seu plano.
                        </p>

                        {/* Plan Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="glass-card p-4 border border-success/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-success font-semibold">Cliente</p>
                                        <p className="text-lg font-bold text-success">Clube do Vidro</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-4 border border-primary/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <Car className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Trocas/Ano</p>
                                        <p className="text-lg font-bold text-foreground">3</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-4 border border-primary/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <p className="text-lg font-bold text-success">Ativo</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <span className={`px-3 py-1 rounded-full text-xs font-semibold ${apt.status === "pendente" ? "bg-amber-100 text-amber-700" : apt.status === "confirmado" ? "bg-blue-100 text-blue-700" : apt.status === "cancelado" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                                     {apt.status === "pendente" ? "⏳ Pendente" : apt.status === "confirmado" ? "⏱️ Confirmado" : apt.status === "cancelado" ? "✕ Cancelado" : "✓ Concluído"}
                                                 </span>
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
                </motion.div>
            </main>
        </div>
    );
};

export default ClientDashboard;
