import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface AuthRestrictedModalProps {
  isOpen: boolean;
  onAuthSuccess: () => void;
  onClose?: () => void;
  title: string;
  description?: string;
  validPassword: string;
}

export const AuthRestrictedModal = ({ 
  isOpen, 
  onAuthSuccess, 
  onClose,
  title,
  description = "Esta aba requer autenticação. Digite a senha para continuar.",
  validPassword
}: AuthRestrictedModalProps) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!password) {
      toast({
        title: "Digite a senha",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (password === validPassword) {
        // Armazenar autenticação no sessionStorage
        sessionStorage.setItem("employees_auth", "true");
        sessionStorage.setItem("employees_auth_time", new Date().getTime().toString());
        
        toast({
          title: "Acesso concedido!",
          description: `Bem-vindo à aba ${title}`,
        });
        
        setPassword("");
        onAuthSuccess();
      } else {
        toast({
          title: "Senha inválida",
          description: "A senha digitada está incorreta",
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
            Acesso Restrito - {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {description}
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                autoFocus
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
