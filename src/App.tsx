import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Inventory from "./pages/Inventory";
import History from "./pages/History";
import AdminPanel from "./pages/AdminPanel";
import SalesNew from "./pages/SalesNew";
import Auth from "./pages/Auth";
import PlanAuth from "./pages/PlanAuth";
import ClientDashboard from "./pages/ClientDashboard";
import Landing from "./pages/Landing";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
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
              <Route path="/historico" element={<History />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
