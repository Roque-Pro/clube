import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Package, UserCog, History, Shield, LogOut, Settings, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AppSidebarProps {
  onClose?: () => void;
}

const AppSidebar = ({ onClose }: AppSidebarProps) => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Serviços" },
    { to: "/clientes", icon: Users, label: "Clientes" },
    { to: "/estoque", icon: Package, label: "Estoque" },
    { to: "/vendas", icon: ShoppingCart, label: "Vendas" },
    { to: "/historico", icon: History, label: "Histórico" },
    ...(isAdmin ? [{ to: "/admin", icon: Settings, label: "Painel Admin" }] : []),
  ];

  return (
    <aside className="h-screen w-64 bg-[#2c3493] border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10 flex items-center justify-center">
        <img 
          src="/img/iguacu_vidros.PNG" 
          alt="Iguaçu Auto Vidros" 
          className="h-24 object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary glow-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {user && (
          <div className="px-2">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            {isAdmin && (
              <span className="text-[10px] text-primary font-semibold uppercase">Administrador</span>
            )}
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/15 hover:text-destructive transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
        <p className="text-xs text-muted-foreground text-center mb-2">
          © 2026 Iguaçu Auto Vidros
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Desenvolvido por <a href="https://www.technexos.com.br" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white font-semibold">TechNexos</a>
        </p>
      </div>
    </aside>
  );
};

export default AppSidebar;
