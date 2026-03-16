import { useState, useEffect } from "react";
import { Calendar, TrendingUp, Users, Package } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface Store {
  id: string;
  name: string;
}

type PeriodType = "7d" | "15d" | "1m" | "3m" | "6m" | "1y";

const getPeriodDates = (type: PeriodType): [Date, Date] => {
  const endDate = new Date();
  const startDate = new Date();

  switch (type) {
    case "7d":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "15d":
      startDate.setDate(endDate.getDate() - 15);
      break;
    case "1m":
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case "3m":
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case "6m":
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case "1y":
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
  }

  return [startDate, endDate];
};

export const SalesAnalytics = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("1m");
  const [loading, setLoading] = useState(true);

  // Data states
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topMargins, setTopMargins] = useState<any[]>([]);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [avgTicket, setAvgTicket] = useState(0);

  const { toast } = useToast();

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from("stores")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (error) throw error;
        setStores(data || []);
      } catch (err: any) {
        console.error("Erro ao carregar lojas:", err);
      }
    };

    fetchStores();
  }, []);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [startDate, endDate] = getPeriodDates(selectedPeriod);

        // Query base
        let query = supabase
          .from("sale_products_employees")
          .select("*,sales(*),products(*)");

        // Adicionar filtro de data
        query = query
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());

        const { data: saleProducts, error: saleError } = await query;

        if (saleError) throw saleError;

        // Filtrar por loja se selecionada
        let filtered = saleProducts || [];
        if (selectedStoreId !== "all") {
          filtered = filtered.filter((sp) => sp.sales?.store_id === selectedStoreId);
        }

        // Calcular métricas
        const sales = filtered.map((sp) => sp.sales).filter(Boolean);
        const total = sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
        const qty = filtered.reduce((sum, sp) => sum + (sp.quantity || 0), 0);
        const count = sales.length;

        setTotalSales(total);
        setTotalQuantity(qty);
        setAvgTicket(count > 0 ? total / count : 0);

        // Top 5 Produtos Mais Vendidos
        const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
        filtered.forEach((sp) => {
          const productName = sp.products?.name || "Desconhecido";
          if (!productMap.has(productName)) {
            productMap.set(productName, { name: productName, quantity: 0, revenue: 0 });
          }
          const p = productMap.get(productName)!;
          p.quantity += sp.quantity || 0;
          p.revenue += Number(sp.subtotal || 0);
        });

        const products = Array.from(productMap.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)
          .map((p) => ({ name: p.name.substring(0, 20), quantidade: p.quantity, faturamento: p.revenue }));

        setTopProducts(products);

        // Top 5 Maiores Margens
        const marginMap = new Map<string, { name: string; margin: number; quantity: number }>();
        filtered.forEach((sp) => {
          const productName = sp.products?.name || "Desconhecido";
          const costPrice = sp.products?.cost_price || 0;
          const salePrice = sp.unit_price || 0;
          const margin = (salePrice - costPrice) * (sp.quantity || 0);

          if (!marginMap.has(productName)) {
            marginMap.set(productName, { name: productName, margin: 0, quantity: 0 });
          }
          const m = marginMap.get(productName)!;
          m.margin += margin;
          m.quantity += sp.quantity || 0;
        });

        const margins = Array.from(marginMap.values())
          .sort((a, b) => b.margin - a.margin)
          .slice(0, 5)
          .map((m) => ({ name: m.name.substring(0, 20), margem: m.margin, quantidade: m.quantity }));

        setTopMargins(margins);

        // Top 5 Vendedores
        const sellerMap = new Map<string, { name: string; sales: number; quantity: number; commissions: number }>();
        filtered.forEach((sp) => {
          const sellerName = sp.employee_name || "Sem vendedor";
          if (!sellerMap.has(sellerName)) {
            sellerMap.set(sellerName, { name: sellerName, sales: 0, quantity: 0, commissions: 0 });
          }
          const s = sellerMap.get(sellerName)!;
          s.sales += Number(sp.subtotal || 0);
          s.quantity += sp.quantity || 0;
          // Comissão aproximada: 1% do subtotal
          s.commissions += Number(sp.subtotal || 0) * 0.01;
        });

        const sellers = Array.from(sellerMap.values())
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5)
          .map((s) => ({ name: s.name.substring(0, 15), vendas: s.sales, quantidade: s.quantity }));

        setTopSellers(sellers);

        // Trend de vendas (por dia)
        const dailyMap = new Map<string, number>();
        sales.forEach((s) => {
          const date = new Date(s.sale_date);
          const key = date.toLocaleDateString("pt-BR");
          dailyMap.set(key, (dailyMap.get(key) || 0) + Number(s.amount || 0));
        });

        const trend = Array.from(dailyMap.entries())
          .map(([date, amount]) => ({ data: date, vendas: amount }))
          .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

        setSalesTrend(trend.slice(-15)); // Últimos 15 dias
      } catch (err: any) {
        console.error("Erro ao carregar analytics:", err);
        toast({
          title: "Erro ao carregar dados",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedPeriod, selectedStoreId, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 mb-8"
    >
      {/* Header com Filtros */}
      <div className="glass-card rounded-lg p-6 border">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">📊 Análise de Vendas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Período</label>
              <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as PeriodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 Dias</SelectItem>
                  <SelectItem value="15d">15 Dias</SelectItem>
                  <SelectItem value="1m">1 Mês</SelectItem>
                  <SelectItem value="3m">3 Meses</SelectItem>
                  <SelectItem value="6m">6 Meses</SelectItem>
                  <SelectItem value="1y">1 Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Loja</label>
              <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Lojas</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>



      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando análises...</p>
        </div>
      ) : (
        <>
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Produtos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-lg p-6 border"
            >
              <h3 className="text-lg font-semibold mb-4">🏆 Top 5 Produtos Mais Vendidos</h3>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => value.toLocaleString("pt-BR")} />
                    <Legend />
                    <Bar dataKey="quantidade" fill="#3b82f6" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sem dados</p>
              )}
            </motion.div>

            {/* Top Margens */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="glass-card rounded-lg p-6 border"
            >
              <h3 className="text-lg font-semibold mb-4">💰 Top 5 Maiores Margens</h3>
              {topMargins.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topMargins}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="margem" fill="#10b981" name="Margem (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sem dados</p>
              )}
            </motion.div>

            {/* Top Vendedores */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="glass-card rounded-lg p-6 border"
            >
              <h3 className="text-lg font-semibold mb-4">👥 Top 5 Vendedores</h3>
              {topSellers.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSellers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="vendas" fill="#f59e0b" name="Vendas (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sem dados</p>
              )}
            </motion.div>

            {/* Trend */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="glass-card rounded-lg p-6 border"
            >
              <h3 className="text-lg font-semibold mb-4">📈 Tendência de Vendas</h3>
              {salesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="vendas"
                      stroke="#8b5cf6"
                      name="Vendas (R$)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sem dados</p>
              )}
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
};
