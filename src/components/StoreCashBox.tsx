import { useState, useEffect } from "react";
import { Calendar, Download, DollarSign, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateStoreCashReport } from "@/lib/generateStoreCashReport";
import { formatCurrency } from "@/lib/utils";

interface Store {
  id: string;
  name: string;
  code: string;
  phone?: string;
  address?: string;
}

interface CashData {
  storeId: string;
  storeName: string;
  totalSales: number;
  salesCount: number;
  period: string;
}

type PeriodType = "1d" | "15d" | "1m" | "3m" | "6m" | "1y" | "custom";

interface PeriodOption {
  label: string;
  value: PeriodType;
  getDates: () => [Date, Date];
}

const getPeriodDates = (type: PeriodType): [Date, Date] => {
  const endDate = new Date();
  const startDate = new Date();

  switch (type) {
    case "1d":
      startDate.setDate(endDate.getDate() - 1);
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
    default:
      startDate.setDate(endDate.getDate() - 1);
  }

  return [startDate, endDate];
};

const periodOptions: PeriodOption[] = [
  { label: "1 Dia", value: "1d", getDates: () => getPeriodDates("1d") },
  { label: "15 Dias", value: "15d", getDates: () => getPeriodDates("15d") },
  { label: "1 Mês", value: "1m", getDates: () => getPeriodDates("1m") },
  { label: "Trimestre", value: "3m", getDates: () => getPeriodDates("3m") },
  { label: "Semestre", value: "6m", getDates: () => getPeriodDates("6m") },
  { label: "Ano", value: "1y", getDates: () => getPeriodDates("1y") },
];

export const StoreCashBox = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [cashData, setCashData] = useState<CashData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("1d");
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
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
        toast({
          title: "Erro ao carregar lojas",
          description: err.message,
          variant: "destructive",
        });
      }
    };

    fetchStores();
  }, [toast]);

  // Fetch cash data based on period
  useEffect(() => {
    const fetchCashData = async () => {
      setLoading(true);
      try {
        const [startDate, endDate] = getPeriodDates(selectedPeriod);

        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("store_id, amount")
          .gte("sale_date", startDate.toISOString())
          .lte("sale_date", endDate.toISOString());

        if (salesError) throw salesError;

        // Group by store
        const grouped: { [key: string]: { total: number; count: number; storeName: string } } = {};

        stores.forEach((store) => {
          grouped[store.id] = { total: 0, count: 0, storeName: store.name };
        });

        (salesData || []).forEach((sale) => {
          if (grouped[sale.store_id]) {
            grouped[sale.store_id].total += Number(sale.amount);
            grouped[sale.store_id].count += 1;
          }
        });

        const data = Object.entries(grouped).map(([storeId, values]) => ({
          storeId,
          storeName: values.storeName,
          totalSales: values.total,
          salesCount: values.count,
          period: selectedPeriod,
        }));

        setCashData(data);
      } catch (err: any) {
        console.error("Erro ao carregar dados de caixa:", err);
        toast({
          title: "Erro ao carregar dados",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (stores.length > 0) {
      fetchCashData();
    }
  }, [selectedPeriod, stores, toast]);

  const handleGenerateReport = async (storeId: string, storeName: string) => {
    setGeneratingReport(true);
    try {
      const [startDate, endDate] = getPeriodDates(selectedPeriod);

      const { data: salesData, error } = await supabase
        .from("sales")
        .select("*")
        .eq("store_id", storeId)
        .gte("sale_date", startDate.toISOString())
        .lte("sale_date", endDate.toISOString())
        .order("sale_date", { ascending: false });

      if (error) throw error;

      const periodLabel = periodOptions.find((p) => p.value === selectedPeriod)?.label || "Período";

      await generateStoreCashReport({
        storeName,
        startDate,
        endDate,
        periodLabel,
        sales: salesData || [],
      });

      toast({
        title: "Relatório gerado com sucesso",
        description: `Relatório de ${storeName} baixado`,
      });
    } catch (err: any) {
      console.error("Erro ao gerar relatório:", err);
      toast({
        title: "Erro ao gerar relatório",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const totalGeneral = cashData.reduce((sum, item) => sum + item.totalSales, 0);

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-medium">Período:</span>
        <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as PeriodType)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Caixa por Loja */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando dados de caixa...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cashData.map((data, index) => (
            <motion.div
              key={data.storeId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-lg p-6 border"
            >
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-primary mb-1">{data.storeName}</h3>
                <p className="text-xs text-muted-foreground">
                  {periodOptions.find((p) => p.value === selectedPeriod)?.label}
                </p>
              </div>

              {/* Total Sales */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  <span className="text-3xl font-bold text-success">
                    {formatCurrency(data.totalSales)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {data.salesCount} {data.salesCount === 1 ? "venda" : "vendas"}
                </p>
              </div>

              {/* Estatísticas */}
              {data.salesCount > 0 && (
                <div className="mb-6 p-3 bg-muted/30 rounded-lg border border-muted">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Ticket Médio:</span>
                    <span className="font-semibold">
                      {formatCurrency(data.totalSales / data.salesCount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Button Gerar Relatório */}
              <Button
                onClick={() => handleGenerateReport(data.storeId, data.storeName)}
                disabled={generatingReport || data.salesCount === 0}
                className="w-full"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {generatingReport ? "Gerando..." : "Gerar Relatório"}
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Total Geral */}
      {cashData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-lg p-6 border border-primary/20 bg-primary/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold">Total Geral</span>
            </div>
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(totalGeneral)}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
