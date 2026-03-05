import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface FinancialAuthModalProps {
  isOpen: boolean;
  onAuthSuccess: () => void;
  onClose?: () => void;
}

export const FinancialAuthModal = ({ isOpen, onAuthSuccess, onClose }: FinancialAuthModalProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!username || !password) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Credenciais hardcoded (você pode mover para Supabase depois)
      const validUsername = "financeiro";
      const validPassword = "financeiro2026@";

      if (username === validUsername && password === validPassword) {
        // Armazenar autenticação no sessionStorage
        sessionStorage.setItem("financial_auth", "true");
        sessionStorage.setItem("financial_auth_time", new Date().getTime().toString());
        
        toast({
          title: "Acesso concedido!",
          description: "Bem-vindo à aba Financeiro",
        });
        
        setUsername("");
        setPassword("");
        onAuthSuccess();
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "Usuário ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na autenticação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && onClose) {
        onClose();
      }
    }}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Acesso Restrito - Financeiro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta aba requer autenticação. Digite suas credenciais para continuar.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground font-semibold"
          >
            {loading ? "Autenticando..." : "Acessar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
