import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Inventory from "./pages/Inventory";
import History from "./pages/History";
import AdminPanel from "./pages/AdminPanel";
import Financial from "./pages/Financial";
import SalesNew from "./pages/SalesNew";
import Analytics from "./pages/Analytics";
import Vistoria from "./pages/Vistoria";
import Auth from "./pages/Auth";
import PlanAuth from "./pages/PlanAuth";
import ClientDashboard from "./pages/ClientDashboard";
import Landing from "./pages/Landing";
import CanaisIguacu from "./pages/CanaisIguacu";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import FloatingChat from "./components/FloatingChat";
import WhatsAppAutomation from "./pages/WhatsAppAutomation";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const showFloatingChat = location.pathname === "/" || location.pathname === "/ajuda";

  return (
    <>
      {showFloatingChat && <FloatingChat />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/canais-iguacu" element={<CanaisIguacu />} />
        <Route path="/ajuda" element={<Help />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/plan-auth" element={<PlanAuth />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/estoque" element={<Inventory />} />
          <Route path="/vendas" element={<SalesNew />} />
          <Route path="/analise" element={<Analytics />} />
          <Route path="/historico" element={<History />} />
          <Route path="/financeiro" element={<Financial />} />
          <Route path="/vistoria" element={<Vistoria />} />
          <Route path="/whatsapp" element={<WhatsAppAutomation />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
