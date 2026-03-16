import PageHeader from "@/components/PageHeader";
import { BarChart3 } from "lucide-react";
import { SalesAnalytics } from "@/components/SalesAnalytics";

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        icon={BarChart3}
        title="Análise de Vendas"
        description="Acompanhe métricas e desempenho de vendas"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SalesAnalytics />
      </main>
    </div>
  );
};

export default Analytics;
