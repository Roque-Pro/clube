import { useState, useEffect } from "react";
import { Check, X, Car, User, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { logAction } from "@/lib/auditLog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const PRICE_OPTIONS = [
  19.90, 29.90, 39.90, 49.90, 59.90, 69.90, 79.90, 89.90, 99.90
];
const POPULAR_STRIPE_PRICE_ID = "price_1TgAzbCnvLpXfmPcAj0OIXUH";
const PRICE_STRIPE_MAP: Record<number, string> = {
  19.90: POPULAR_STRIPE_PRICE_ID,
  29.90: "price_1TskzhCnvLpXfmPcqvQputfD",
  39.90: "price_1TskwQCnvLpXfmPcchREvQno",
  49.90: "price_1Tsl0wCnvLpXfmPcxlqdRtoE",
  59.90: "price_1Tsl31CnvLpXfmPcO0YR4poj",
  69.90: "price_1Tsl4KCnvLpXfmPceU2kEeZx",
  79.90: "price_1Tsl7jCnvLpXfmPcmfHDK3Er",
  89.90: "price_1Tsl9LCnvLpXfmPcbH7o8fkZ",
};

interface PendingVehicle {
  id: string;
  client_id: string;
  client_name: string;
  vehicle: string;
  plate: string;
  vehicle_photo_url: string;
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
  status: string;
  created_at: string;
}

interface PendingClient {
  id: string;
  user_id: string;
  name: string;
  email: string;
  status: string;
}

