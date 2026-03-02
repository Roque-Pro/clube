import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, userStatus } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

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
    return <Navigate to="/auth" replace />;
  }

  if (userStatus === "blocked") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-xl bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Acesso Bloqueado</h2>
          <p className="text-sm text-muted-foreground">
            Seu acesso ao sistema foi bloqueado. Entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
