import { useState, useEffect } from "react";
import { Search, UserCog, Phone, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Employee } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch employees from Supabase
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("hire_date", { ascending: false });

        if (error) throw error;

        if (data) {
          const mappedEmployees: Employee[] = data.map((emp: any) => ({
            id: emp.id,
            name: emp.name,
            role: emp.role,
            phone: emp.phone,
            email: emp.email,
            hireDate: emp.hire_date,
            active: emp.active || true,
          }));
          setEmployees(mappedEmployees);
        }
      } catch (error: any) {
        console.error("Erro ao carregar funcionários:", error);
        toast({
          title: "Erro ao carregar funcionários",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary">
            <UserCog className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Funcionários"
        description="Gestão da equipe Iguaçu Auto Vidros"
      />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou cargo..." className="pl-10 bg-card border-border" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((emp, i) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <span className="text-lg font-display font-bold text-primary-foreground">
                    {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{emp.name}</p>
                  <p className="text-sm text-primary font-medium">{emp.role}</p>
                  <div className="mt-3 space-y-1">
                    {emp.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Phone className="w-3 h-3" /> {emp.phone}
                      </p>
                    )}
                    {emp.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Mail className="w-3 h-3" /> {emp.email}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Desde {new Date(emp.hireDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Employees;
