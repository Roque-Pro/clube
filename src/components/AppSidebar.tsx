import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Package, UserCog, History, Shield, LogOut, Settings, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const AppSidebar = () => {
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">Clube do Vidro</h1>
            <p className="text-xs text-muted-foreground">Iguaçu Auto Vidros</p>
          </div>
        </div>
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
        <p className="text-xs text-muted-foreground text-center">
          © 2026 Iguaçu Auto Vidros
        </p>
      </div>
    </aside>
  );
};

export default AppSidebar;
