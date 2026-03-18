import { useState, useEffect } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { Shield, Mail, Lock, User, Check, ArrowLeft as ArrowLeftIcon, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVehicleValidation } from "@/hooks/useVehicleValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { VehicleValidationModal } from "@/components/VehicleValidationModal";

const PlanAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const { validateVehicle, loading: validatingVehicle } =
    useVehicleValidation();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [plate, setPlate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPlanInfo, setShowPlanInfo] = useState(true);

  useEffect(() => {
    // Se vem com state skipPlanInfo, vai direto para o form
    if ((location.state as any)?.skipPlanInfo) {
      setShowPlanInfo(false);
    }
  }, [location]);

  // Vehicle validation state
  const [vehicleValidation, setVehicleValidation] = useState<{
    isNational: boolean;
    brand: string;
    model: string;
    year: string;
  } | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleValidated, setVehicleValidated] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary animate-pulse">
          <Shield className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/client-dashboard" replace />;
  }

  const handleValidateVehicle = async () => {
    if (!vehicle.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o nome do veículo",
        variant: "destructive",
      });
      return;
    }

    const result = await validateVehicle(vehicle);

    if (result) {
      setVehicleValidation({
        isNational: result.isNational,
        brand: result.brand,
        model: result.model,
        year: result.year,
      });
      setShowVehicleModal(true);

      if (result.isNational) {
        setVehicleValidated(true);
      }
    } else {
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar o veículo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se é signup, valida o veículo primeiro
    if (!isLogin && !vehicleValidated) {
      toast({
        title: "Validação necessária",
        description: "Por favor, valide seu veículo antes de continuar",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      if (isLogin) {
         const { error } = await supabase.auth.signInWithPassword({ email, password });
         if (error) throw error;
         toast({ title: "Bem-vindo de volta!", description: "Login realizado com sucesso." });
         setTimeout(() => navigate("/client-dashboard"), 1500);
       } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;

        // Auto-login after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        // Get the user ID from session
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        if (userId) {
          // Check if client already exists (by email)
          const { data: existingClients, error: queryError } = await supabase
            .from("clients")
            .select("id")
            .eq("email", email);

          if (queryError) {
            console.error("Error checking client:", queryError);
          }

          if (!existingClients || existingClients.length === 0) {
            // Save client data to the clients table
            const { data: insertResult, error: clientError } = await supabase
              .from("clients")
              .insert({
                email: email,
                name: fullName,
                phone: phone || "",
                cpf: cpf ? cpf : null,
                vehicle: vehicle || "",
                plate: plate ? plate : null,
                plan_start: new Date().toISOString().split("T")[0],
                plan_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
                replacements_used: 0,
                max_replacements: 3,
                active: true,
              })
              .select();
            
            if (clientError) {
              console.error("Client insert error:", clientError);
              toast({
                title: "Aviso",
                description: "Conta criada, mas houve um erro ao salvar seus dados. Você pode preencher depois.",
                variant: "default",
              });
            } else {
              console.log("Cliente criado com sucesso:", insertResult);
            }
          } else {
            console.log("Cliente já existe com este email");
          }
        }

        toast({ title: "Conta criada com sucesso!", description: "Bem-vindo ao Clube do Vidro!" });
        
        // Redirect to client dashboard
        setTimeout(() => navigate("/client-dashboard"), 1500);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Botão Voltar */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Voltar</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center glow-primary mx-auto mb-4">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Clube do Vidro</h1>
          <p className="text-sm text-muted-foreground mt-1">Iguaçu Auto Vidros</p>
        </div>

        {/* Plan Info Card */}
        {showPlanInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6 border border-primary/30"
          >
            <h2 className="text-lg font-display font-bold text-foreground mb-4">
              Bem-vindo ao Clube do Vidro
            </h2>
            <div className="mb-6 text-center">
              <p className="text-3xl font-display font-black text-primary mb-2">
                R$ 19,90/mês
              </p>
              <p className="text-xs text-muted-foreground">
                (R$ 239,00/ano)
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-1" />
                 <span className="text-sm text-muted-foreground"><strong>3 trocas de vidro</strong> por ano: parabrisa, vigia, vidro de porta e janela (renovação automática)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-1" />
                <span className="text-sm text-muted-foreground"><strong>Assistência 24/7</strong> para emergências</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-1" />
                <span className="text-sm text-muted-foreground"><strong>Sem carência</strong> - use no 1º mês</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-1" />
                <span className="text-sm text-muted-foreground"><strong>100% homologados pelo INMETRO</strong> com garantia</span>
              </div>
            </div>

            <button
              onClick={() => setShowPlanInfo(false)}
              className="text-sm text-primary hover:underline w-full text-center"
            >
              Continuar para cadastro →
            </button>
          </motion.div>
        )}

        {/* Form */}
        {!showPlanInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/30">
              <button
                onClick={() => setShowPlanInfo(true)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Voltar
              </button>
            </div>

            <h2 className="text-lg font-semibold text-foreground mb-6">
              {isLogin ? "Entrar no meu plano" : "Criar minha conta"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="Seu nome"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      placeholder="(45) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Veículo *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="vehicle"
                        placeholder="Honda Civic 2022"
                        value={vehicle}
                        onChange={(e) => {
                          setVehicle(e.target.value);
                          setVehicleValidated(false);
                        }}
                        required
                        disabled={vehicleValidated}
                        className={
                          vehicleValidated ? "opacity-50" : ""
                       }
                      />
                      <Button
                        type="button"
                        onClick={handleValidateVehicle}
                        disabled={validatingVehicle || !vehicle.trim()}
                        className="px-4 whitespace-nowrap"
                        variant={vehicleValidated ? "default" : "outline"}
                      >
                        {validatingVehicle ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : vehicleValidated ? (
                          "✓ Validado"
                        ) : (
                          "Validar"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plate">Placa</Label>
                    <Input
                      id="plate"
                      placeholder="ABC-1D23"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || (!isLogin && !vehicleValidated)}
              >
                {submitting ? "Aguarde..." : isLogin ? "Entrar no plano" : "Criar minha conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? "Não tem conta? Crie uma agora" : "Já tem conta? Faça login"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Vehicle Validation Modal */}
        {vehicleValidation && (
          <VehicleValidationModal
            isOpen={showVehicleModal}
            isNational={vehicleValidation.isNational}
            vehicleInfo={{
              brand: vehicleValidation.brand,
              model: vehicleValidation.model,
              year: vehicleValidation.year,
            }}
            onClose={() => {
              setShowVehicleModal(false);
              if (!vehicleValidation.isNational) {
                setVehicleValidated(false);
              }
            }}
            isLoading={validatingVehicle}
          />
        )}
      </motion.div>
    </div>
  );
};

export default PlanAuth;