export const VistoriaTab = () => {
  const [pendingVehicles, setPendingVehicles] = useState<PendingVehicle[]>([]);
  const [pendingClients, setPendingClients] = useState<PendingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { toast } = useToast();

  const [rejectingVehicle, setRejectingVehicle] = useState<{id: string, name: string} | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);
  const [approvingVehicle, setApprovingVehicle] = useState<{id: string, name: string, clientName: string} | null>(null);
  const [approvalMonthlyPrice, setApprovalMonthlyPrice] = useState(PRICE_OPTIONS[0]);
  const [approvalFreeMonth, setApprovalFreeMonth] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pending vehicles
      const { data: vehicles, error: vError } = await supabase
        .from("client_vehicles")
        .select(`
          id,
          vehicle,
          plate,
          vehicle_photo_url,
          photo_front_url,
          photo_back_url,
          photo_left_url,
          photo_right_url,
          photo_headlights_front_url,
          photo_headlights_rear_url,
          photo_mirrors_url,
          photo_interior_rear_url,
          photo_interior_front_url,
          photo_dashboard_url,
          photo_trunk_open_url,
          status,
          created_at,
          client_id,
          clients (name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (vError) throw vError;

      const formattedVehicles = vehicles?.map((v: any) => ({
        id: v.id,
        client_id: v.client_id,
        client_name: v.clients?.name || "N/A",
        vehicle: v.vehicle,
        plate: v.plate,
        vehicle_photo_url: v.vehicle_photo_url,
        photo_front_url: v.photo_front_url,
        photo_back_url: v.photo_back_url,
        photo_left_url: v.photo_left_url,
        photo_right_url: v.photo_right_url,
        photo_headlights_front_url: v.photo_headlights_front_url,
        photo_headlights_rear_url: v.photo_headlights_rear_url,
        photo_mirrors_url: v.photo_mirrors_url,
        photo_interior_rear_url: v.photo_interior_rear_url,
        photo_interior_front_url: v.photo_interior_front_url,
        photo_dashboard_url: v.photo_dashboard_url,
        photo_trunk_open_url: v.photo_trunk_open_url,
        status: v.status,
        created_at: v.created_at,
      })) || [];

      setPendingVehicles(formattedVehicles);
// ... rest of fetchData ...

      // Fetch pending clients (via profiles)
      // Removed 'email' as it doesn't exist in 'profiles' table according to schema
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select(`
          id,
          user_id,
          status,
          full_name
        `)
        .eq("status", "pending");

      if (pError) throw pError;

      // Get client data (email) for these profiles
      const userIds = profiles?.map(p => p.user_id) || [];
      if (userIds.length > 0) {
        const { data: clients, error: cError } = await supabase
          .from("clients")
          .select("user_id, name, email, id")
          .in("user_id", userIds);
        
        if (cError) throw cError;

        const formattedClients = profiles?.map((p: any) => {
          const client = clients?.find(c => c.user_id === p.user_id);
          return {
            id: client?.id || p.id,
            user_id: p.user_id,
            name: client?.name || p.full_name || "Pendente de Nome",
            email: client?.email || "N/A",
            status: p.status
          };
        }) || [];
        setPendingClients(formattedClients);
      } else {
        setPendingClients([]);
      }

    } catch (error: any) {
      console.error("Erro ao buscar dados de vistoria:", error);
      toast({
        title: "Erro ao carregar",
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

  const openApprovalDialog = (vehicleId: string, vehicleName: string, clientName: string) => {
    setApprovingVehicle({ id: vehicleId, name: vehicleName, clientName });
    setApprovalMonthlyPrice(PRICE_OPTIONS[0]);
    setApprovalFreeMonth(false);
  };

  const handleApproveVehicle = async () => {
    if (!approvingVehicle) return;

    const parsedPrice = approvalMonthlyPrice;
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast({ title: "Informe um valor mensal válido", variant: "destructive" });
      return;
    }

    const freeUntil = new Date();
    freeUntil.setMonth(freeUntil.getMonth() + 1);

    const stripePriceId = PRICE_STRIPE_MAP[parsedPrice] || null;

    try {
      const { error } = await supabase
        .from("client_vehicles")
        .update({
          status: "approved",
          monthly_price: parsedPrice,
          stripe_price_id: stripePriceId,
          free_until: approvalFreeMonth ? freeUntil.toISOString().split("T")[0] : null
        })
        .eq("id", approvingVehicle.id);

      if (error) throw error;

      toast({ title: "Veículo aprovado!", description: `${approvingVehicle.name} de ${approvingVehicle.clientName} agora está ativo.` });
      
      await logAction(
        "update",
        "client_vehicles",
        approvingVehicle.id,
        approvingVehicle.name,
        `Vistoria aprovada para o veículo de ${approvingVehicle.clientName} por R$ ${parsedPrice.toFixed(2)}${approvalFreeMonth ? " com 1 mês grátis" : ""}`
      );
      
      setApprovingVehicle(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    }
  };

  const handleRejectVehicle = async () => {
    if (!rejectingVehicle || !rejectionReason.trim()) {
      toast({ title: "Por favor, informe o motivo da recusa", variant: "destructive" });
      return;
    }

    setIsSubmittingRejection(true);
    try {
      const { error } = await supabase
        .from("client_vehicles")
        .update({ 
          status: "rejected",
          rejection_reason: rejectionReason.trim()
        })
        .eq("id", rejectingVehicle.id);

      if (error) throw error;

      toast({ title: "Veículo rejeitado", description: "O cliente será notificado do motivo." });
      
      await logAction("update", "client_vehicles", rejectingVehicle.id, rejectingVehicle.name, `Vistoria rejeitada: ${rejectionReason}`);
      
      setRejectingVehicle(null);
      setRejectionReason("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao rejeitar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  const handleApproveClient = async (userId: string, clientName: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "approved" })
        .eq("user_id", userId);

      if (error) throw error;

      toast({ title: "Cliente aprovado!", description: `${clientName} agora pode acessar o clube.` });
      
      await logAction("update", "profiles", userId, clientName, `Participante aprovado na vistoria`);
      
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Veículos Pendentes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-display font-bold">Veículos Aguardando Vistoria</h3>
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {pendingVehicles.length}
          </span>
        </div>

        {pendingVehicles.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            Nenhum veículo aguardando vistoria no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {pendingVehicles.map((v) => (
                <motion.div
                  key={v.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card overflow-hidden flex flex-col"
                >
                  <div className="p-2 grid grid-cols-3 gap-1 bg-muted">
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
                    ].map((img, idx) => (
                      <div key={idx} className="relative h-20 bg-black/10 rounded overflow-hidden group">
                        {img.url ? (
                          <>
                            <img src={img.url} className="w-full h-full object-cover" alt={img.label} />
                            <button
                              onClick={() => setSelectedPhoto(img.url!)}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px]"
                            >
                              <Eye className="w-3 h-3 mr-1" /> {img.label}
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[7px] text-muted-foreground p-1 text-center">
                            Sem {img.label}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col space-y-2">
                    <div>
                      <h4 className="font-bold text-foreground">{v.vehicle}</h4>
                      <p className="text-sm text-muted-foreground">Placa: <span className="font-mono">{v.plate}</span></p>
                      <p className="text-sm text-primary font-medium mt-1">Dono: {v.client_name}</p>
                    </div>
                    
                    <div className="pt-4 flex gap-2 mt-auto">
                      <Button
                        size="sm"
                        className="flex-1 bg-success hover:bg-success/90 text-success-foreground gap-1"
                        onClick={() => openApprovalDialog(v.id, v.vehicle, v.client_name)}
                      >
                        <Check className="w-4 h-4" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 gap-1"
                        onClick={() => setRejectingVehicle({ id: v.id, name: v.vehicle })}
                      >
                        <X className="w-4 h-4" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Clientes Pendentes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-display font-bold">Participantes Pendentes</h3>
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {pendingClients.length}
          </span>
        </div>

        {pendingClients.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            Nenhum participante aguardando autorização.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {pendingClients.map((c) => (
                <motion.div
                  key={c.user_id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass-card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{c.name}</h4>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-success text-success hover:bg-success/10 gap-1"
                      onClick={() => handleApproveClient(c.user_id, c.name)}
                    >
                      <Check className="w-4 h-4" /> Autorizar
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Approval Dialog */}
      <Dialog open={!!approvingVehicle} onOpenChange={(open) => !open && setApprovingVehicle(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Aprovar Vistoria</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Selecione o valor mensal para o veículo de <strong>{approvingVehicle?.clientName}</strong>
            </p>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Valor mensal</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRICE_OPTIONS.map((price) => (
                  <Button
                    key={price}
                    type="button"
                    variant={approvalMonthlyPrice === price ? "default" : "outline"}
                    onClick={() => setApprovalMonthlyPrice(price)}
                    className="h-12 text-base font-bold"
                  >
                    R$ {price.toFixed(2).replace(".", ",")}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {PRICE_STRIPE_MAP[approvalMonthlyPrice]
                  ? "Stripe configurado para este valor"
                  : "Você precisará configurar este valor na Stripe depois"}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="approval-free-month">Liberar 1 mês grátis</Label>
                <p className="text-xs text-muted-foreground">Permite agendamento sem pagamento até o fim do período.</p>
              </div>
              <Button
                id="approval-free-month"
                type="button"
                variant={approvalFreeMonth ? "default" : "outline"}
                onClick={() => setApprovalFreeMonth((value) => !value)}
              >
                {approvalFreeMonth ? "Ativo" : "Inativo"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingVehicle(null)}>
              Cancelar
            </Button>
            <Button onClick={handleApproveVehicle}>
              Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingVehicle} onOpenChange={(open) => !open && setRejectingVehicle(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Recusar Vistoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Recusa</Label>
              <Textarea
                id="reason"
                placeholder="Explique o que precisa ser ajustado (ex: Foto frontal embaçada, placa ilegível...)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingVehicle(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectVehicle}
              disabled={isSubmittingRejection || !rejectionReason.trim()}
            >
              {isSubmittingRejection ? "Enviando..." : "Confirmar Recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo View Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Vistoria"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
