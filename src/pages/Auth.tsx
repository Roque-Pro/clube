import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      setTimeout(() => navigate("/dashboard"), 1500);
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: "rgba(45, 49, 146, 0.1)" }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: "rgba(45, 49, 146, 0.05)" }} />
      </div>

      {/* Botão Voltar */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Voltar</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-block"
          >
            <img 
              src="/img/iguacu_vidros_black.png" 
              alt="Iguacu Auto Vidros" 
              className="h-32 object-contain mx-auto mb-4"
            />
          </motion.div>
          <h1 className="text-2xl font-display font-bold mb-2" style={{ color: "#2d3192" }}>
            Sistema Administrativo
          </h1>
          <p className="text-sm text-muted-foreground">Acesso restrito</p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-2xl border-2 p-8"
          style={{ borderColor: "#2d3192", backgroundColor: "#2d3192" }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold mb-2 text-white">
              Acessar Sistema
            </h2>
            <div className="h-1 w-12 rounded-full mx-auto mb-3" style={{ backgroundColor: "#ffffff" }} />
            <p className="text-sm text-white/90">
              Digite suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-white">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "#2d3192" }} />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-muted/50 border-border focus:bg-background transition-all"
                  style={{ "--tw-ring-color": "#2d3192" } as any}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-white">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "#2d3192" }} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-muted/50 border-border focus:bg-background transition-all"
                  style={{ "--tw-ring-color": "#2d3192" } as any}
                  minLength={6}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.div
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              className="pt-2"
            >
              <Button 
                type="submit" 
                className="w-full text-white font-semibold py-2.5 text-base"
                style={{ backgroundColor: "#2d3192" }}
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Aguarde...
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-xs text-white/80 text-center">
              Sistema protegido por autenticação segura
            </p>
          </div>
        </motion.div>

        {/* Bottom decoration */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Problemas para acessar? Entre em contato com o suporte
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
