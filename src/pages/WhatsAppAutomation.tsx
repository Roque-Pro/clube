import { useState, useEffect, useRef } from "react";
import { 
    MessageSquare, 
    Send, 
    Settings, 
    RefreshCw, 
    Play, 
    CheckCircle, 
    AlertTriangle, 
    Users, 
    QrCode, 
    Wifi, 
    WifiOff, 
    Search, 
    Trash2, 
    Pause, 
    HelpCircle, 
    Save, 
    Loader2, 
    Sparkles, 
    FileText 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Client } from "@/types";

interface WhatsAppConfig {
    apiUrl: string;
    apiKey: string;
    instanceName: string;
}

interface LogEntry {
    id: string;
    clientName: string;
    phone: string;
    status: "pending" | "success" | "error";
    message: string;
    timestamp: string;
}

export default function WhatsAppAutomation() {
    const { toast } = useToast();
    const [config, setConfig] = useState<WhatsAppConfig>({
        apiUrl: "http://localhost:8080",
        apiKey: "",
        instanceName: "clube_do_vidro",
    });

    // States
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [messageTemplate, setMessageTemplate] = useState(
        "Olá, {{nome}}! Tudo bem?\n\nPassando para lembrar que a cobertura do seu veículo *{{veiculo}}* (Placa: *{{placa}}*) está ativa e com a sua franquia de vidros garantida! \n\nQualquer dúvida ou necessidade de acionamento, estamos à disposição por aqui.\n\nTenha um ótimo mês! 🚗💨"
    );
    const [delay, setDelay] = useState(3); // delay in seconds
    const [isSending, setIsSending] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentClientIndex, setCurrentClientIndex] = useState(-1);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connected" | "checking">("checking");
    const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
    const [checkingStatusLoading, setCheckingStatusLoading] = useState(false);
    const [generatingQrLoading, setGeneratingQrLoading] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Save/Load config
    useEffect(() => {
        const savedConfig = localStorage.getItem("evolution_api_config");
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                setConfig(parsed);
                // Trigger connection check after loading
                checkConnection(parsed.apiUrl, parsed.apiKey, parsed.instanceName);
            } catch (e) {
                console.error("Erro ao carregar configurações de WhatsApp:", e);
                setConnectionStatus("disconnected");
            }
        } else {
            setConnectionStatus("disconnected");
        }
        loadClients();
    }, []);

    // Save configurations
    const handleSaveConfig = () => {
        if (!config.apiUrl.trim() || !config.instanceName.trim() || !config.apiKey.trim()) {
            toast({
                title: "Atenção",
                description: "Por favor, preencha todos os campos da Evolution API.",
                variant: "destructive",
            });
            return;
        }

        // Clean API URL trailing slash
        let cleanUrl = config.apiUrl.trim();
        if (cleanUrl.endsWith("/")) {
            cleanUrl = cleanUrl.slice(0, -1);
        }

        const updatedConfig = { ...config, apiUrl: cleanUrl };
        setConfig(updatedConfig);
        localStorage.setItem("evolution_api_config", JSON.stringify(updatedConfig));
        
        toast({
            title: "Configurações salvas!",
            description: "As configurações foram armazenadas no seu navegador.",
        });

        checkConnection(updatedConfig.apiUrl, updatedConfig.apiKey, updatedConfig.instanceName);
    };

    // Test API connection
    const checkConnection = async (url = config.apiUrl, key = config.apiKey, instance = config.instanceName) => {
        if (!url || !key || !instance) {
            setConnectionStatus("disconnected");
            return;
        }
        
        setCheckingStatusLoading(true);
        setConnectionStatus("checking");
        setQrCodeBase64(null);

        try {
            const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
            const res = await fetch(`${cleanUrl}/instance/connectionState/${instance}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": key
                }
            });

            if (!res.ok) {
                throw new Error(`Servidor respondeu com status ${res.status}`);
            }

            const data = await res.json();
            const state = data.instance?.state || data.state;
            
            if (state === "open" || state === "CONNECTED" || data.connected === true) {
                setConnectionStatus("connected");
                toast({
                    title: "WhatsApp Conectado!",
                    description: "Instância da Evolution API está conectada e pronta para enviar.",
                });
            } else {
                setConnectionStatus("disconnected");
            }
        } catch (error: any) {
            console.error("Erro ao verificar conexão:", error);
            setConnectionStatus("disconnected");
            toast({
                title: "Conexão falhou",
                description: "Não foi possível conectar à Evolution API. Verifique a URL e a Chave API.",
                variant: "destructive",
            });
        } finally {
            setCheckingStatusLoading(false);
        }
    };

    // Generate QR Code
    const handleConnectInstance = async () => {
        if (!config.apiUrl || !config.apiKey || !config.instanceName) {
            toast({
                title: "Atenção",
                description: "Salve as configurações da API antes de tentar conectar.",
                variant: "destructive",
            });
            return;
        }

        setGeneratingQrLoading(true);
        setQrCodeBase64(null);

        try {
            const cleanUrl = config.apiUrl.endsWith("/") ? config.apiUrl.slice(0, -1) : config.apiUrl;
            const res = await fetch(`${cleanUrl}/instance/connect/${config.instanceName}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": config.apiKey
                }
            });

            if (!res.ok) {
                throw new Error("Não foi possível solicitar o QR code da instância.");
            }

            const data = await res.json();
            
            if (data.code === 200 || data.qrcode?.base64) {
                setQrCodeBase64(data.qrcode.base64);
                toast({
                    title: "QR Code Gerado",
                    description: "Escaneie o QR Code no seu aplicativo do WhatsApp.",
                });
            } else if (data.message === "Instance already connected" || data.instance?.state === "open") {
                setConnectionStatus("connected");
                toast({
                    title: "Instância Conectada",
                    description: "O WhatsApp já está ativo nesta instância.",
                });
            } else {
                throw new Error(data.message || "Erro desconhecido ao obter o QR Code.");
            }
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao gerar QR Code",
                description: error.message || "Certifique-se de que a instância foi criada na Evolution API.",
                variant: "destructive",
            });
        } finally {
            setGeneratingQrLoading(false);
        }
    };

    // Load clients from Supabase
    const loadClients = async () => {
        setLoadingClients(true);
        try {
            const [{ data, error }, { data: vehiclesData, error: vehiclesError }] = await Promise.all([
                supabase
                    .from("clients")
                    .select("*")
                    .order("name", { ascending: true }),
                supabase
                    .from("client_vehicles")
                    .select("client_id, plan_active, plan_start, plan_end")
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
                        phone: client.phone || "",
                        email: client.email || "",
                        cpf: client.cpf || "",
                        vehicle: client.vehicle || "",
                        plate: client.plate || "",
                        planStart: latestVehiclePlan?.plan_start || client.plan_start || "",
                        planEnd: latestVehiclePlan?.plan_end || client.plan_end || "",
                        replacementsUsed: client.replacements_used || 0,
                        maxReplacements: client.max_replacements || 3,
                        active: client.active ?? true,
                        planActive: activeVehicles.length > 0 || client.plan_active || false,
                        skip_inspection: client.skip_inspection || false,
                        bulk_upload_enabled: client.bulk_upload_enabled || false,
                        is_cooperative: client.is_cooperative || false,
                        value_per_car: client.value_per_car || 0,
                    };
                });

                setClients(mappedClients);
                // Pre-select active clients
                setSelectedClients(mappedClients.filter(c => c.active).map(c => c.id));
            }
        } catch (error: any) {
            console.error("Erro ao buscar clientes:", error);
            toast({
                title: "Erro ao buscar clientes",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoadingClients(false);
        }
    };

    // Sanitize phone number to format 55 + Area Code + Number
    const sanitizePhone = (phone: string) => {
        let cleaned = phone.replace(/\D/g, "");
        if (!cleaned) return "";
        // If it looks like a standard Brazilian local number (e.g. 21974636253) without country code, add 55
        if (cleaned.length === 10 || cleaned.length === 11) {
            cleaned = "55" + cleaned;
        }
        return cleaned;
    };

    // Handle variables injection into text area
    const insertVariable = (variable: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        const newTemplate = before + `{{${variable}}}` + after;
        setMessageTemplate(newTemplate);

        // Reset cursor focus
        setTimeout(() => {
            textarea.focus();
            const cursorPosition = start + variable.length + 4; // length of variable + brackets
            textarea.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
    };

    // Dynamic preview of the message template
    const renderPreview = () => {
        if (clients.length === 0) return "Nenhum cliente disponível para prever.";
        
        // Find first selected client or default to first client
        const firstId = selectedClients[0] || (clients[0] && clients[0].id);
        const sampleClient = clients.find(c => c.id === firstId) || clients[0];
        
        if (!sampleClient) return "";

        const formattedDate = sampleClient.planEnd 
            ? new Date(sampleClient.planEnd).toLocaleDateString("pt-BR")
            : "N/A";

        return messageTemplate
            .replace(/{{nome}}/g, sampleClient.name)
            .replace(/{{telefone}}/g, sampleClient.phone)
            .replace(/{{veiculo}}/g, sampleClient.vehicle || "Veículo não cadastrado")
            .replace(/{{placa}}/g, sampleClient.plate || "S/Placa")
            .replace(/{{vencimento}}/g, formattedDate);
    };

    // Replace variables for a specific client
    const formatMessageForClient = (template: string, client: Client) => {
        const formattedDate = client.planEnd 
            ? new Date(client.planEnd).toLocaleDateString("pt-BR")
            : "N/A";

        return template
            .replace(/{{nome}}/g, client.name)
            .replace(/{{telefone}}/g, client.phone)
            .replace(/{{veiculo}}/g, client.vehicle || "Veículo não cadastrado")
            .replace(/{{placa}}/g, client.plate || "S/Placa")
            .replace(/{{vencimento}}/g, formattedDate);
    };

    // Filtering clients
    const filteredClients = clients.filter(client => {
        const matchesSearch = 
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.cpf.includes(searchTerm) ||
            client.phone.includes(searchTerm) ||
            (client.plate && client.plate.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        if (statusFilter === "active") return client.active;
        if (statusFilter === "inactive") return !client.active;
        if (statusFilter === "planActive") return client.planActive;
        if (statusFilter === "planExpired") return !client.planActive && client.active;
        return true;
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedClients(filteredClients.map(c => c.id));
        } else {
            // Remove only filtered clients from selection
            const filteredIds = filteredClients.map(c => c.id);
            setSelectedClients(selectedClients.filter(id => !filteredIds.includes(id)));
        }
    };

    const handleSelectClient = (clientId: string, checked: boolean) => {
        if (checked) {
            setSelectedClients([...selectedClients, clientId]);
        } else {
            setSelectedClients(selectedClients.filter(id => id !== clientId));
        }
    };

    // Delay helper
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Send single message
    const sendWhatsAppMessage = async (phone: string, text: string): Promise<boolean> => {
        const cleanUrl = config.apiUrl.endsWith("/") ? config.apiUrl.slice(0, -1) : config.apiUrl;
        const cleanPhone = sanitizePhone(phone);
        
        if (!cleanPhone) {
            throw new Error("Número de telefone vazio ou inválido.");
        }

        const payload = {
            number: cleanPhone,
            options: {
                delay: 1200,
                presence: "composing",
                linkPreview: false
            },
            textMessage: {
                text: text
            }
        };

        const res = await fetch(`${cleanUrl}/message/sendText/${config.instanceName}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": config.apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `API respondeu com status ${res.status}`);
        }

        return true;
    };

    // Run Automation Campaign
    const handleStartCampaign = async () => {
        if (connectionStatus !== "connected") {
            toast({
                title: "Não Conectado",
                description: "O WhatsApp precisa estar conectado antes de iniciar a campanha.",
                variant: "destructive",
            });
            return;
        }

        if (selectedClients.length === 0) {
            toast({
                title: "Nenhum cliente selecionado",
                description: "Por favor, selecione pelo menos um cliente na lista.",
                variant: "destructive",
            });
            return;
        }

        if (!messageTemplate.trim()) {
            toast({
                title: "Mensagem vazia",
                description: "Preencha a mensagem que deseja enviar.",
                variant: "destructive",
            });
            return;
        }

        setIsSending(true);
        setIsPaused(false);
        setLogs([]);
        setCurrentClientIndex(0);

        // Fetch selected client details
        const selectedClientsDetails = clients.filter(c => selectedClients.includes(c.id));
        abortControllerRef.current = new AbortController();

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < selectedClientsDetails.length; i++) {
            // Check for pause/stop
            if (!isSending) break;
            
            // Wait while paused
            while (isPaused) {
                await sleep(500);
                if (!isSending) break;
            }

            setCurrentClientIndex(i);
            const client = selectedClientsDetails[i];
            const clientMsg = formatMessageForClient(messageTemplate, client);
            const timestamp = new Date().toLocaleTimeString("pt-BR");

            // Add pending log
            const newLogId = Math.random().toString(36).substring(7);
            setLogs(prev => [
                {
                    id: newLogId,
                    clientName: client.name,
                    phone: client.phone,
                    status: "pending",
                    message: "Enviando...",
                    timestamp
                },
                ...prev
            ]);

            try {
                // Send message via Evolution API
                await sendWhatsAppMessage(client.phone, clientMsg);

                // Update log to success
                setLogs(prev => prev.map(log => 
                    log.id === newLogId 
                        ? { ...log, status: "success", message: "Mensagem enviada com sucesso ✓" } 
                        : log
                ));
                successCount++;
            } catch (err: any) {
                console.error(`Erro ao enviar para ${client.name}:`, err);
                setLogs(prev => prev.map(log => 
                    log.id === newLogId 
                        ? { ...log, status: "error", message: `Falha: ${err.message || "Erro desconhecido"} ✗` } 
                        : log
                ));
                errorCount++;
            }

            // Apply delay if not the last client
            if (i < selectedClientsDetails.length - 1) {
                const sleepTime = delay * 1000;
                await sleep(sleepTime);
            }
        }

        setIsSending(false);
        setCurrentClientIndex(-1);

        toast({
            title: "Campanha Concluída!",
            description: `Mensagens enviadas com sucesso: ${successCount}. Falhas: ${errorCount}.`,
            variant: errorCount > 0 ? "default" : "default",
        });
    };

    // Pause/Resume Automation
    const togglePause = () => {
        setIsPaused(!isPaused);
        toast({
            title: !isPaused ? "Campanha Pausada" : "Campanha Retomada",
            description: !isPaused 
                ? "O envio de mensagens foi pausado temporariamente." 
                : "Retomando o envio sequencial das mensagens.",
        });
    };

    // Stop Automation
    const handleStopCampaign = () => {
        setIsSending(false);
        setIsPaused(false);
        setCurrentClientIndex(-1);
        toast({
            title: "Campanha Cancelada",
            description: "O envio de mensagens foi interrompido.",
            variant: "destructive",
        });
    };

    // Clear logs
    const handleClearLogs = () => {
        setLogs([]);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <PageHeader 
                title="Automação de WhatsApp" 
                subtitle="Envie comunicados mensais personalizados usando a Evolution API."
            />

            {/* Config & QR code columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Evolution API Configuration Card */}
                <Card className="lg:col-span-2 border-primary/20 bg-card/65 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Settings className="w-5 h-5 text-primary" />
                                Configuração da Evolution API
                            </CardTitle>
                            <CardDescription>
                                Conecte a API de WhatsApp para disparar as mensagens mensais.
                            </CardDescription>
                        </div>
                        <div className="flex items-center">
                            {connectionStatus === "connected" ? (
                                <span className="flex items-center gap-1 text-xs px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 rounded-full font-medium">
                                    <Wifi className="w-3.5 h-3.5 animate-pulse" /> Conectado
                                </span>
                            ) : connectionStatus === "checking" ? (
                                <span className="flex items-center gap-1 text-xs px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full font-medium">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs px-3 py-1 bg-destructive/10 border border-destructive/30 text-destructive rounded-full font-medium">
                                    <WifiOff className="w-3.5 h-3.5" /> Desconectado
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="apiUrl">URL da Evolution API</Label>
                                <Input 
                                    id="apiUrl" 
                                    placeholder="Ex: http://localhost:8080 ou https://sua-api.com"
                                    value={config.apiUrl}
                                    onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instanceName">Nome da Instância</Label>
                                <Input 
                                    id="instanceName" 
                                    placeholder="Ex: clube_do_vidro"
                                    value={config.instanceName}
                                    onChange={(e) => setConfig({ ...config, instanceName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Chave Global da API (apikey / Token)</Label>
                            <div className="relative">
                                <Input 
                                    id="apiKey" 
                                    type="password" 
                                    placeholder="Insira a chave da API (apikey da Evolution)"
                                    value={config.apiKey}
                                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            <Button 
                                onClick={handleSaveConfig} 
                                variant="default"
                                className="flex items-center gap-2 bg-[#2c3493] hover:bg-[#1a2068] text-white"
                            >
                                <Save className="w-4 h-4" /> Salvar Configurações
                            </Button>
                            <Button 
                                onClick={() => checkConnection()} 
                                variant="outline"
                                disabled={checkingStatusLoading}
                                className="flex items-center gap-2"
                            >
                                {checkingStatusLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                Testar Conexão
                            </Button>
                            {connectionStatus !== "connected" && (
                                <Button 
                                    onClick={handleConnectInstance} 
                                    variant="secondary"
                                    disabled={generatingQrLoading}
                                    className="flex items-center gap-2"
                                >
                                    {generatingQrLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <QrCode className="w-4 h-4" />
                                    )}
                                    Gerar QR Code / Reconectar
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* QR Code Container / Tutorial */}
                <Card className="border-primary/20 bg-card/65 backdrop-blur-md flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-primary" />
                            Pareamento de WhatsApp
                        </CardTitle>
                        <CardDescription>
                            Conecte o seu celular escaneando o QR Code abaixo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center py-4 min-h-[220px]">
                        {qrCodeBase64 ? (
                            <div className="flex flex-col items-center gap-3 animate-fade-in">
                                <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100">
                                    <img 
                                        src={qrCodeBase64} 
                                        alt="Escaneie o QR Code no WhatsApp"
                                        className="w-44 h-44 object-contain" 
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                                    Abra o WhatsApp &gt; Dispositivos Conectados &gt; Conectar um Dispositivo
                                </p>
                            </div>
                        ) : connectionStatus === "connected" ? (
                            <div className="flex flex-col items-center justify-center text-center gap-2 py-6">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="font-semibold text-green-500 mt-2">Pronto para Enviar!</h3>
                                <p className="text-xs text-muted-foreground max-w-[220px]">
                                    Sua conta do WhatsApp está emparelhada corretamente.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground gap-2 py-6">
                                <QrCode className="w-12 h-12 text-muted-foreground/45" />
                                <p className="text-sm">QR Code não disponível.</p>
                                <p className="text-xs max-w-[200px]">
                                    Salve as configurações corretas da API e clique em <b>Gerar QR Code</b> para conectar.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Campaign Config & Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Message Editor */}
                <Card className="lg:col-span-2 border-primary/20 bg-card/65 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Template da Mensagem Mensal
                        </CardTitle>
                        <CardDescription>
                            Configure a mensagem personalizada para enviar aos seus clientes este mês.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="message">Texto da Mensagem</Label>
                                <span className="text-xs text-muted-foreground">
                                    Use Markdown (*negrito*, _itálico_, ~tachado~)
                                </span>
                            </div>
                            <Textarea 
                                id="message"
                                ref={textareaRef}
                                rows={8}
                                placeholder="Digite a mensagem..."
                                value={messageTemplate}
                                onChange={(e) => setMessageTemplate(e.target.value)}
                                className="font-sans text-sm resize-none"
                            />
                        </div>

                        {/* Variables Injectors */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Campos Personalizados (Clique para Inserir):</Label>
                            <div className="flex flex-wrap gap-1.5">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => insertVariable("nome")}
                                    className="text-xs h-7 py-1 px-2.5 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                >
                                    <Sparkles className="w-3 h-3 mr-1 text-primary" /> Nome do Cliente
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => insertVariable("veiculo")}
                                    className="text-xs h-7 py-1 px-2.5 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                >
                                    🚗 Veículo
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => insertVariable("placa")}
                                    className="text-xs h-7 py-1 px-2.5 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                >
                                    🔢 Placa
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => insertVariable("vencimento")}
                                    className="text-xs h-7 py-1 px-2.5 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                >
                                    📅 Vencimento da Cobertura
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => insertVariable("telefone")}
                                    className="text-xs h-7 py-1 px-2.5 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                >
                                    📞 Telefone
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Card */}
                <Card className="border-primary/20 bg-card/65 backdrop-blur-md flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Prévia do Envio
                        </CardTitle>
                        <CardDescription>
                            Veja como o primeiro cliente receberá a mensagem.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between py-4">
                        {/* WhatsApp Mock UI */}
                        <div className="bg-[#efeae2] dark:bg-zinc-950 p-4 rounded-xl border border-border flex-1 flex flex-col justify-end min-h-[200px] relative overflow-hidden">
                            {/* Header WhatsApp Bar */}
                            <div className="absolute top-0 left-0 right-0 bg-[#075e54] dark:bg-[#128c7e] text-white px-3 py-2 text-xs flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold">C</div>
                                <div>
                                    <p className="font-semibold truncate">Visualização</p>
                                    <p className="text-[9px] opacity-75">online</p>
                                </div>
                            </div>
                            
                            {/* Message Balloon */}
                            <div className="bg-white dark:bg-[#1f2c34] text-foreground dark:text-gray-100 p-3 rounded-lg shadow-sm text-xs max-w-[85%] mt-8 self-start relative border border-gray-100/50 dark:border-zinc-800">
                                <p className="whitespace-pre-line text-[11px] leading-relaxed">
                                    {renderPreview()}
                                </p>
                                <span className="text-[9px] text-muted-foreground block text-right mt-1.5">
                                    {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Campaign controls and sender logs */}
            {isSending && (
                <Card className="border-primary/30 bg-primary/5 shadow-lg border-l-4 border-l-primary">
                    <CardContent className="py-6 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2 text-[#2c3493] dark:text-[#505edb]">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Campanha em Andamento...
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Enviando mensagem {currentClientIndex + 1} de {selectedClients.length} selecionados.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    onClick={togglePause} 
                                    variant="outline"
                                    className="flex items-center gap-1.5"
                                >
                                    {isPaused ? (
                                        <>
                                            <Play className="w-4 h-4 fill-primary text-primary" /> Retomar
                                        </>
                                    ) : (
                                        <>
                                            <Pause className="w-4 h-4 text-amber-500 fill-amber-500" /> Pausar
                                        </>
                                    )}
                                </Button>
                                <Button 
                                    onClick={handleStopCampaign} 
                                    variant="destructive"
                                    className="flex items-center gap-1.5"
                                >
                                    <Trash2 className="w-4 h-4" /> Cancelar Campanha
                                </Button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                <span>Progresso da Automação</span>
                                <span>
                                    {Math.round(((currentClientIndex + 1) / selectedClients.length) * 100)}%
                                </span>
                            </div>
                            <Progress 
                                value={((currentClientIndex + 1) / selectedClients.length) * 100} 
                                className="h-2.5" 
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Automation Area - Clients list and logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Client Selection Table */}
                <Card className="lg:col-span-2 border-primary/20 bg-card/65 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Selecionar Clientes ({selectedClients.length} de {filteredClients.length} visíveis)
                                </CardTitle>
                                <CardDescription>
                                    Escolha os clientes para enviar o comunicado mensal.
                                </CardDescription>
                            </div>
                            
                            {/* Campaign delay setting and Send Button */}
                            {!isSending && (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor="delay" className="text-xs whitespace-nowrap text-muted-foreground">Delay (s):</Label>
                                        <Input 
                                            id="delay" 
                                            type="number" 
                                            min={2} 
                                            max={60}
                                            value={delay} 
                                            onChange={(e) => setDelay(Number(e.target.value))}
                                            className="w-16 h-8 text-xs px-2"
                                        />
                                    </div>
                                    <Button 
                                        onClick={handleStartCampaign} 
                                        disabled={selectedClients.length === 0 || connectionStatus !== "connected"}
                                        className="bg-[#2c3493] hover:bg-[#1a2068] text-white flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" /> Disparar Campanha
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col md:flex-row gap-3 pt-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                                <Input 
                                    placeholder="Buscar por nome, telefone, CPF ou placa..." 
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-48">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status do Cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Status</SelectItem>
                                        <SelectItem value="active">Apenas Ativos</SelectItem>
                                        <SelectItem value="inactive">Apenas Inativos</SelectItem>
                                        <SelectItem value="planActive">Cobertura Ativa</SelectItem>
                                        <SelectItem value="planExpired">Cobertura Vencida</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                        {loadingClients ? (
                            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" /> Carregando clientes...
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center gap-1.5">
                                <Users className="w-10 h-10 text-muted-foreground/35" />
                                <p className="font-medium">Nenhum cliente encontrado.</p>
                                <p className="text-xs max-w-[280px]">
                                    Ajuste os filtros de pesquisa ou certifique-se de que os clientes estão cadastrados no CRM.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                                    <TableRow>
                                        <TableHead className="w-12 text-center">
                                            <Checkbox 
                                                checked={
                                                    filteredClients.length > 0 && 
                                                    filteredClients.every(c => selectedClients.includes(c.id))
                                                }
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Selecionar todos"
                                            />
                                        </TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Telefone / WhatsApp</TableHead>
                                        <TableHead>Veículo (Placa)</TableHead>
                                        <TableHead className="text-center">Vencimento</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients.map((client) => {
                                        const isSelected = selectedClients.includes(client.id);
                                        const isClientActive = client.active;
                                        const isPlanActive = client.planActive;
                                        
                                        return (
                                            <TableRow 
                                                key={client.id}
                                                className={`transition-colors duration-150 ${
                                                    isSelected ? "bg-primary/5" : ""
                                                }`}
                                            >
                                                <TableCell className="text-center">
                                                    <Checkbox 
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => 
                                                            handleSelectClient(client.id, !!checked)
                                                        }
                                                        aria-label={`Selecionar ${client.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium text-foreground">
                                                    {client.name}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {client.phone ? client.phone : <span className="text-muted-foreground/50">Não cadastrado</span>}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {client.vehicle ? (
                                                        <div className="flex flex-col">
                                                            <span>{client.vehicle}</span>
                                                            <span className="text-[10px] text-muted-foreground font-mono uppercase font-semibold">
                                                                {client.plate || "S/Placa"}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground/50">Nenhum</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center text-xs">
                                                    {client.planEnd ? (
                                                        <span className={!isPlanActive ? "text-destructive font-semibold" : "text-muted-foreground"}>
                                                            {new Date(client.planEnd).toLocaleDateString("pt-BR")}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/50">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                        isPlanActive
                                                            ? "bg-green-500/10 text-green-500 border border-green-500/30"
                                                            : isClientActive
                                                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                                                            : "bg-destructive/10 text-destructive border border-destructive/30"
                                                    }`}>
                                                        {isPlanActive ? "Coberto" : isClientActive ? "Sem Plano" : "Inativo"}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Automation Log Area */}
                <Card className="border-primary/20 bg-card/65 backdrop-blur-md flex flex-col justify-between max-h-[500px]">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Relatório / Histórico
                            </CardTitle>
                            <CardDescription>
                                Resultados dos envios em tempo real.
                            </CardDescription>
                        </div>
                        {logs.length > 0 && (
                            <Button 
                                onClick={handleClearLogs} 
                                variant="ghost" 
                                size="sm"
                                className="text-xs h-7 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpar
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px]">
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/60 text-center text-xs gap-1.5 h-full">
                                <FileText className="w-8 h-8 text-muted-foreground/35" />
                                <p>Os relatórios de envio aparecerão aqui quando você iniciar o disparo.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <AnimatePresence initial={false}>
                                    {logs.map((log) => (
                                        <motion.div 
                                            key={log.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 ${
                                                log.status === "success" 
                                                    ? "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400"
                                                    : log.status === "error"
                                                    ? "bg-destructive/5 border-destructive/20 text-destructive"
                                                    : "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center font-medium">
                                                <span className="font-semibold truncate">{log.clientName}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono">{log.timestamp}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="font-mono text-muted-foreground">{log.phone}</span>
                                                <span className="font-medium">{log.message}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Instruction Panel for installing/running Evolution API */}
            <Card className="border-primary/20 bg-[#f8f9fc] dark:bg-zinc-950">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-primary" />
                        Guia de Instalação e Configuração da Evolution API
                    </CardTitle>
                    <CardDescription>
                        Siga o passo a passo para colocar a Evolution API em execução na sua infraestrutura.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="step1">
                            <AccordionTrigger className="text-sm font-semibold">1. O que é a Evolution API?</AccordionTrigger>
                            <AccordionContent className="text-sm leading-relaxed text-muted-foreground space-y-2">
                                <p>
                                    A <b>Evolution API</b> é uma API brasileira de WhatsApp (código aberto) extremamente estável que permite integrar sistemas, CRMs, chatbots e ERPs ao WhatsApp sem a necessidade de pagar APIs oficiais caras (WABA) para uso interno.
                                </p>
                                <p>
                                    Com ela, você pode enviar e receber mensagens de texto, mídias (imagens, PDFs), consultar status do dispositivo de forma automática utilizando uma instância hospedada no seu próprio servidor VPS ou máquina local.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="step2">
                            <AccordionTrigger className="text-sm font-semibold">2. Como Instalar via Docker (Recomendado)</AccordionTrigger>
                            <AccordionContent className="text-sm leading-relaxed text-muted-foreground space-y-4">
                                <p>
                                    A forma mais rápida, segura e padronizada de rodar a Evolution API é usando o <b>Docker Compose</b>. Crie um arquivo com o nome <code>docker-compose.yml</code> em uma pasta no seu servidor ou computador local e adicione o seguinte conteúdo:
                                </p>
                                <pre className="bg-zinc-800 text-zinc-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
{`version: '3.8'
services:
  evolution-api:
    image: atendare/evolution-api:v2.1.2 # Ou utilize latest
    ports:
      - "8080:8080"
    environment:
      - SERVER_PORT=8080
      - SERVER_URL=http://localhost:8080
      - API_KEY=SUA_CHAVE_API_SUPER_SEGURA # Mude para um token seguro
      - AUTH_LOCAL_TOKEN=SUA_CHAVE_API_SUPER_SEGURA
      # Ative se quiser persistir dados das instâncias em sqlite ou PostgreSQL
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=sqlite
      - DATABASE_CONNECTION_URI=file:/evolution/data/db.sqlite
    volumes:
      - evolution_data:/evolution/data
    restart: always

volumes:
  evolution_data:`}
                                </pre>
                                <p>
                                    No terminal da sua máquina ou VPS, execute o comando:
                                </p>
                                <code className="bg-muted p-1.5 rounded text-xs font-mono text-primary block w-fit">
                                    docker compose up -d
                                </code>
                                <p>
                                    A API estará no ar e escutando na porta <b>8080</b> (URL: <code>http://localhost:8080</code>).
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="step3">
                            <AccordionTrigger className="text-sm font-semibold">3. Criando sua Instância de WhatsApp</AccordionTrigger>
                            <AccordionContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
                                <p>
                                    Para conectar o seu telefone de WhatsApp, você precisa criar uma instância dentro da API. Você pode criar via requisição curl no terminal ou deixar que nosso painel do CRM crie e recupere o QR Code para você.
                                </p>
                                <p>
                                    <b>Método 1 (Automático pelo CRM):</b> Insira as informações da URL da API (ex: <code>http://localhost:8080</code>), a Chave API global definida no ambiente (<code>API_KEY</code>) e dê um nome para a instância (ex: <code>clube_do_vidro</code>). Salve as configurações e clique em <b>Gerar QR Code / Reconectar</b>.
                                </p>
                                <p>
                                    <b>Método 2 (Via terminal do Linux/macOS):</b> Caso prefira criar manualmente a instância antes, envie a seguinte requisição HTTP:
                                </p>
                                <pre className="bg-zinc-800 text-zinc-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
{`curl --location --request POST 'http://localhost:8080/instance/create' \\
--header 'Content-Type: application/json' \\
--header 'apikey: SUA_CHAVE_API_SUPER_SEGURA' \\
--data-raw '{
    "instanceName": "clube_do_vidro",
    "token": "",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
}'`}
                                </pre>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="step4">
                            <AccordionTrigger className="text-sm font-semibold">4. Prevenção de Bloqueios e Boas Práticas</AccordionTrigger>
                            <AccordionContent className="text-sm leading-relaxed text-muted-foreground space-y-2">
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>
                                        <b>Use um Delay alto:</b> O WhatsApp monitora disparos em massa automáticos. Recomendamos utilizar um <b>delay mínimo de 3 a 5 segundos</b> entre as mensagens.
                                    </li>
                                    <li>
                                        <b>Evite números inexistentes:</b> Tentar enviar mensagens repetidamente para números que não têm WhatsApp ativo alerta os servidores contra spam.
                                    </li>
                                    <li>
                                        <b>Personalize as mensagens:</b> Use variáveis como o <code>Nome</code> e dados do <code>Veículo</code> para que cada mensagem seja ligeiramente diferente. Mensagens idênticas repetidas aumentam as chances de bloqueio da linha.
                                    </li>
                                    <li>
                                        <b>Aqueça a sua linha:</b> Não faça disparos em massa em chips/números recém-criados. Envie mensagens manuais por alguns dias para amigos e responda a mensagens para que o algoritmo do WhatsApp crie reputação no seu chip.
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
