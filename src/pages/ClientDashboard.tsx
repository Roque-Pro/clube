import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Shield, Edit, Save, X, Mail, Phone, User, Car, LogOut, Calendar, Plus, Trash2, Check, AlertCircle, Upload, Image, DollarSign, Eye, Clock, Camera, CreditCard, CalendarCheck, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVehicleValidation } from "@/hooks/useVehicleValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BulkVehicleUpload } from "@/components/BulkVehicleUpload";
import PlanStatusCard from "@/components/PlanStatusCard";
import PlanPaymentModal from "@/components/PlanPaymentModal";
import PlanPromotionCard from "@/components/PlanPromotionCard";
import { getStripePriceIdForValue } from "@/data/stripePrices";

interface ClientProfile {
     id?: string;
     user_id?: string;
     name: string;
     email: string;
     phone: string;
     cpf: string;
     vehicle: string;
     plate: string;
     replacements_used?: number;
     max_replacements?: number;
     plan_active?: boolean;
     plan_paid_at?: string;
     plan_start?: string;
     plan_end?: string;
     profile_status?: string;
     is_cooperative?: boolean;
     skip_inspection?: boolean;
     bulk_upload_enabled?: boolean;
     value_per_car?: number;
}

interface ClientVehicle {
     id: string;
     vehicle: string;
     plate: string;
     is_national: boolean;
     is_primary: boolean;
     vehicle_photo_url?: string;
     photo_front_url?: string;
     photo_back_url?: string;
     photo_left_url?: string;
     photo_right_url?: string;
     photo_headlights_front_url?: string;
     photo_headlights_rear_url?: string;
     photo_mirrors_url?: string;
     photo_interior_rear_url?: string;
     photo_interior_front_url?: string;
     photo_dashboard_url?: string;
     photo_trunk_open_url?: string;
      status?: string;
      plan_active?: boolean;
      plan_start?: string;
      plan_end?: string;
      plan_paid_at?: string;
      monthly_price?: number;
      stripe_price_id?: string;
      free_until?: string;
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

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() || "";
const normalizeCpf = (value?: string | null) => value?.trim() || "";
const normalizePlate = (value?: string | null) => value?.trim().toUpperCase() || "";

const getVehicleMonthlyPrice = (vehicle?: ClientVehicle | null, fallback?: number | null) => {
    const vehiclePrice = Number(vehicle?.monthly_price);
    if (Number.isFinite(vehiclePrice) && vehiclePrice > 0) return vehiclePrice;
    return fallback && fallback > 0 ? fallback : 19.9;
};

const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

const isVehiclePlanActive = (vehicle: ClientVehicle) =>
    Boolean(vehicle.plan_active && vehicle.plan_end && new Date(vehicle.plan_end) > new Date());

const isVehicleFreeActive = (vehicle: ClientVehicle) =>
    Boolean(vehicle.free_until && new Date(vehicle.free_until) > new Date());

const isVehicleEligibleForAppointment = (vehicle: ClientVehicle) =>
    isVehiclePlanActive(vehicle) || isVehicleFreeActive(vehicle);

const getFreeDaysRemaining = (freeUntil?: string) => {
    if (!freeUntil) return 0;
    const diff = new Date(freeUntil).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

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
        videoFile: null as File | null,
    });
    const [appointmentVideoPreview, setAppointmentVideoPreview] = useState<string>("");
    const [uploadingAppointmentVideo, setUploadingAppointmentVideo] = useState(false);
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");
    const [clientVehicles, setClientVehicles] = useState<ClientVehicle[]>([]);
    const [addVehicleDialogOpen, setAddVehicleDialogOpen] = useState(false);
    const [newVehicleForm, setNewVehicleForm] = useState({ 
        vehicle: "", 
        plate: "", 
        photoFront: null as File | null,
        photoBack: null as File | null,
        photoLeft: null as File | null,
        photoRight: null as File | null,
        photoHeadlightsFront: null as File | null,
        photoHeadlightsRear: null as File | null,
        photoMirrors: null as File | null,
        photoInteriorRear: null as File | null,
        photoInteriorFront: null as File | null,
        photoDashboard: null as File | null,
        photoTrunkOpen: null as File | null
    });
    const [photoPreviews, setPhotoPreviews] = useState({
        front: "",
        back: "",
        left: "",
        right: "",
        headlightsFront: "",
        headlightsRear: "",
        mirrors: "",
        interiorRear: "",
        interiorFront: "",
        dashboard: "",
        trunkOpen: ""
    });
    const [uploadingVehiclePhoto, setUploadingVehiclePhoto] = useState(false);
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
    const [bulkUploadEnabled, setBulkUploadEnabled] = useState(false);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>("");
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [selectedVehicleForPayment, setSelectedVehicleForPayment] = useState<string | null>(null);
    const [syncingPlanState, setSyncingPlanState] = useState(false);

    // ... inside ClientDashboard ...
    const now = new Date();
    const activeVehiclePlans = clientVehicles
        .filter((vehicle) => vehicle.plan_active && vehicle.plan_end && new Date(vehicle.plan_end) > new Date())
        .sort((a, b) => (b.plan_end || "").localeCompare(a.plan_end || ""));
    const latestActiveVehiclePlan = activeVehiclePlans[0];
    const hasActiveVehiclePlan = activeVehiclePlans.length > 0;
    const effectivePlanActive = hasActiveVehiclePlan;
    const effectivePlanEnd = latestActiveVehiclePlan?.plan_end || clientData?.plan_end || null;
    const planEndDate = effectivePlanEnd ? new Date(effectivePlanEnd) : null;
    const isPlanExpired = effectivePlanActive && planEndDate ? now > planEndDate : false;
    const calculatedPlanStatus: "free" | "active" | "expired" = effectivePlanActive
        ? (isPlanExpired ? "expired" : "active")
        : "free";

    const isPendingApproval = clientData?.profile_status === "pending" || 
                             clientVehicles.some(v => v.status === "pending");
    const appointmentEligibleVehicles = clientVehicles.filter(isVehicleEligibleForAppointment);
    const hasAppointmentEligibleVehicle = appointmentEligibleVehicles.length > 0;
    const selectedPaymentVehicle = clientVehicles.find((vehicle) => vehicle.id === selectedVehicleForPayment) || null;
    const selectedPaymentMonthlyPrice = getVehicleMonthlyPrice(selectedPaymentVehicle, clientData?.value_per_car);

    const handlePaymentClick = (vehicleId: string) => {
        setSelectedVehicleForPayment(vehicleId);
        setPaymentModalOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!clientData?.id || !selectedVehicleForPayment) return;
        const vehicleToPay = clientVehicles.find((vehicle) => vehicle.id === selectedVehicleForPayment);
        const vehiclePrice = getVehicleMonthlyPrice(vehicleToPay, clientData?.value_per_car);
        const stripePriceId = vehicleToPay?.stripe_price_id || getStripePriceIdForValue(vehiclePrice);
        if (!stripePriceId) {
            toast({
                title: "Pagamento indisponível",
                description: "Este valor ainda não possui um produto na Stripe configurado. Entre em contato conosco.",
                variant: "destructive",
            });
            return;
        }

        if (vehicleToPay && !vehicleToPay.stripe_price_id) {
            supabase
                .from("client_vehicles")
                .update({ stripe_price_id: stripePriceId })
                .eq("id", vehicleToPay.id)
                .then(({ error: updateError }) => {
                    if (updateError) console.error("Erro ao gravar stripe_price_id:", updateError.message);
                });
        }

        setIsProcessingPayment(true);
        try {
            const { data, error } = await supabase.functions.invoke("create-stripe-checkout", {
                body: {
                    vehicleId: selectedVehicleForPayment,
                    priceId: stripePriceId,
                    successUrl: window.location.origin + "/client-dashboard?payment=success",
                    cancelUrl: window.location.origin + "/client-dashboard?payment=cancel",
                },
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Não foi possível gerar o link de pagamento.");
            }
        } catch (error: any) {
            toast({ title: "Erro no pagamento", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const replacementItems = ["Para-brisa", "Retrovisor", "Vigia", "Farol", "Janela", "Porta", "Óculos", "Insumo", "Ferramenta", "Outro"];

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

    // Handle Stripe redirect notifications
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("payment") === "success") {
            toast({
                title: "Pagamento em processamento!",
                description: "Seu plano será ativado em instantes. Aguarde a confirmação.",
            });
            // Limpar os parâmetros da URL sem recarregar a página
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (params.get("payment") === "cancel") {
            toast({
                title: "Pagamento cancelado",
                description: "Você pode tentar novamente quando quiser.",
                variant: "destructive",
            });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [toast]);

    // Fetch client profile data and appointments
    useEffect(() => {
        const fetchClientData = async () => {
            try {
                const userId = session.user?.id;
                const userEmail = session.user?.email;


                if (!userId) {
                    setDataLoading(false);
                    return;
                }

                let clientRecord: any = null;

                // 1. Tentar buscar registro do cliente na tabela 'clients' por user_id
                const { data: byUserId } = await supabase
                    .from("clients")
                    .select("*")
                    .eq("user_id", userId)
                    .maybeSingle();

                if (byUserId) {
                    clientRecord = byUserId;
                } else {
                    // 2. Fallback: buscar por email (para clientes legados sem user_id)
                    const normalizedEmail = normalizeEmail(userEmail);
                    const { data: byEmail } = await supabase
                        .from("clients")
                        .select("*")
                        .eq("email", normalizedEmail)
                        .maybeSingle();

                    if (byEmail) {
                        clientRecord = byEmail;
                        // Vincula o cadastro legado ao usuário autenticado para evitar
                        // futuros fallbacks por email e garantir persistência correta.
                        if (!byEmail.user_id || byEmail.user_id !== userId) {
                            const { error: linkError } = await supabase
                                .from("clients")
                                .update({ user_id: userId })
                                .eq("id", byEmail.id);
                            if (!linkError) {
                                clientRecord = { ...byEmail, user_id: userId };
                            }
                        }
                    } else {
                        // 3. Se nenhum registro de cliente foi encontrado, criar um novo
                        // na tabela 'clients' usando os dados da sessão e do perfil.
                        const { data: profileForNewClient } = await supabase
                            .from("profiles")
                            .select("full_name, phone, cpf")
                            .eq("id", userId)
                            .maybeSingle();

                        const newClientData = {
                            user_id: userId,
                            email: userEmail || "",
                            name: profileForNewClient?.full_name || "",
                            phone: profileForNewClient?.phone || "",
                            cpf: profileForNewClient?.cpf || "",
                            // Outros campos padrões para um novo cliente se necessário (se existirem na tabela 'clients')
                            // Ex: plan_active: false, replacements_used: 0, etc.
                        };

                        const { data: createdClient, error: createClientError } = await supabase
                            .from("clients")
                            .insert(newClientData)
                            .select("*")
                            .single();

                        if (createClientError) {
                            console.error("Erro ao criar novo cliente:", createClientError);
                            // Se houver um erro na criação do cliente, ainda podemos tentar exibir dados do perfil
                            // mas a funcionalidade de veículos/agendamentos pode ser limitada
                            throw createClientError; // Lançar erro para ser pego pelo catch externo e setar clientData como null
                        }
                        clientRecord = createdClient;
                        toast({ title: "Bem-vindo!", description: "Seu perfil de cliente foi criado." });
                    }
                }

                // A partir deste ponto, clientRecord SEMPRE deve existir para um usuário logado.
                // Agora, buscar os dados completos do perfil para display (nome, telefone, cpf, status).
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("status, full_name, phone, cpf")
                    .eq("id", userId) // Usar userId da sessão para buscar profile, que é a fonte primária dos dados de cadastro.
                    .maybeSingle();

                const userMeta = session.user?.user_metadata || {};
                const resolvedName = profileData?.full_name || clientRecord.name || userMeta.full_name || "";
                const resolvedEmail = clientRecord.email || session.user?.email || "";
                const resolvedPhone = profileData?.phone || clientRecord.phone || userMeta.phone || "";
                const resolvedCpf = profileData?.cpf || clientRecord.cpf || userMeta.cpf || "";
                const resolvedVehicle = clientRecord.vehicle || userMeta.vehicle || "";
                const resolvedPlate = clientRecord.plate || userMeta.plate || "";

                setClientData({
                    ...clientRecord, // Garante que temos o ID do cliente e outros campos de 'clients'
                    name: resolvedName,
                    email: resolvedEmail,
                    phone: resolvedPhone,
                    cpf: resolvedCpf,
                    vehicle: resolvedVehicle,
                    plate: resolvedPlate,
                    profile_status: profileData?.status || "pending"
                });
                setFormData({
                    ...clientRecord, // Garante que temos o ID do cliente e outros campos de 'clients'
                    name: resolvedName,
                    email: resolvedEmail,
                    phone: resolvedPhone,
                    cpf: resolvedCpf,
                    plate: resolvedPlate,
                    vehicle: resolvedVehicle,
                });
                setBulkUploadEnabled(clientRecord.bulk_upload_enabled || false);

                // Configurar Realtime para sincronizar permissões do admin
                const channel = supabase
                    .channel(`client-sync-${clientRecord.id}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'clients',
                            filter: `id=eq.${clientRecord.id}`
                        },
                        (payload) => {
                            console.log('🔄 Sincronizando dados do cliente via Realtime:', payload.new);
                            setClientData(prev => prev ? ({ ...prev, ...payload.new }) : null);
                            if (payload.new.bulk_upload_enabled !== undefined) {
                                setBulkUploadEnabled(payload.new.bulk_upload_enabled);
                            }
                        }
                    )
                    .subscribe();

                // Estas chamadas agora são seguras, pois clientRecord.id sempre existirá
                fetchAppointments(clientRecord.id);
                fetchClientVehicles(clientRecord.id);

                return () => {
                    supabase.removeChannel(channel);
                };
            } catch (err) {
                setClientData(null);
            } finally {
                setDataLoading(false);
            }
        };

        if (session?.user?.id) {
            fetchClientData();
        } else {
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

    useEffect(() => {
        const syncClientPlanState = async () => {
            if (!clientData?.id || syncingPlanState) {
                return;
            }

            const currentPlanEnd = clientData.plan_end || null;
            const latestVehiclePlan = activeVehiclePlans[0];
            const nextPlanActive = activeVehiclePlans.length > 0;
            const nextPlanEnd = latestVehiclePlan?.plan_end || currentPlanEnd;
            const nextPlanStart = latestVehiclePlan?.plan_start || clientData.plan_start || null;
            const nextPlanPaidAt = latestVehiclePlan?.plan_paid_at || clientData.plan_paid_at || null;

            const shouldUpdate =
                clientData.plan_active !== nextPlanActive ||
                (nextPlanActive && currentPlanEnd !== nextPlanEnd);

            if (!shouldUpdate) {
                return;
            }

            setSyncingPlanState(true);

            try {
                const updatePayload: Record<string, string | boolean | null> = {
                    plan_active: nextPlanActive,
                };

                if (nextPlanActive) {
                    updatePayload.plan_start = nextPlanStart;
                    updatePayload.plan_end = nextPlanEnd;
                    updatePayload.plan_paid_at = nextPlanPaidAt;
                } else {
                    updatePayload.plan_paid_at = null;
                }

                const { error } = await supabase
                    .from("clients")
                    .update(updatePayload)
                    .eq("id", clientData.id);

                if (error) throw error;

                setClientData((prev) =>
                    prev
                        ? {
                              ...prev,
                              plan_active: nextPlanActive,
                              plan_start: nextPlanActive ? (nextPlanStart || prev.plan_start) : prev.plan_start,
                              plan_end: nextPlanActive ? (nextPlanEnd || prev.plan_end) : prev.plan_end,
                              plan_paid_at: nextPlanActive ? (nextPlanPaidAt || prev.plan_paid_at) : prev.plan_paid_at,
                          }
                        : prev
                );
            } catch (error) {
                console.error("Erro ao sincronizar status do plano do cliente:", error);
            } finally {
                setSyncingPlanState(false);
            }
        };

        syncClientPlanState();
    }, [activeVehiclePlans, clientData, syncingPlanState]);

    const uploadVehiclePhoto = async (file: File, clientId: string, side: string) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${clientId}/${Date.now()}_${side}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("vehicle-photos")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("vehicle-photos")
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error(`Erro ao fazer upload da foto ${side}:`, error);
            return null;
        }
    };

    const handlePhotoChange = (side: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast({ title: "Selecione uma imagem válida", variant: "destructive" });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "Imagem muito grande (máx 5MB)", variant: "destructive" });
            return;
        }

        const fieldMap: Record<string, string> = {
            front: "photoFront",
            back: "photoBack",
            left: "photoLeft",
            right: "photoRight",
            headlightsFront: "photoHeadlightsFront",
            headlightsRear: "photoHeadlightsRear",
            mirrors: "photoMirrors",
            interiorRear: "photoInteriorRear",
            interiorFront: "photoInteriorFront",
            dashboard: "photoDashboard",
            trunkOpen: "photoTrunkOpen"
        };

        setNewVehicleForm({ ...newVehicleForm, [fieldMap[side]]: file });
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreviews(prev => ({ ...prev, [side]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleValidateAndAddVehicle = () => {
        if (!clientData) return false;
        if (!newVehicleForm.vehicle || !newVehicleForm.plate) {
            toast({ title: "Preencha veículo e placa", variant: "destructive" });
            return false;
        }

        const skipInspection = (clientData as any)?.skip_inspection;

        if (!skipInspection && (
            !newVehicleForm.photoFront || !newVehicleForm.photoBack || !newVehicleForm.photoLeft || !newVehicleForm.photoRight ||
            !newVehicleForm.photoHeadlightsFront || !newVehicleForm.photoHeadlightsRear || !newVehicleForm.photoMirrors ||
            !newVehicleForm.photoInteriorRear || !newVehicleForm.photoInteriorFront || !newVehicleForm.photoDashboard ||
            !newVehicleForm.photoTrunkOpen
        )) {
            toast({ title: "Todas as 11 fotos do veículo são obrigatórias para vistoria", variant: "destructive" });
            return false;
        }

        setValidationResult({ 
            isNational: true, 
            message: "Veículo aceito.", 
            brand: "N/A", 
            model: "N/A", 
            confidence: 1 
        });
        return true;
    };

    const handleConfirmAddVehicle = async () => {
        if (!clientData) return;
        
        const skipInspection = (clientData as any)?.skip_inspection === true;
        
        if (!skipInspection && !handleValidateAndAddVehicle()) return;

        try {
            setUploadingVehiclePhoto(true);
            
            let photoUrls = { 
                front: "", back: "", left: "", right: "",
                headlightsFront: "", headlightsRear: "", mirrors: "",
                interiorRear: "", interiorFront: "", dashboard: "", trunkOpen: ""
            };

            if (!skipInspection) {
                // ... (upload logic for photos)
                const uploadPromises = [
                    uploadVehiclePhoto(newVehicleForm.photoFront!, clientData.id!, `${newVehicleForm.plate}_front`),
                    uploadVehiclePhoto(newVehicleForm.photoBack!, clientData.id!, `${newVehicleForm.plate}_back`),
                    uploadVehiclePhoto(newVehicleForm.photoLeft!, clientData.id!, `${newVehicleForm.plate}_left`),
                    uploadVehiclePhoto(newVehicleForm.photoRight!, clientData.id!, `${newVehicleForm.plate}_right`),
                    uploadVehiclePhoto(newVehicleForm.photoHeadlightsFront!, clientData.id!, `${newVehicleForm.plate}_headlights_front`),
                    uploadVehiclePhoto(newVehicleForm.photoHeadlightsRear!, clientData.id!, `${newVehicleForm.plate}_headlights_rear`),
                    uploadVehiclePhoto(newVehicleForm.photoMirrors!, clientData.id!, `${newVehicleForm.plate}_mirrors`),
                    uploadVehiclePhoto(newVehicleForm.photoInteriorRear!, clientData.id!, `${newVehicleForm.plate}_interior_rear`),
                    uploadVehiclePhoto(newVehicleForm.photoInteriorFront!, clientData.id!, `${newVehicleForm.plate}_interior_front`),
                    uploadVehiclePhoto(newVehicleForm.photoDashboard!, clientData.id!, `${newVehicleForm.plate}_dashboard`),
                    uploadVehiclePhoto(newVehicleForm.photoTrunkOpen!, clientData.id!, `${newVehicleForm.plate}_trunk_open`)
                ];

                const results = await Promise.all(uploadPromises);
                if (results.some(r => !r)) {
                    toast({ title: "Erro ao fazer upload de uma ou mais fotos", variant: "destructive" });
                    return;
                }
                photoUrls = { 
                    front: results[0]!, back: results[1]!, left: results[2]!, right: results[3]!,
                    headlightsFront: results[4]!, headlightsRear: results[5]!, mirrors: results[6]!,
                    interiorRear: results[7]!, interiorFront: results[8]!, dashboard: results[9]!, trunkOpen: results[10]!
                };
            }

            const isPrimary = clientVehicles.length === 0;

            const { error } = await supabase
                .from("client_vehicles")
                .insert({
                    client_id: clientData.id,
                    vehicle: newVehicleForm.vehicle,
                    plate: newVehicleForm.plate,
                    is_national: true,
                    is_primary: isPrimary,
                    vehicle_photo_url: photoUrls.front || null,
                    photo_front_url: photoUrls.front || null,
                    photo_back_url: photoUrls.back || null,
                    photo_left_url: photoUrls.left || null,
                    photo_right_url: photoUrls.right || null,
                    photo_headlights_front_url: photoUrls.headlightsFront || null,
                    photo_headlights_rear_url: photoUrls.headlightsRear || null,
                    photo_mirrors_url: photoUrls.mirrors || null,
                    photo_interior_rear_url: photoUrls.interiorRear || null,
                    photo_interior_front_url: photoUrls.interiorFront || null,
                    photo_dashboard_url: photoUrls.dashboard || null,
                    photo_trunk_open_url: photoUrls.trunkOpen || null,
                    status: skipInspection ? "approved" : "pending",
                    plan_active: skipInspection ? true : false,
                    plan_start: skipInspection ? new Date().toISOString().split('T')[0] : null,
                    plan_end: skipInspection ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] : null
                });

            if (error) throw error;

            setNewVehicleForm({ 
                vehicle: "", plate: "", 
                photoFront: null, photoBack: null, photoLeft: null, photoRight: null,
                photoHeadlightsFront: null, photoHeadlightsRear: null, photoMirrors: null,
                photoInteriorRear: null, photoInteriorFront: null, photoDashboard: null, photoTrunkOpen: null
            });
            setPhotoPreviews({ 
                front: "", back: "", left: "", right: "",
                headlightsFront: "", headlightsRear: "", mirrors: "",
                interiorRear: "", interiorFront: "", dashboard: "", trunkOpen: ""
            });
            setValidationResult(null);
            setAddVehicleDialogOpen(false);
            fetchClientVehicles(clientData.id!);
            toast({ title: skipInspection ? "Veículo adicionado e liberado para agendamento!" : "Veículo enviado para vistoria!" });
        } catch (err: any) {
            toast({ title: "Erro ao adicionar veículo", description: err.message, variant: "destructive" });
        } finally {
            setUploadingVehiclePhoto(false);
        }
    };

    const handleDeleteVehicle = async (vehicleId: string) => {
        if (!clientData) return;

        try {
            // Buscar veículo para obter a URL da foto
            const { data: vehicleData, error: fetchError } = await supabase
                .from("client_vehicles")
                .select("vehicle_photo_url")
                .eq("id", vehicleId)
                .single();

            if (fetchError) {
                console.error("Erro ao buscar veículo:", fetchError);
                throw fetchError;
            }

            // Deletar foto do Storage se existir
            if (vehicleData?.vehicle_photo_url) {
                try {
                    // Extrair o caminho do arquivo da URL
                    const urlParts = vehicleData.vehicle_photo_url.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const clientPath = urlParts[urlParts.length - 2];
                    const filePath = `${clientPath}/${fileName}`;

                    console.log("Removendo foto do Storage:", filePath);
                    await supabase.storage
                        .from("vehicle-photos")
                        .remove([filePath]);
                } catch (storageErr) {
                    console.error("Erro ao remover foto do Storage:", storageErr);
                    // Continuar mesmo se falhar ao remover foto
                }
            }

            // Deletar veículo do banco
            const { error } = await supabase
                .from("client_vehicles")
                .delete()
                .eq("id", vehicleId);
            
            if (error) {
                throw error;
            }

            // Verificar se foi realmente deletado
            const { data: checkData } = await supabase
                .from("client_vehicles")
                .select("id")
                .eq("id", vehicleId)
                .single();
            
            if (checkData) {
                throw new Error("Veículo não foi deletado - operação bloqueada por RLS");
            }

            // Recarregar veículos
            await fetchClientVehicles(clientData.id);
            toast({ title: "Veículo removido com sucesso" });
        } catch (err: any) {
            console.error("Erro ao remover veículo:", err);
            toast({
                title: "Erro ao remover veículo",
                description: err.message || "Falha ao remover o veículo. Verifique suas permissões.",
                variant: "destructive",
            });
        }
    };

    const handleAddAppointment = async () => {
        if (!appointmentForm.service_type || !appointmentForm.scheduled_date || !appointmentForm.scheduled_time || !appointmentForm.vehicle_id || !clientData) {
            toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
            return;
        }

        if (!appointmentForm.videoFile) {
            toast({ title: "Vídeo do problema é obrigatório", variant: "destructive" });
            return;
        }

        const selectedAppointmentVehicle = clientVehicles.find((vehicle) => vehicle.id === appointmentForm.vehicle_id);
        if (!selectedAppointmentVehicle || !isVehicleEligibleForAppointment(selectedAppointmentVehicle)) {
            toast({ title: "Selecione um veículo pago ou dentro do período grátis", variant: "destructive" });
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
            let videoUrl = "";

            // Upload vídeo se existir
            if (appointmentForm.videoFile) {
                setUploadingAppointmentVideo(true);
                const fileExt = appointmentForm.videoFile.name.split('.').pop();
                const fileName = `${clientData.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("appointment-videos")
                    .upload(fileName, appointmentForm.videoFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from("appointment-videos")
                    .getPublicUrl(fileName);

                videoUrl = publicUrl;
                setUploadingAppointmentVideo(false);
            }

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
                    appointment_video_url: videoUrl,
                });

            if (error) throw error;

            setAppointmentForm({ service_type: "", scheduled_date: "", scheduled_time: "", notes: "", vehicle_id: "", videoFile: null });
            setAppointmentVideoPreview("");
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
            setUploadingAppointmentVideo(false);
        }
    };

    const handleSave = async () => {
        if (!clientData?.id) return;
        setSaving(true);
        try {
            const sanitizedData = {
                name: formData.name.trim(),
                email: normalizeEmail(formData.email),
                phone: formData.phone.trim(),
                cpf: normalizeCpf(formData.cpf) || null,
                vehicle: formData.vehicle.trim(),
                plate: normalizePlate(formData.plate) || null,
            };

            const currentData = {
                name: clientData.name || "",
                email: normalizeEmail(clientData.email),
                phone: clientData.phone || "",
                cpf: normalizeCpf(clientData.cpf) || null,
                vehicle: clientData.vehicle || "",
                plate: normalizePlate(clientData.plate) || null,
            };

            const changedData = Object.fromEntries(
                Object.entries(sanitizedData).filter(([key, value]) => currentData[key as keyof typeof currentData] !== value)
            );

            if (Object.keys(changedData).length === 0) {
                setEditingSection(null);
                toast({ title: "Nenhuma alteração para salvar." });
                return;
            }

            if (changedData.email) {
                const { data: emailConflict } = await supabase
                    .from("clients")
                    .select("id")
                    .eq("email", changedData.email)
                    .neq("id", clientData.id)
                    .maybeSingle();

                if (emailConflict) {
                    throw new Error("Este email já está sendo usado por outro cliente.");
                }
            }

            if (changedData.cpf) {
                const { data: cpfConflict } = await supabase
                    .from("clients")
                    .select("id")
                    .eq("cpf", changedData.cpf)
                    .neq("id", clientData.id)
                    .maybeSingle();

                if (cpfConflict) {
                    throw new Error("Este documento já está cadastrado para outro cliente.");
                }
            }

            if (changedData.plate) {
                const { data: plateConflict } = await supabase
                    .from("clients")
                    .select("id")
                    .eq("plate", changedData.plate)
                    .neq("id", clientData.id)
                    .maybeSingle();

                if (plateConflict) {
                    throw new Error("Esta placa já está cadastrada para outro cliente.");
                }
            }

            const { error } = await supabase
                .from("clients")
                .update(changedData)
                .eq("id", clientData.id);

            if (error) throw error;

            setClientData({ ...clientData, ...changedData });
            setFormData((prev) => ({ ...prev, ...changedData }));
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
                            <h1 className="text-xl font-display font-bold text-foreground">Iguaçu Auto Vidros</h1>
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
                        </div>
                        <p className="text-lg text-muted-foreground mb-6">
                            Aqui você pode gerenciar seus dados e acompanhar seus serviços.
                        </p>
                    </div>

                    {/* Instructions Section - Highly Visual Journey */}
                    <div className="glass-card overflow-hidden rounded-3xl border border-primary/20 shadow-2xl">
                        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border-b border-primary/10">
                            <h3 className="text-3xl font-display font-black text-foreground flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg glow-primary">
                                    <Shield className="w-7 h-7 text-primary-foreground" />
                                </div>
                                Jornada do Cliente Clube do Parabrisa
                            </h3>
                        </div>
                        
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2 z-0" />

                            {/* Step 1 */}
                            <div className="relative z-10 space-y-4 text-center md:text-left group">
                                <div className="w-20 h-20 mx-auto md:mx-0 bg-background border-4 border-primary rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-black text-sm">1</div>
                                    <Camera className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-foreground">Vistoria</h4>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        Envie <strong className="text-primary">11 fotos</strong> do seu carro para nossa equipe validar.
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="relative z-10 space-y-4 text-center md:text-left group">
                                <div className="w-20 h-20 mx-auto md:mx-0 bg-background border-4 border-primary rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-black text-sm">2</div>
                                    <CreditCard className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-foreground">Ativação</h4>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        Após aprovado, ative a mensalidade do seu veículo (de <strong className="text-primary">R$ 19,90</strong> a <strong className="text-primary">R$ 99,90</strong>) conforme definido pela empresa.
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="relative z-10 space-y-4 text-center md:text-left group">
                                <div className="w-20 h-20 mx-auto md:mx-0 bg-background border-4 border-primary rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-black text-sm">3</div>
                                    <CalendarCheck className="w-10 h-10 text-primary" />
                                </div>
                            <div>
                                <h4 className="text-xl font-bold text-foreground">Serviço</h4>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Realize até <strong className="text-primary">3 trocas anuais</strong> inclusas na sua proteção!
                                </p>
                                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                                    Em cada serviço é paga uma franquia de <strong className="text-primary">30% do valor da peça</strong>.
                                </p>
                            </div>
                            </div>
                        </div>
                    </div>

                    {/* 3-Step Workflow Grid */}
                    <div className="grid grid-cols-1 gap-8">
                        {/* STEP 1: VISTORIA */}
                        <div className={`p-8 rounded-2xl border-2 transition-all ${
                            clientVehicles.some(v => v.status === "approved") 
                                ? "border-green-500 bg-green-50/50 dark:bg-green-950/10" 
                                : isPendingApproval 
                                    ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/10"
                                    : "border-border bg-card"
                        }`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${
                                        clientVehicles.some(v => v.status === "approved")
                                            ? "bg-green-500 text-white"
                                            : "bg-primary text-white"
                                    }`}>
                                        {clientVehicles.some(v => v.status === "approved") ? <Check className="w-8 h-8" /> : "1"}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Passo 1: Vistoria do Veículo</h3>
                                        <p className="text-base text-muted-foreground">
                                            {clientVehicles.length === 0 
                                                ? "Comece enviando as fotos do seu primeiro veículo."
                                                : clientVehicles.some(v => v.status === "pending")
                                                    ? "Temos veículos em análise. Aguarde o OK da empresa."
                                                    : "Envie a vistoria de um novo veículo."}
                                        </p>
                                    </div>
                                </div>
                                <Dialog open={addVehicleDialogOpen} onOpenChange={setAddVehicleDialogOpen}>
                                    <Button
                                        size="lg"
                                        className="gap-2 text-lg px-8"
                                        type="button"
                                        onClick={() => setAddVehicleDialogOpen(true)}
                                    >
                                        <Plus className="w-5 h-5" />
                                        Nova Vistoria
                                    </Button>
                                    <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="font-display text-2xl">Nova Vistoria de Veículo</DialogTitle>
                                        </DialogHeader>
                                        
                                        <div className="space-y-6 py-4">
                                            {/* Vehicle Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="new-vehicle" className="text-sm font-bold">Veículo *</Label>
                                                    <Input
                                                        id="new-vehicle"
                                                        value={newVehicleForm.vehicle}
                                                        onChange={(e) => setNewVehicleForm({ ...newVehicleForm, vehicle: e.target.value })}
                                                        placeholder="Ex: Honda Civic"
                                                        className="h-12"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="new-plate" className="text-sm font-bold">Placa *</Label>
                                                    <Input
                                                        id="new-plate"
                                                        value={newVehicleForm.plate}
                                                        onChange={(e) => setNewVehicleForm({ ...newVehicleForm, plate: e.target.value })}
                                                        placeholder="ABC-1234"
                                                        className="h-12"
                                                    />
                                                </div>
                                            </div>

                                            {/* Photos Grid */}
                                            {!(clientData as any)?.skip_inspection ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-primary font-black text-base uppercase tracking-wider">
                                                            Fotos Obrigatórias (11 total)
                                                        </Label>
                                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                                            {Object.values(newVehicleForm).filter(v => v instanceof File).length} / 11 enviadas
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                        {[
                                                            { side: "front", label: "Frente" },
                                                            { side: "back", label: "Traseira" },
                                                            { side: "left", label: "Lado Esquerdo" },
                                                            { side: "right", label: "Lado Direito" },
                                                            { side: "headlightsFront", label: "Faróis Frontais" },
                                                            { side: "headlightsRear", label: "Faróis Traseiros" },
                                                            { side: "mirrors", label: "Retrovisores" },
                                                            { side: "interiorFront", label: "Interior Frontal" },
                                                            { side: "interiorRear", label: "Interior Traseiro" },
                                                            { side: "dashboard", label: "Painel" },
                                                            { side: "trunkOpen", label: "Porta-Malas Aberto" }
                                                        ].map((photo) => (
                                                            <div key={photo.side} className="space-y-1.5">
                                                                <Label className="text-[11px] font-bold uppercase text-muted-foreground truncate block">
                                                                    {photo.label}
                                                                </Label>
                                                                <label className={`relative flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl cursor-pointer transition-all hover:bg-primary/5 group ${
                                                                    (photoPreviews as any)[photo.side] ? 'border-green-500 bg-green-50/10' : 'border-border'
                                                                }`}>
                                                                    {(photoPreviews as any)[photo.side] ? (
                                                                        <div className="relative w-full h-full">
                                                                            <img 
                                                                                src={(photoPreviews as any)[photo.side]} 
                                                                                className="w-full h-full object-cover rounded-lg" 
                                                                                alt={photo.label} 
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                                                <Camera className="w-6 h-6 text-white" />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-center p-2">
                                                                            <Camera className="w-6 h-6 mx-auto mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                            <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">Tirar Foto</span>
                                                                        </div>
                                                                    )}
                                                                    <input 
                                                                        type="file" 
                                                                        accept="image/*" 
                                                                        capture="environment"
                                                                        className="hidden" 
                                                                        onChange={(e) => handlePhotoChange(photo.side, e)} 
                                                                    />
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                                                    <AlertCircle className="w-5 h-5 text-amber-600" />
                                                    <p className="text-sm text-amber-800 font-medium">Vistoria simplificada habilitada para seu perfil.</p>
                                                </div>
                                            )}

                                            <Button
                                                type="button"
                                                onClick={handleConfirmAddVehicle}
                                                disabled={uploadingVehiclePhoto}
                                                className="w-full h-14 text-lg font-bold gradient-primary shadow-lg shadow-primary/20"
                                            >
                                                {uploadingVehiclePhoto ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Enviando Vistoria...
                                                    </div>
                                                ) : "Finalizar e Enviar para Vistoria"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* STEP 2: PAGAMENTO */}
                        <div className={`p-8 rounded-2xl border-2 transition-all ${
                            hasAppointmentEligibleVehicle
                                ? "border-green-500 bg-green-50/50 dark:bg-green-950/10" 
                                : "border-border bg-card"
                        } ${!clientVehicles.some(v => v.status === "approved") ? "opacity-50 grayscale pointer-events-none" : ""}`}>
                            <div className="flex items-start gap-6 mb-6">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${
                                    hasAppointmentEligibleVehicle
                                        ? "bg-green-500 text-white"
                                        : "bg-primary text-white"
                                }`}>
                                    {hasAppointmentEligibleVehicle ? <Check className="w-8 h-8" /> : "2"}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">Passo 2: Pagamento por Veículo</h3>
                                    <p className="text-base text-muted-foreground">
                                        Após o "OK" da empresa, pague a mensalidade para liberar o agendamento.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {clientVehicles.filter(v => v.status === "approved").map(vehicle => {
                                    const vPlanEnd = vehicle.plan_end ? new Date(vehicle.plan_end) : null;
                                    const vExpired = vPlanEnd && new Date() > vPlanEnd;
                                    const vActive = isVehiclePlanActive(vehicle);
                                    const freeDaysRemaining = getFreeDaysRemaining(vehicle.free_until);
                                    const vFreeActive = isVehicleFreeActive(vehicle);
                                    const vehiclePrice = getVehicleMonthlyPrice(vehicle, clientData?.value_per_car);

                                    return (
                                        <div key={vehicle.id} className={`p-4 rounded-xl border-2 flex items-center justify-between ${vActive || vFreeActive ? "border-green-200 bg-green-50/30" : vExpired ? "border-red-200 bg-red-50/30" : "border-border bg-muted/20"}`}>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">{vehicle.vehicle}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatCurrency(vehiclePrice)}/mês
                                                </p>
                                                <p className={`text-[10px] font-bold uppercase ${vActive || vFreeActive ? "text-green-600" : vExpired ? "text-red-600" : "text-muted-foreground"}`}>
                                                    {vActive ? "Pago" : vFreeActive ? `Grátis por ${freeDaysRemaining} dia${freeDaysRemaining === 1 ? "" : "s"}` : vExpired ? "Expirado" : "Pendente"}
                                                </p>
                                            </div>
                                            {!vActive && (
                                                <Button size="sm" onClick={() => handlePaymentClick(vehicle.id)} className={vExpired ? "bg-red-600" : ""}>
                                                    <DollarSign className="w-3 h-3 mr-1" /> Pagar
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* STEP 3: AGENDAMENTO */}
                        <div className={`p-8 rounded-2xl border-2 transition-all border-blue-500 bg-blue-50/50 dark:bg-blue-950/10 ${
                            !hasAppointmentEligibleVehicle ? "opacity-50 grayscale pointer-events-none" : ""
                        }`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl">
                                        3
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Passo 3: Agendar Serviço</h3>
                                        <p className="text-base text-muted-foreground">
                                            Selecione um veículo com plano ativo ou dentro do período grátis para agendar.
                                        </p>
                                    </div>
                                </div>
                                <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2 text-lg px-8">
                                            <Calendar className="w-5 h-5" />
                                            Agendar Agora
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-border">
                                        <DialogHeader>
                                            <DialogTitle className="font-display">Novo Agendamento</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label>Veículo (Pago ou em gratuidade) *</Label>
                                                <Select value={appointmentForm.vehicle_id} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, vehicle_id: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Selecione um veículo liberado..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {appointmentEligibleVehicles.map((vehicle) => (
                                                            <SelectItem key={vehicle.id} value={vehicle.id}>
                                                                {vehicle.vehicle} - {vehicle.plate}{isVehicleFreeActive(vehicle) ? ` (${getFreeDaysRemaining(vehicle.free_until)} dias grátis)` : ""}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
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
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Data *</Label>
                                                    <Input type="date" value={appointmentForm.scheduled_date} onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduled_date: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label>Hora *</Label>
                                                    <Input type="time" value={appointmentForm.scheduled_time} onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduled_time: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-sm font-bold flex items-center gap-2">
                                                    <Camera className="w-4 h-4 text-primary" />
                                                    Vídeo do Problema *
                                                </Label>
                                                <div className="space-y-3">
                                                    <label className={`relative flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:bg-primary/5 ${appointmentVideoPreview ? 'border-green-500 bg-green-50/10' : 'border-border'}`}>
                                                        {appointmentVideoPreview ? (
                                                            <video 
                                                                src={appointmentVideoPreview} 
                                                                className="w-full h-full object-cover rounded-lg" 
                                                            />
                                                        ) : (
                                                            <div className="text-center px-4">
                                                                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                                <span className="text-sm font-bold text-muted-foreground">Gravar ou Escolher Vídeo</span>
                                                                <p className="text-[10px] text-muted-foreground mt-1">Mostre o dano para acelerar seu atendimento</p>
                                                            </div>
                                                        )}
                                                        <input 
                                                            type="file" 
                                                            accept="video/*" 
                                                            capture="environment"
                                                            className="hidden" 
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setAppointmentForm({ ...appointmentForm, videoFile: file });
                                                                    setAppointmentVideoPreview(URL.createObjectURL(file));
                                                                }
                                                            }} 
                                                        />
                                                    </label>
                                                    {appointmentVideoPreview && (
                                                        <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                                            <Check className="w-3 h-3" /> Vídeo selecionado com sucesso!
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button onClick={handleAddAppointment} disabled={submittingAppointment} className="w-full">
                                                Confirmar Agendamento
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>

                    {/* Active Appointments List (Histórico rápido) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-8 rounded-2xl"
                    >
                        <h3 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Meus Agendamentos
                        </h3>
                        <div className="space-y-3">
                            {appointments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">Nenhum agendamento realizado ainda</p>
                            ) : (
                                appointments.slice(0, 3).map((apt) => (
                                    <div key={apt.id} className="p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{apt.service_type}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(apt.scheduled_date).toLocaleDateString("pt-BR")} às {apt.scheduled_time}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                            apt.status === "confirmado" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                        }`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                ))
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
                        </div>

                        {/* Vehicles List */}
                         <div className="space-y-3">
                             {clientVehicles.length === 0 ? (
                                 <p className="text-sm text-muted-foreground text-center py-8">Nenhum veículo adicionado ainda</p>
                             ) : (
                                 clientVehicles.map((vehicle) => (
                                     <div
                                         key={vehicle.id}
                                         className="p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-between gap-4"
                                     >
                                         <div className="flex items-center gap-3 flex-1 min-w-0">
                                             {vehicle.vehicle_photo_url ? (
                                                 <button
                                                     onClick={() => {
                                                         setSelectedPhotoUrl(vehicle.vehicle_photo_url || "");
                                                         setPhotoModalOpen(true);
                                                     }}
                                                     className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                                                 >
                                                     <img
                                                         src={vehicle.vehicle_photo_url}
                                                         alt={vehicle.vehicle}
                                                         className="w-12 h-12 object-cover rounded-lg"
                                                     />
                                                 </button>
                                             ) : (
                                                 <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                     <Car className="w-5 h-5 text-primary" />
                                                 </div>
                                             )}
                                             <div className="min-w-0">
                                                 <p className="font-medium text-foreground truncate">{vehicle.vehicle}</p>
                                                 <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                     Placa: {vehicle.plate} 
                                                     {vehicle.is_primary && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Principal</span>}
                                                 </p>
                                                 <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                        vehicle.status === 'approved' ? 'bg-success/10 text-success' : 
                                                        vehicle.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {vehicle.status === 'approved' ? 'Aprovado' : 
                                                         vehicle.status === 'rejected' ? 'Recusado' : 'Pendente de Vistoria'}
                                                    </span>
                                                    
                                                    {vehicle.status === 'rejected' && vehicle.rejection_reason && (
                                                        <div className="w-full mt-1 p-2 bg-destructive/5 border border-destructive/10 rounded text-xs text-destructive">
                                                            <strong>Motivo da recusa:</strong> {vehicle.rejection_reason}
                                                            <p className="mt-1 font-medium text-[10px] uppercase">Por favor, exclua este veículo e adicione novamente com as correções solicitadas.</p>
                                                        </div>
                                                    )}
                                                 </div>
                                             </div>
                                         </div>
                                         <AlertDialog>
                                             <AlertDialogTrigger asChild>
                                                 <Button
                                                     variant="ghost"
                                                     size="sm"
                                                     className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 flex-shrink-0"
                                                 >
                                                     <Trash2 className="w-4 h-4" />
                                                 </Button>
                                             </AlertDialogTrigger>
                                             <AlertDialogContent>
                                                 <AlertDialogHeader>
                                                     <AlertDialogTitle className="flex items-center gap-2">
                                                         <AlertTriangle className="w-5 h-5 text-red-600" />
                                                         Confirmar Exclusão
                                                     </AlertDialogTitle>
                                                     <AlertDialogDescription className="space-y-3">
                                                         <p>Você tem certeza que deseja excluir o veículo <strong>{vehicle.vehicle} ({vehicle.plate})</strong>?</p>
                                                         <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-800 text-sm">
                                                             <strong>Atenção:</strong> Se você decidir adicionar este veículo novamente no futuro, ele precisará passar por uma <strong>nova vistoria completa</strong> e aprovação da equipe.
                                                         </div>
                                                     </AlertDialogDescription>
                                                 </AlertDialogHeader>
                                                 <AlertDialogFooter>
                                                     <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                     <AlertDialogAction 
                                                         onClick={() => handleDeleteVehicle(vehicle.id)}
                                                         className="bg-red-600 hover:bg-red-700 text-white"
                                                     >
                                                         Excluir Veículo
                                                     </AlertDialogAction>
                                                 </AlertDialogFooter>
                                             </AlertDialogContent>
                                         </AlertDialog>
                                     </div>
                                 ))
                             )}
                         </div>
                    </motion.div>

                    {/* Bulk Upload Section */}
                    {clientData && bulkUploadEnabled && (
                        <BulkVehicleUpload
                            clientId={clientData.id!}
                            isEnabled={bulkUploadEnabled}
                            onSuccess={() => fetchClientVehicles(clientData.id!)}
                        />
                    )}

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
                                    <Label htmlFor="cpf">CPF / CNPJ</Label>
                                    <Input
                                        id="cpf"
                                        value={formData.cpf}
                                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                        placeholder="Digite seu documento"
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
                                    <p className="text-xs text-muted-foreground mb-1">CPF / CNPJ</p>
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

                                {/* Campo Placa oculto: desnecessário na edição e pode induzir ao erro */}
                                {/* <div>
                                    <Label htmlFor="plate">Placa</Label>
                                    <Input
                                        id="plate"
                                        value={formData.plate}
                                        onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                                        placeholder="ABC-1D23"
                                    />
                                </div> */}

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

                    {/* Modal para Visualizar Vídeo do Agendamento */}
                    <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
                        <DialogContent className="bg-card border-border max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="font-display">Vídeo do Problema</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="flex justify-center items-center bg-black rounded-lg overflow-hidden">
                                    <video
                                        src={selectedVideoUrl}
                                        controls
                                        className="max-w-full max-h-96"
                                    />
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-2">Por que o vídeo é obrigatório?</h4>
                                        <p className="text-sm text-muted-foreground">
                                            O vídeo documenta o problema do seu veículo antes do atendimento, permitindo que nossa equipe entenda melhor a situação e se prepare adequadamente com os materiais e ferramentas corretos.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-2">Como funciona?</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                            <li>Grave um vídeo mostrando o dano ou problema</li>
                                            <li>Anexe o vídeo ao criar o agendamento</li>
                                            <li>Nossa equipe analisa antes do atendimento</li>
                                            <li>Você pode visualizar a qualquer momento aqui</li>
                                        </ul>
                                    </div>
                                    <div className="pt-2 border-t border-border">
                                        <p className="text-xs text-muted-foreground italic">
                                            💡 Dica: Filme em boa iluminação, mostre o problema por diferentes ângulos e inclua som (explicando o problema se possível).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Modal de Pagamento do Plano */}
                    <PlanPaymentModal
                        isOpen={paymentModalOpen}
                        onClose={() => setPaymentModalOpen(false)}
                        onPaymentClick={handleConfirmPayment}
                        isLoading={isProcessingPayment}
                        clientName={clientData?.name}
                        valuePerCar={selectedPaymentMonthlyPrice}
                    />
                </motion.div>
            </main>
        </div>
    );
};

export default ClientDashboard;
