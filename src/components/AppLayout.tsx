import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import AppSidebar from "./AppSidebar";
import { Menu, X } from "lucide-react";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#2c3493] border-b border-white/10 z-50 md:hidden flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
        <div className="flex items-center gap-2 ml-4">
          <img 
            src="/src/img/iguacu_vidros.PNG" 
            alt="Iguaçu Auto Vidros" 
            className="h-10 object-contain"
          />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen md:w-64 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 min-h-screen w-full md:p-8 p-4 pt-20 md:pt-8 pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
