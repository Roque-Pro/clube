import { useState, useEffect } from "react";
import { Plus, Search, UserCheck, UserX, Repeat, Edit2, Eye, Upload, FileText, Car, Shield, Camera, X, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import ClientStatusBadge from "@/components/ClientStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, Replacement } from "@/types";
import { replacementItems } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/auditLog";
import { generateClientReport } from "@/lib/generateClientReport";

// Helper function para calcular status do plano
const getPlanStatus = (planActive: boolean, planEnd?: string): "free" | "active" | "expired" => {
    if (!planActive) return "free";
    
    if (planEnd) {
        const endDate = new Date(planEnd);
        const today = new Date();
        if (endDate < today) return "expired";
    }
    
    return "active";
};

const Clients = () => {
     const navigate = useNavigate();
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
     const [bulkUploadToggling, setBulkUploadToggling] = useState(false);
     const [photoModalOpen, setPhotoModalOpen] = useState(false);
     const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>("");
     const [clientVehicles, setClientVehicles] = useState<any[]>([]);
     const [reportDialogOpen, setReportDialogOpen] = useState(false);
     const [reportPeriod, setReportPeriod] = useState<"week" | "month" | "quarter" | "all">("month");
     const [reportingClient, setReportingClient] = useState<Client | null>(null);
     const [servicePhotosDialogOpen, setServicePhotosDialogOpen] = useState(false);
     const [servicePhotos, setServicePhotos] = useState<(File | null)[]>([null, null, null, null, null]);
     const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [serviceGalleryOpen, setServiceGalleryOpen] = useState(false);
    const [serviceGalleryImages, setServiceGalleryImages] = useState<{ url: string; ts?: string }[]>([]);
    const [galleryClient, setGalleryClient] = useState<Client | null>(null);
     const { toast } = useToast();

     const handleGenerateReport = async () => {
       if (!reportingClient) return;
       
       try {
         await generateClientReport({
           clientId: reportingClient.id,
           clientName: reportingClient.name,
           clientPhone: reportingClient.phone,
           clientEmail: reportingClient.email || "",
           clientCpf: reportingClient.cpf || "",
           period: reportPeriod
         });
         
         setReportDialogOpen(false);
         toast({ title: "Relatório gerado com sucesso!" });
       } catch (error: any) {
         toast({ title: "Erro ao gerar relatório", description: error.message, variant: "destructive" });
       }
     };

    // Fetch clients, employees and replacements from Supabase
    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchClients(),
                    fetchReplacements(),
                    (async () => {
                        const { data } = await supabase
                            .from("employees")
                            .select("*")
                            .eq("active", true)
                            .order("name", { ascending: true });
                        if (data) setEmployees(data);
                    })(),
                    (async () => {
                        const { data } = await supabase
                            .from("client_vehicles")
                            .select("*")
                            .order("is_primary", { ascending: false });
                        if (data) setClientVehicles(data);
                    })()
                ]);
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };
        
        loadAllData();
    }, []);

    const toggleSkipInspection = async (client: Client) => {
        setBulkUploadToggling(true);
        try {
            const newState = !client.skip_inspection;
            const { error } = await supabase
                .from("clients")
                .update({ skip_inspection: newState })
                .eq("id", client.id);

            if (error) throw error;

            setClients(clients.map((c) =>
                c.id === client.id ? { ...c, skip_inspection: newState } : c
            ));

            toast({
                title: newState ? "Vistoria Desativada" : "Vistoria Ativada",
                description: `Necessidade de fotos e aprovação foi ${newState ? "removida" : "reabilitada"} para ${client.name}`,
            });
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setBulkUploadToggling(false);
        }
    };

    const toggleBulkUpload = async (client: Client) => {
        setBulkUploadToggling(true);
        try {
            const newState = !client.bulk_upload_enabled;
            const { error } = await supabase
                .from("clients")
                .update({ bulk_upload_enabled: newState })
                .eq("id", client.id);

            if (error) throw error;

            // Atualizar lista local
            setClients(clients.map((c) =>
                c.id === client.id ? { ...c, bulk_upload_enabled: newState } : c
            ));

            await logAction(
                "update",
                "clients",
                client.id,
                client.name,
                `Liberação em massa ${newState ? "ativada" : "desativada"}`
            );

            toast({
                title: "Sucesso",
                description: `Upload em massa ${newState ? "habilitado" : "desabilitado"} para ${client.name}`,
            });
        } catch (error: any) {
            console.error("Erro ao atualizar permissão:", error);
            toast({
                title: "Erro",
                description: error.message || "Não foi possível atualizar a permissão",
                variant: "destructive",
            });
        } finally {
            setBulkUploadToggling(false);
        }
    };

    const toggleCooperative = async (client: Client) => {
        setBulkUploadToggling(true);
        try {
            const newState = !client.is_cooperative;
            // Sincroniza tudo: se é cooperativa, liga Vistoria OFF e Upload. Se não é, desliga ambos.
            const updatePayload = { 
                is_cooperative: newState,
                skip_inspection: newState,
                bulk_upload_enabled: newState
            };

            const { error } = await supabase
                .from("clients")
                .update(updatePayload)
                .eq("id", client.id);

            if (error) throw error;

            setClients(clients.map((c) =>
                c.id === client.id ? { ...c, ...updatePayload } : c
            ));

            await logAction(
                "update",
                "clients",
                client.id,
                client.name,
                `Status de cooperativa ${newState ? "ativado" : "desativado"}`
            );

            toast({
                title: newState ? "Cooperativa Ativada" : "Cooperativa Desativada",
                description: newState 
                    ? `${client.name} agora é cooperativa. Vistoria OFF e Upload em massa foram ativados.`
                    : `${client.name} agora é um cliente comum. Vistoria e Upload voltaram ao padrão.`,
            });
        } catch (error: any) {
            console.error("Erro ao atualizar status de cooperativa:", error);
            toast({
                title: "Erro",
                description: error.message || "Não foi possível atualizar o status",
                variant: "destructive",
            });
        } finally {
            setBulkUploadToggling(false);
        }
    };

    const updateValuePerCar = async (client: Client, value: number) => {
        try {
            const { error } = await supabase
                .from("clients")
                .update({ value_per_car: value })
                .eq("id", client.id);

            if (error) throw error;

            setClients(clients.map((c) =>
                c.id === client.id ? { ...c, value_per_car: value } : c
            ));

            toast({
                title: "Valor atualizado",
                description: `O valor por carro para ${client.name} foi definido para R$ ${value.toFixed(2)}`,
            });
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    const [form, setForm] = useState({ 
        name: "", 
        phone: "", 
        email: "", 
        cpf: "", 
        vehicle: "", 
        plate: "", 
        password: "", 
        maxReplacements: 3,
        is_cooperative: false,
        value_per_car: 0
    });
    const [replForm, setReplForm] = useState({ item: "", employeeId: "", notes: "", value: "" });
    const [submitting, setSubmitting] = useState(false);

    const fetchClients = async (): Promise<Client[]> => {
        try {
            const [{ data, error }, { data: vehiclesData, error: vehiclesError }] = await Promise.all([
                supabase
                    .from("clients")
                    .select("*")
                    .order("created_at", { ascending: false }),
                supabase
                    .from("client_vehicles")
                    .select("client_id, plan_active, plan_start, plan_end, plan_paid_at")
            ]);

            if (error) throw error;
            if (vehiclesError) throw vehiclesError;

            if (data) {
                const today = new Date().toISOString().split("T")[0];
                const vehiclesByClient = new Map<string, any[]>();

                (vehiclesData || []).forEach((vehicle: any) => {
                    const currentVehicles = vehiclesByClient.get(vehicle.client_id) || [];
                    currentVehicles.push(vehicle);
                    vehiclesByClient.set(vehicle.client_id, currentVehicles);
                });

                const mappedClients: Client[] = data.map((client: any) => {
                    const clientVehicles = vehiclesByClient.get(client.id) || [];
                    const activeVehicles = clientVehicles.filter(
                        (vehicle: any) => vehicle.plan_active && vehicle.plan_end && vehicle.plan_end >= today
                    );
                    const latestVehiclePlan = [...activeVehicles].sort((a: any, b: any) =>
                        (b.plan_end || "").localeCompare(a.plan_end || "")
                    )[0];

                    return {
                    id: client.id,
                    name: client.name,
                    phone: client.phone,
                    email: client.email,
                    cpf: client.cpf,
                    vehicle: client.vehicle,
                    plate: client.plate,
                    planStart: latestVehiclePlan?.plan_start || client.plan_start,
                    planEnd: latestVehiclePlan?.plan_end || client.plan_end,
                    replacementsUsed: client.replacements_used || 0,
                    maxReplacements: client.max_replacements || 3,
                    active: client.active || true,
                    planActive: activeVehicles.length > 0,
                    bulk_upload_enabled: client.bulk_upload_enabled || false,
                    skip_inspection: client.skip_inspection || false,
                    is_cooperative: client.is_cooperative || false,
                    value_per_car: client.value_per_car || 0
                }});
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
                        createdAt: r.created_at,
                    employeeId: r.employee_id,
                    employeeName: r.employee_name,
                    notes: r.notes,
                    photo_url_1: r.photo_url_1,
                    photo_url_2: r.photo_url_2,
                    photo_url_3: r.photo_url_3,
                    photo_url_4: r.photo_url_4,
                    photo_url_5: r.photo_url_5,
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

            if (emailCheck.data) {
                toast({
                    title: "Email já cadastrado",
                    description: `O email "${form.email}" já existe no sistema.`,
                    variant: "destructive",
                });
                setSubmitting(false);
                return;
            }

            if (cpfCheck.data) {
                toast({
                    title: "CPF / CNPJ já cadastrado",
                    description: `O documento "${form.cpf}" já está associado a outro cliente.`,
                    variant: "destructive",
                });
                setSubmitting(false);
                return;
            }

            const password = form.password || `Cliente${form.phone.slice(-4)}`;

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
                    is_cooperative: form.is_cooperative,
                    value_per_car: form.value_per_car
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

            setForm({ 
                name: "", 
                phone: "", 
                email: "", 
                cpf: "", 
                vehicle: "", 
                plate: "", 
                password: "", 
                maxReplacements: 3,
                is_cooperative: false,
                value_per_car: 0
            });
            setDialogOpen(false);

            if (data && data[0]) {
                logAction("create", "clients", data[0].id, form.name, `Novo cliente: ${form.vehicle} (${form.plate}) - Email: ${form.email}`);
            }

            toast({
                title: "Cliente cadastrado com sucesso!",
                description: `Email: ${form.email} | Senha: ${password}`
            });
        } catch (error: any) {
            toast({
                title: "Erro ao cadastrar cliente",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClient = async () => {
         if (!editingClient) {
             toast({ title: "Cliente não selecionado", variant: "destructive" });
             return;
         }
         setSubmitting(true);
         try {
             // Build update payload without empty fields to avoid unique constraint violations
             const updatePayload: any = {};
             if (form.name && form.name !== editingClient.name) updatePayload.name = form.name;
             if (form.phone && form.phone !== editingClient.phone) updatePayload.phone = form.phone;
             if (form.email && form.email.trim() !== "" && form.email !== editingClient.email) updatePayload.email = form.email;
             if (form.cpf && form.cpf !== editingClient.cpf) updatePayload.cpf = form.cpf;
             if (form.vehicle && form.vehicle !== editingClient.vehicle) updatePayload.vehicle = form.vehicle;
             if (form.plate && form.plate !== editingClient.plate) updatePayload.plate = form.plate;
             if (typeof form.maxReplacements === 'number') updatePayload.max_replacements = form.maxReplacements;
             if (typeof form.is_cooperative === 'boolean') updatePayload.is_cooperative = form.is_cooperative;
             if (typeof form.value_per_car === 'number') updatePayload.value_per_car = form.value_per_car;

             let error = null;
             if (Object.keys(updatePayload).length > 0) {
                 const res = await supabase
                     .from("clients")
                     .update(updatePayload)
                     .eq("id", editingClient.id);
                 // supabase returns { data, error }
                 error = (res as any).error;
                 if (error) throw error;
             }

            if (form.password && form.password.length >= 6) {
                try {
                    const { data } = await supabase.auth.getSession();
                    const token = data?.session?.access_token;

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
                    if (!response.ok) throw new Error(result.error || "Erro ao atualizar senha");
                } catch (passwordError: any) {
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
                        name: updatePayload.name ?? c.name,
                        phone: updatePayload.phone ?? c.phone,
                        email: updatePayload.email ?? c.email,
                        cpf: updatePayload.cpf ?? c.cpf,
                        vehicle: updatePayload.vehicle ?? c.vehicle,
                        plate: updatePayload.plate ?? c.plate,
                        maxReplacements: updatePayload.max_replacements ?? c.maxReplacements,
                        is_cooperative: updatePayload.is_cooperative ?? c.is_cooperative,
                        value_per_car: updatePayload.value_per_car ?? c.value_per_car
                    }
                    : c
            );
            setClients(updatedClients);
            setForm({ 
                name: "", 
                phone: "", 
                email: "", 
                cpf: "", 
                vehicle: "", 
                plate: "", 
                password: "", 
                maxReplacements: 3,
                is_cooperative: false,
                value_per_car: 0
            });
            setEditingClient(null);
            setEditDialogOpen(false);

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
            maxReplacements: client.maxReplacements,
            is_cooperative: client.is_cooperative || false,
            value_per_car: client.value_per_car || 0
        });
        setEditDialogOpen(true);
    };

    const togglePlanActive = async (client: Client) => {
        try {
            const newStatus = !client.planActive;
            const updateData: any = { plan_active: newStatus };

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
                    installations: 1,
                    service_date: new Date().toISOString().split("T")[0],
                });

            if (serviceError) throw serviceError;

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

            if (replacementData && replacementData[0]) {
                logAction("register", "replacements", replacementData[0].id, selectedClient.name, `Item trocado: ${replForm.item} - Funcionário: ${emp?.name || "N/A"} - ${replForm.notes ? "Obs: " + replForm.notes : ""}`);
            }

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

    const uploadServicePhoto = async (file: File, clientId: string, index: number) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${clientId}/services/${Date.now()}_photo_${index}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("vehicle-photos")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("vehicle-photos")
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error(`Erro ao fazer upload da foto ${index + 1}:`, error);
            return null;
        }
    };

    const handleAddServiceWithPhotos = async () => {
        if (!selectedClient) {
            toast({ title: "Selecione um cliente", variant: "destructive" });
            return;
        }
        if (selectedClient.replacementsUsed >= selectedClient.maxReplacements) {
            toast({ title: "Cliente atingiu o limite de trocas/serviços!", variant: "destructive" });
            return;
        }
        
        if (servicePhotos.some(photo => photo === null)) {
            toast({ title: "Erro no envio das fotos", description: "Por favor, selecione as 5 fotos exigidas para o serviço.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        setUploadingPhotos(true);
        try {
            const uploadPromises = servicePhotos.map((file, idx) => 
                uploadServicePhoto(file!, selectedClient.id, idx + 1)
            );
            const photoUrls = await Promise.all(uploadPromises);

            if (photoUrls.some(url => url === null)) {
                throw new Error("Falha ao fazer upload de uma ou mais fotos do serviço.");
            }

            // Ensure we have an employee; if none, create a temporary 'Teste' employee for quick testing
            let emp = employees.find((e) => e.id === replForm.employeeId) || employees[0];
            if (!emp) {
                try {
                    const resEmp = await supabase
                        .from("employees")
                        .insert({ name: "Teste" })
                        .select();
                    if ((resEmp as any).error) throw (resEmp as any).error;
                    emp = (resEmp as any).data[0];
                } catch (e) {
                    toast({ title: "Erro ao registrar serviço", description: "Nenhum funcionário disponível e não foi possível criar um funcionário temporário.", variant: "destructive" });
                    throw e;
                }
            }

            const employeeIdToUse = emp.id;
            const employeeNameToUse = emp.name;

            // First insert into services (so photos are definitely saved in a table that has photo_url columns)
            let serviceData: any = null;
            try {
                const svcRes = await supabase
                    .from("services")
                    .insert({
                        client_id: selectedClient.id,
                        client_name: selectedClient.name,
                        service_type: replForm.item || 'Serviço',
                        service_date: new Date().toISOString().split("T")[0],
                        employee_id: employeeIdToUse,
                        employee_name: employeeNameToUse,
                        photo_url_1: photoUrls[0],
                        photo_url_2: photoUrls[1],
                        photo_url_3: photoUrls[2],
                        photo_url_4: photoUrls[3],
                        photo_url_5: photoUrls[4]
                    })
                    .select();
                if ((svcRes as any).error) throw (svcRes as any).error;
                serviceData = (svcRes as any).data;
            } catch (svcErr) {
                console.error("Erro ao inserir em services:", svcErr);
                throw svcErr;
            }

            // Then create a replacement record (without photos) to track the replacement/service
            let replacementData: any = null;
            try {
                const replRes = await supabase
                    .from("replacements")
                    .insert({
                        client_id: selectedClient.id,
                        client_name: selectedClient.name,
                        item: replForm.item || 'Serviço',
                        date: new Date().toISOString().split("T")[0],
                        employee_id: employeeIdToUse,
                        employee_name: employeeNameToUse
                    })
                    .select();
                if ((replRes as any).error) throw (replRes as any).error;
                replacementData = (replRes as any).data;
                if (replacementData && replacementData[0]) {
                    logAction("register", "replacements", replacementData[0].id, selectedClient.name, `Serviço com fotos registrado`);
                }
            } catch (replErr) {
                console.error("Erro ao inserir em replacements:", replErr);
                // note: photos are already saved in services; continue
            }

            // Atualiza contador de trocas/serviços do cliente (tanto no client local quanto no DB)
            try {
                const { error: updErr } = await supabase
                    .from("clients")
                    .update({ replacements_used: (selectedClient.replacementsUsed || 0) + 1 })
                    .eq("id", selectedClient.id);
                if (updErr) console.error("Erro ao atualizar replacements_used:", updErr);
            } catch (e) {
                console.error("Erro na atualização de replacements_used:", e);
            }

            await Promise.all([fetchReplacements(), fetchClients()]);

            setServicePhotos([null, null, null, null, null]);
            setServicePhotosDialogOpen(false);
            // Open gallery immediately so user can see saved images (include timestamp)
            const createdAtForPhotos = (serviceData && serviceData[0] && serviceData[0].created_at) || (replacementData && replacementData[0] && replacementData[0].created_at) || new Date().toISOString();
            const savedImgs = (photoUrls.filter(Boolean) as string[]).map((u) => ({ url: u, ts: createdAtForPhotos }));
            if (savedImgs.length > 0) {
                setServiceGalleryImages(savedImgs);
                setGalleryClient(selectedClient);
                setServiceGalleryOpen(true);
                toast({ title: `Serviço registrado com ${savedImgs.length} fotos!` });
            } else {
                toast({ title: "Serviço registrado com sucesso!" });
            }
            setSelectedClient(null);
        } catch (error: any) {
            toast({
                title: "Erro ao registrar serviço",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
            setUploadingPhotos(false);
        }
    };

    const fetchServiceImagesForClient = async (clientId: string) => {
        try {
            const imgs: { url: string; ts?: string }[] = [];

            // try replacements (include created_at and date)
            const { data: replData, error: replErr } = await supabase
                .from("replacements")
                .select("photo_url_1,photo_url_2,photo_url_3,photo_url_4,photo_url_5,created_at,date")
                .eq("client_id", clientId);
            if (!replErr && replData) {
                (replData as any[]).forEach(r => {
                    const ts = r.created_at || r.date || undefined;
                    [r.photo_url_1, r.photo_url_2, r.photo_url_3, r.photo_url_4, r.photo_url_5].forEach((u: any) => { if (u) imgs.push({ url: u, ts }); });
                });
            }

            // try services as well (fallback) — include created_at and service_date
            const { data: svcData, error: svcErr } = await supabase
                .from("services")
                .select("photo_url_1,photo_url_2,photo_url_3,photo_url_4,photo_url_5,created_at,service_date")
                .eq("client_id", clientId);
            if (!svcErr && svcData) {
                (svcData as any[]).forEach(s => {
                    const ts = s.created_at || s.service_date || undefined;
                    [s.photo_url_1, s.photo_url_2, s.photo_url_3, s.photo_url_4, s.photo_url_5].forEach((u: any) => { if (u) imgs.push({ url: u, ts }); });
                });
            }

            // unique by url and preserve order
            const seen = new Set<string>();
            const unique = imgs.filter(i => {
                if (seen.has(i.url)) return false;
                seen.add(i.url);
                return true;
            });

            return unique;
        } catch (e) {
            console.error("Erro ao buscar imagens de serviços:", e);
            return [];
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
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => navigate("/whatsapp")}
                            className="flex items-center gap-2 border-primary/30 text-foreground hover:bg-primary/10 hover:text-[#2c3493] h-10 px-4"
                        >
                            <MessageSquare className="w-4 h-4 text-primary" /> Automação WhatsApp
                        </Button>
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
                                        <div><Label>CPF / CNPJ</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="Digite o documento" /></div>
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
                    </div>
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
                        
                        // Encontrar foto do veículo primário para exibir na miniatura
                        const primaryVehicle = clientVehicles.find(v => v.client_id === client.id && v.is_primary);
                        const displayPhotoUrl = primaryVehicle?.vehicle_photo_url || primaryVehicle?.photo_front_url;

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
                                        {displayPhotoUrl ? (
                                            <button
                                                onClick={() => {
                                                    setSelectedPhotoUrl(displayPhotoUrl);
                                                    setPhotoModalOpen(true);
                                                }}
                                                className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                                            >
                                                <img
                                                    src={displayPhotoUrl}
                                                    alt={client.vehicle}
                                                    className="w-10 h-10 object-cover rounded-full border border-border"
                                                />
                                            </button>
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${client.active && !isExpired ? "bg-success/15" : "bg-destructive/15"}`}>
                                                {client.active && !isExpired ? <UserCheck className="w-5 h-5 text-success" /> : <UserX className="w-5 h-5 text-destructive" />}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                             <div className="flex items-center gap-2">
                                                 <p className="font-semibold text-foreground truncate">{client.name}</p>
                                                 <ClientStatusBadge
                                                     planStatus={getPlanStatus(client.planActive, client.planEnd)}
                                                     size="sm"
                                                 />
                                             </div>
                                             <p className="text-sm text-muted-foreground">{client.vehicle} • {client.plate}</p>
                                             <div className="flex items-center gap-2 mt-1">
                                                 <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                                     🚗 {clientVehicles.filter(v => v.client_id === client.id).length} carro{clientVehicles.filter(v => v.client_id === client.id).length !== 1 ? 's' : ''}
                                                 </span>
                                             </div>
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
                                            <p className="text-xs text-muted-foreground">Agendamentos (máx)</p>
                                            <p className="text-xs md:text-sm font-semibold text-foreground">{client.maxReplacements}/ano</p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs mt-1 h-6 w-full"
                                                onClick={() => {
                                                    setEditingClient(client);
                                                    setEditDialogOpen(true);
                                                }}
                                            >
                                                ✏️ Editar
                                            </Button>
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
                                             variant="outline"
                                             className={`gap-1.5 text-xs md:text-sm flex-1 md:flex-none font-medium transition-all ${
                                                client.planActive 
                                                ? "border-success/50 text-success hover:bg-success/10 hover:border-success" 
                                                : "border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                                             }`}
                                             onClick={() => togglePlanActive(client)}
                                         >
                                             {client.planActive ? "Plano: ON" : "Plano: OFF"}
                                         </Button>

                                         <Button
                                             size="sm"
                                             variant="outline"
                                             className={`gap-1.5 text-xs md:text-sm flex-1 md:flex-none font-medium transition-all ${
                                                client.is_cooperative 
                                                ? "border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100" 
                                                : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                             }`}
                                             onClick={() => toggleCooperative(client)}
                                             disabled={bulkUploadToggling}
                                         >
                                             <Repeat className="w-3.5 h-3.5" /> {client.is_cooperative ? "Cooperativa: SIM" : "Cooperativa: NÃO"}
                                         </Button>

                                         <Button
                                             size="sm"
                                             variant="outline"
                                             className="gap-1.5 text-xs md:text-sm flex-1 md:flex-none font-medium border-blue-500/50 text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition-all"
                                             onClick={() => { setReportingClient(client); setReportDialogOpen(true); }}
                                         >
                                             <FileText className="w-3.5 h-3.5" /> Relatório
                                         </Button>

                                         <Button
                                             size="sm"
                                             variant="outline"
                                             className="gap-1.5 text-xs md:text-sm flex-1 md:flex-none font-medium border-border text-muted-foreground hover:bg-accent transition-all"
                                             onClick={() => { setViewedClient(client); setViewDialogOpen(true); }}
                                         >
                                             <Eye className="w-3.5 h-3.5" /> Ver
                                         </Button>

                                         <Button
                                             size="sm"
                                             variant="outline"
                                             className="gap-1.5 text-xs md:text-sm flex-1 md:flex-none font-medium border-border text-muted-foreground hover:bg-accent transition-all"
                                             onClick={() => openEditDialog(client)}
                                         >
                                             <Edit2 className="w-3.5 h-3.5" /> Editar
                                         </Button>

                                         <Button
                                             size="sm"
                                             className="gap-1.5 text-xs md:text-sm flex-1 md:flex-none font-semibold gradient-primary text-primary-foreground shadow-sm hover:opacity-90 transition-all"
                                             disabled={client.replacementsUsed >= client.maxReplacements || isExpired || !client.planActive}
                                             onClick={() => { setSelectedClient(client); setReplDialogOpen(true); }}
                                         >
                                             <Repeat className="w-3.5 h-3.5" /> Troca
                                         </Button>

                                         <div className="relative w-full md:w-auto">
                                             <Button
                                                 size="sm"
                                                 className="gap-1.5 text-xs md:text-sm w-full md:w-auto font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                                                 disabled={client.replacementsUsed >= client.maxReplacements || isExpired || !client.planActive}
                                                 onClick={() => { setSelectedClient(client); setServicePhotos([null, null, null, null, null]); setServicePhotosDialogOpen(true); }}
                                             >
                                                 <Plus className="w-3.5 h-3.5" /> +serviços
                                             </Button>
                                            <button
                                                aria-label={`Ver imagens dos serviços de ${client.name}`}
                                                title="Ver imagens dos serviços"
                                                onClick={async (e) => { e.stopPropagation(); const imgs = await fetchServiceImagesForClient(client.id); setServiceGalleryImages(imgs); setGalleryClient(client); setServiceGalleryOpen(true); }}
                                                className="absolute -top-2 -right-2 z-10 bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5 border border-indigo-700 shadow-sm"
                                            >
                                                {client.replacementsUsed}/{client.maxReplacements}
                                            </button>
                                         </div>
                                         </div>

                                         {/* Cooperative Management Bar - Highlighted */}
                                         {client.is_cooperative && (
                                         <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="bg-[#2c3493] rounded-xl p-4 flex flex-wrap items-center gap-4 border border-white/10 shadow-lg shadow-blue-900/20"
                                         >
                                            <div className="flex items-center gap-2 border-r border-white/20 pr-4 mr-2">
                                                <Shield className="w-4 h-4 text-primary" />
                                                <span className="text-white text-[10px] font-black uppercase tracking-wider">Gestão Cooperativa</span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 flex-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`gap-1.5 text-xs font-bold transition-all ${
                                                        client.skip_inspection
                                                        ? "bg-amber-500 text-white hover:bg-amber-600"
                                                        : "bg-white/10 text-white hover:bg-white/20"
                                                    } ${client.is_cooperative ? "opacity-70 cursor-not-allowed" : ""}`}
                                                    onClick={() => !client.is_cooperative && toggleSkipInspection(client)}
                                                    disabled={bulkUploadToggling || client.is_cooperative}
                                                    title={client.is_cooperative ? "Gerenciado pelo status de Cooperativa" : ""}
                                                >
                                                    {client.skip_inspection ? "Vistoria: OFF" : "Vistoria: ON"}
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`gap-1.5 text-xs font-bold transition-all ${
                                                        client.bulk_upload_enabled
                                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                        : "bg-white/10 text-white hover:bg-white/20"
                                                    } ${client.is_cooperative ? "opacity-70 cursor-not-allowed" : ""}`}
                                                    onClick={() => !client.is_cooperative && toggleBulkUpload(client)}
                                                    disabled={bulkUploadToggling || client.is_cooperative}
                                                    title={client.is_cooperative ? "Gerenciado pelo status de Cooperativa" : ""}
                                                >
                                                    <Upload className="w-3.5 h-3.5" />
                                                    {client.bulk_upload_enabled ? "Upload: ON" : "Upload: OFF"}
                                                </Button>

                                                <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-2 ml-auto">
                                                    <span className="text-[10px] font-bold text-blue-200 uppercase tracking-tight">Valor por Carro:</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-white text-xs font-bold">R$</span>
                                                        <input 
                                                            type="number" 
                                                            step="0.01"
                                                            defaultValue={client.value_per_car}
                                                            onBlur={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                if (val !== client.value_per_car) {
                                                                    updateValuePerCar(client, val);
                                                                }
                                                            }}
                                                            className="w-16 bg-transparent border-none text-xs font-black focus:ring-0 p-0 text-primary placeholder:text-blue-300"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                         </motion.div>
                                         )}
                                         </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* View Client Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">{viewedClient?.name}</DialogTitle>
                    </DialogHeader>
                    {viewedClient && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg border-b pb-2">Informações Pessoais</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nome</Label>
                                            <p className="font-semibold">{viewedClient.name}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Telefone</Label>
                                            <p className="font-semibold">{viewedClient.phone}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">E-mail</Label>
                                            <p className="font-semibold break-all">{viewedClient.email || "—"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">CPF / CNPJ</Label>
                                            <p className="font-semibold">{viewedClient.cpf || "—"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg border-b pb-2">Dados do Plano</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Início</Label>
                                            <p className="font-semibold">{new Date(viewedClient.planStart).toLocaleDateString("pt-BR")}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Vencimento</Label>
                                            <p className="font-semibold">{new Date(viewedClient.planEnd).toLocaleDateString("pt-BR")}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                                            <div className="mt-1">
                                                <ClientStatusBadge planStatus={getPlanStatus(viewedClient.planActive!, viewedClient.planEnd)} />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Trocas Usadas</Label>
                                            <p className="font-semibold">{viewedClient.replacementsUsed} / {viewedClient.maxReplacements}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
                                    <Car className="w-5 h-5 text-primary" /> Veículos e Vistoria
                                </h3>
                                {clientVehicles.filter(v => v.client_id === viewedClient.id).length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">Nenhum veículo cadastrado.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {clientVehicles.filter(v => v.client_id === viewedClient.id).map((v) => (
                                            <div key={v.id} className="bg-muted/30 rounded-lg p-4 border border-border">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-foreground">{v.vehicle}</h4>
                                                        <p className="text-sm text-muted-foreground font-mono">{v.plate}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                        v.status === 'approved' ? 'bg-success/10 text-success' : 
                                                        v.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-destructive/10 text-destructive'
                                                    }`}>
                                                        {v.status || 'Pendente'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                                    {[
                                                        { url: v.photo_front_url || v.vehicle_photo_url, label: "Frente" },
                                                        { url: v.photo_back_url, label: "Traseira" },
                                                        { url: v.photo_left_url, label: "Esquerda" },
                                                        { url: v.photo_right_url, label: "Direita" },
                                                        { url: v.photo_headlights_front_url, label: "Faróis F." },
                                                        { url: v.photo_headlights_rear_url, label: "Faróis T." },
                                                        { url: v.photo_mirrors_url, label: "Retrovisores" },
                                                        { url: v.photo_interior_front_url, label: "Int. Frontal" },
                                                        { url: v.photo_interior_rear_url, label: "Int. Traseiro" },
                                                        { url: v.photo_dashboard_url, label: "Painel" },
                                                        { url: v.photo_trunk_open_url, label: "Mala Aberta" }
                                                    ].filter(img => img.url).map((img, idx) => (
                                                        <div key={idx} className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPhotoUrl(img.url!);
                                                                    setPhotoModalOpen(true);
                                                                }}
                                                                className="relative aspect-square bg-black/5 rounded overflow-hidden group hover:ring-2 hover:ring-primary transition-all"
                                                            >
                                                                <img src={img.url!} className="w-full h-full object-cover" alt={img.label} />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Eye className="w-4 h-4 text-white" />
                                                                </div>
                                                            </button>
                                                            <span className="text-[8px] text-center text-muted-foreground truncate">{img.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {![v.photo_front_url, v.vehicle_photo_url, v.photo_back_url, v.photo_left_url, v.photo_right_url, v.photo_headlights_front_url, v.photo_headlights_rear_url, v.photo_mirrors_url, v.photo_interior_front_url, v.photo_interior_rear_url, v.photo_dashboard_url, v.photo_trunk_open_url].some(url => url) && (
                                                    <p className="text-xs text-muted-foreground italic text-center py-2">Sem fotos registradas para este veículo.</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 mt-6">
                                <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
                                    <Repeat className="w-5 h-5 text-indigo-600" /> Histórico de Trocas / Serviços
                                </h3>
                                {replacements.filter(r => r.clientId === viewedClient.id).length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic text-center py-4 bg-muted/10 rounded-lg border border-dashed font-display">Nenhuma troca ou serviço registrado.</p>
                                ) : (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                        {replacements.filter(r => r.clientId === viewedClient.id).map((r) => {
                                            const servicePhotosList = [
                                                r.photo_url_1,
                                                r.photo_url_2,
                                                r.photo_url_3,
                                                r.photo_url_4,
                                                r.photo_url_5
                                            ].filter(Boolean);

                                            return (
                                                <div key={r.id} className="bg-muted/30 rounded-lg p-4 border border-border text-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-semibold text-foreground text-base">{r.item}</p>
                                                            <p className="text-xs text-muted-foreground">Responsável: {r.employeeName}</p>
                                                        </div>
                                                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                            {new Date(r.createdAt || r.date).toLocaleString("pt-BR")}
                                                        </span>
                                                    </div>
                                                    {r.notes && (
                                                        <p className="text-xs text-muted-foreground bg-card p-2 rounded mb-2 border border-border">
                                                            <strong>Observações:</strong> {r.notes}
                                                        </p>
                                                    )}
                                                    {servicePhotosList.length > 0 && (
                                                        <div className="space-y-2 mt-2">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fotos do Serviço:</p>
                                                            <div className="grid grid-cols-5 gap-2">
                                                                {servicePhotosList.map((url, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={() => {
                                                                            setSelectedPhotoUrl(url!);
                                                                            setPhotoModalOpen(true);
                                                                        }}
                                                                        className="relative aspect-square bg-black/5 rounded-lg overflow-hidden group hover:ring-2 hover:ring-indigo-600 transition-all shadow-sm"
                                                                    >
                                                                        <img src={url!} className="w-full h-full object-cover" alt={`Foto Serviço ${idx + 1}`} />
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                            <Eye className="w-4 h-4 text-white" />
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                            <div><Label>CPF / CNPJ</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="Digite o documento" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Veículo *</Label><Input value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} placeholder="Honda Civic 2022" /></div>
                            <div><Label>Placa</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="ABC-1D23" /></div>
                        </div>
                        <div>
                            <Label>Agendamentos por ano</Label>
                            <Input
                                type="number"
                                min="1"
                                value={form.maxReplacements}
                                onChange={(e) => setForm({ ...form, maxReplacements: parseInt(e.target.value) || 3 })}
                                placeholder="3"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Para seguradoras ou clientes especiais, defina um limite maior</p>
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

            {/* Service with 5 Photos dialog */}
            <Dialog open={servicePhotosDialogOpen} onOpenChange={setServicePhotosDialogOpen}>
                <DialogContent className="bg-card border-border max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-display">Registrar Serviço (+fotos) — {selectedClient?.name}</DialogTitle>
                    </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-foreground">Fotos do Serviço (Exige exatamente 5 fotos) *</Label>
                                    <div className="grid grid-cols-5 gap-2">
                                {[0, 1, 2, 3, 4].map((index) => {
                                    const photo = servicePhotos[index];
                                    const previewUrl = photo ? URL.createObjectURL(photo) : null;
                                    return (
                                        <div key={index} className="flex flex-col items-center">
                                            <label className={`relative aspect-square w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-muted/50 overflow-hidden ${photo ? 'border-primary' : 'border-border'}`}>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const newPhotos = [...servicePhotos];
                                                            newPhotos[index] = file;
                                                            setServicePhotos(newPhotos);
                                                        }
                                                    }}
                                                />
                                                {previewUrl ? (
                                                    <>
                                                        <img src={previewUrl} className="w-full h-full object-cover" alt={`Foto ${index + 1}`} />
                                                        <button
                                                            type="button"
                                                            className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md hover:bg-destructive/90"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                const newPhotos = [...servicePhotos];
                                                                newPhotos[index] = null;
                                                                setServicePhotos(newPhotos);
                                                            }}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center text-center p-1">
                                                        <Camera className="w-4 h-4 text-muted-foreground mb-1" />
                                                        <span className="text-[9px] text-muted-foreground font-medium">Foto {index + 1}</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Button 
                            onClick={handleAddServiceWithPhotos} 
                            disabled={submitting || uploadingPhotos} 
                            className="w-full gradient-primary text-primary-foreground font-semibold"
                        >
                            {submitting || uploadingPhotos ? "Salvando imagens..." : "Salvar Imagens"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal para Visualizar Foto do Veículo */}
            <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
                <DialogContent className="bg-card border-border max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display">Foto do Veículo</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center items-center">
                        <img
                            src={selectedPhotoUrl}
                            alt="Veículo"
                            className="max-w-full max-h-96 rounded-lg object-contain"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Service Gallery Dialog (previous services images) */}
            <Dialog open={serviceGalleryOpen} onOpenChange={setServiceGalleryOpen}>
                <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-display">Fotos de Serviços — {galleryClient?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        {serviceGalleryImages.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhuma foto de serviço encontrada.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                {serviceGalleryImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setSelectedPhotoUrl(img.url); setPhotoModalOpen(true); }}
                                        className="relative aspect-square bg-black/5 rounded-lg overflow-hidden group hover:ring-2 hover:ring-primary transition-all shadow-sm"
                                    >
                                        <img src={img.url} className="w-full h-full object-cover" alt={`Foto Serviço ${idx + 1}`} />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Eye className="w-4 h-4 text-white" />
                                        </div>
                                        {img.ts && (
                                            <div className="absolute left-1 bottom-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                                                {new Date(img.ts).toLocaleString("pt-BR")}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Report Period Dialog */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="font-display">Gerar Relatório de Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Selecione o período dos serviços</Label>
                            <Select 
                                value={reportPeriod} 
                                onValueChange={(v: any) => setReportPeriod(v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o período" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="week">Última Semana</SelectItem>
                                    <SelectItem value="month">Último Mês</SelectItem>
                                    <SelectItem value="quarter">Último Trimestre</SelectItem>
                                    <SelectItem value="all">Todo o Período</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                            <p>O relatório incluirá:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Dados cadastrais do cliente</li>
                                <li>Lista de veículos e quantidade de carros</li>
                                <li>Frequência de serviços por veículo</li>
                                <li>Histórico detalhado no período selecionado</li>
                            </ul>
                        </div>
                        <Button 
                            onClick={handleGenerateReport} 
                            className="w-full gradient-primary text-primary-foreground font-semibold"
                        >
                            Gerar PDF
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Clients;
