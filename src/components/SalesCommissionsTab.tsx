import { useState, useEffect } from "react";
import { TrendingUp, AlertCircle, Printer, RefreshCw, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface CommissionData {
  employeeId: string;
  employeeName: string;
  totalValue: number;
  transactionCount: number;
  commission: number;
}

interface Transaction {
  id: string;
  type: "venda" | "serviço";
  employeeId: string;
  employeeName: string;
  clientName: string;
  description: string;
  value: number;
  date: string;
}

export const SalesCommissionsTab = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissionData, setCommissionData] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transactionType, setTransactionType] = useState<"venda" | "serviço">("venda");
  const [formData, setFormData] = useState({
    employee_id: "",
    employee_name: "",
    client_name: "",
    description: "",
    value: "",
  });
  const [dateFilter, setDateFilter] = useState<"30" | "90" | "180" | "365">("30");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();

    // Listener para atualizações
    const handleStorageChange = () => {
      fetchData();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const fetchData = async () => {
    try {
      if (!refreshing) setLoading(true);
      const [empRes, servRes, salesRes] = await Promise.all([
        (supabase as any).from("employees").select("*").eq("active", true),
        (supabase as any).from("services").select("*").order("service_date", { ascending: false }),
        (supabase as any).from("sales").select("*").order("sale_date", { ascending: false }),
      ]);

      if (empRes.error) throw empRes.error;
      if (servRes.error) throw servRes.error;
      if (salesRes.error) throw salesRes.error;

      setEmployees(empRes.data || []);

      // Montar lista de transações a partir dos serviços
      const servTransactions: Transaction[] = (servRes.data || []).map((s: any) => ({
        id: s.id,
        type: "serviço",
        employeeId: s.employee_id,
        employeeName: s.employee_name,
        clientName: s.client_name,
        description: s.service_type,
        value: s.value,
        date: s.service_date,
      }));

      // Adicionar transações de vendas (apenas as que têm employee_id)
      const salesTransactions: Transaction[] = (salesRes.data || [])
        .filter((sale: any) => sale.employee_id && sale.employee_name)
        .map((sale: any) => ({
          id: sale.id,
          type: "venda",
          employeeId: sale.employee_id,
          employeeName: sale.employee_name,
          clientName: "Cliente",
          description: sale.description,
          value: sale.amount,
          date: sale.sale_date,
        }));

      // Combinar transações de serviços e vendas
      const trans = [...servTransactions, ...salesTransactions];

      setTransactions(trans);

      // Calcular comissões
      const commissionsMap = new Map<string, CommissionData>();

      trans.forEach((transaction) => {
        const existing = commissionsMap.get(transaction.employeeId);
        const commission = transaction.value * 0.01; // 1% commission

        if (existing) {
          commissionsMap.set(transaction.employeeId, {
            ...existing,
            totalValue: existing.totalValue + transaction.value,
            transactionCount: existing.transactionCount + 1,
            commission: existing.commission + commission,
          });
        } else {
          commissionsMap.set(transaction.employeeId, {
            employeeId: transaction.employeeId,
            employeeName: transaction.employeeName,
            totalValue: transaction.value,
            transactionCount: 1,
            commission: commission,
          });
        }
      });

      const sortedCommissions = Array.from(commissionsMap.values()).sort(
        (a, b) => b.totalValue - a.totalValue
      );

      setCommissionData(sortedCommissions);
    } catch (error: any) {
      console.error("Erro ao carregar comissões:", error);
      if (!refreshing) {
        toast({
          title: "Erro ao carregar dados",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const getFilteredTransactions = () => {
    const days = parseInt(dateFilter);
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return transactions.filter((transaction) => {
      const transDate = new Date(transaction.date);
      return transDate >= cutoffDate;
    });
  };

  const getFilteredCommissions = () => {
    const filteredTrans = getFilteredTransactions();
    const commissionsMap = new Map<string, CommissionData>();

    filteredTrans.forEach((transaction) => {
      const existing = commissionsMap.get(transaction.employeeId);
      const commission = transaction.value * 0.01; // 1% commission

      if (existing) {
        commissionsMap.set(transaction.employeeId, {
          ...existing,
          totalValue: existing.totalValue + transaction.value,
          transactionCount: existing.transactionCount + 1,
          commission: existing.commission + commission,
        });
      } else {
        commissionsMap.set(transaction.employeeId, {
          employeeId: transaction.employeeId,
          employeeName: transaction.employeeName,
          totalValue: transaction.value,
          transactionCount: 1,
          commission: commission,
        });
      }
    });

    return Array.from(commissionsMap.values()).sort(
      (a, b) => b.totalValue - a.totalValue
    );
  };

  const handleAddTransaction = async () => {
    if (!formData.employee_id || !formData.client_name || !formData.description || !formData.value) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("services")
        .insert({
          client_id: "00000000-0000-0000-0000-000000000000",
          client_name: formData.client_name,
          vehicle: "Veículo",
          plate: "SEM PLACA",
          service_type: formData.description,
          description: `${transactionType}: ${formData.description}`,
          value: parseFloat(formData.value),
          employee_id: formData.employee_id,
          employee_name: formData.employee_name,
          installations: 0,
          service_date: new Date().toISOString().split("T")[0],
        });

      if (error) throw error;

      const tipoLabel = transactionType === "venda" ? "Venda" : "Serviço";
      toast({
        title: `${tipoLabel} registrada com sucesso!`,
        description: `${formData.description} - R$ ${parseFloat(formData.value).toFixed(2)}`,
      });

      // Sinaliza atualização
      localStorage.setItem("transactionCreated", new Date().toISOString());

      setFormData({
        employee_id: "",
        employee_name: "",
        client_name: "",
        description: "",
        value: "",
      });
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao registrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintCommission = (data: CommissionData) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header
      doc.setFillColor(25, 118, 210);
      doc.rect(0, 0, pageWidth, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("COMPROVANTE DE COMISSÃO", pageWidth / 2, 15, { align: "center" });
      doc.setFontSize(10);
      doc.text("Clube do Vidro - Vidros Automotivos", pageWidth / 2, 22, { align: "center" });

      doc.setTextColor(0, 0, 0);

      let yPosition = 45;
      doc.setFontSize(10);
      doc.text("Data: " + new Date().toLocaleDateString("pt-BR"), 15, yPosition);
      yPosition += 8;

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("DADOS DO VENDEDOR", 15, yPosition);
      yPosition += 8;

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(`Nome: ${data.employeeName}`, 15, yPosition);
      yPosition += 6;
      const empEmail = employees.find((e) => e.id === data.employeeId)?.email || "—";
      doc.text(`Email: ${empEmail}`, 15, yPosition);
      yPosition += 10;

      doc.setFont(undefined, "bold");
      doc.setFontSize(12);
      doc.text("DETALHES DA COMISSÃO", 15, yPosition);
      yPosition += 8;

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);

      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPosition, pageWidth - 30, 6, "F");
      doc.text("Descrição", 20, yPosition + 4);
      doc.text("Valor", pageWidth - 50, yPosition + 4);
      yPosition += 8;

      const tableData = [
        ["Total de Transações", data.transactionCount.toString()],
        ["Valor Total", `R$ ${data.totalValue.toFixed(2)}`],
        ["Percentual de Comissão", "1%"],
        ["Comissão a Receber", `R$ ${data.commission.toFixed(2)}`],
      ];

      tableData.forEach((row) => {
        doc.text(row[0], 20, yPosition);
        doc.text(row[1], pageWidth - 50, yPosition);
        yPosition += 6;
      });

      yPosition += 6;

      doc.setFont(undefined, "bold");
      doc.setFontSize(10);
      doc.text("ASSINATURA", 15, yPosition);
      yPosition += 20;
      doc.rect(15, yPosition - 8, pageWidth - 30, 0.5);
      doc.text("_________________________", 40, yPosition);
      doc.setFontSize(8);
      doc.text("Assinatura do Vendedor", 40, yPosition + 4);

      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      doc.save(
        `comissao_${data.employeeName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
      );

      toast({
        title: "Comissão impressa com sucesso!",
        description: `Comprovante gerado para ${data.employeeName}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary animate-pulse">
          <TrendingUp className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
    );
  }

  const filteredCommissionData = getFilteredCommissions();
  const filteredTransactions = getFilteredTransactions();

  const totalValue = filteredCommissionData.reduce((sum, data) => sum + data.totalValue, 0);
  const totalCommissions = filteredCommissionData.reduce((sum, data) => sum + data.commission, 0);

  return (
    <div className="space-y-6">
      {/* ABAS */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="registros">➕ Registrar</TabsTrigger>
        </TabsList>

        {/* ABA: DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-lg border border-success/30 bg-gradient-to-br from-success/10 to-transparent"
            >
              <div>
                <p className="text-xs text-muted-foreground mb-1">💰 Total em Vendas/Serviços</p>
                <p className="text-2xl font-bold text-success">
                  R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{commissionData.length} vendedores</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent"
            >
              <div>
                <p className="text-xs text-muted-foreground mb-1">📊 Total de Comissões (1%)</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {totalCommissions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">A distribuir</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent"
            >
              <div>
                <p className="text-xs text-muted-foreground mb-1">🎯 Total de Transações</p>
                <p className="text-2xl font-bold text-blue-500">
                  {filteredCommissionData.reduce((sum, data) => sum + data.transactionCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Vendas e serviços</p>
              </div>
            </motion.div>
          </div>

          {/* FILTRO DE PERÍODO */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <label className="text-sm font-medium text-foreground">Filtrar por período:</label>
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Último Mês (30 dias)</SelectItem>
                <SelectItem value="90">Últimos 3 Meses</SelectItem>
                <SelectItem value="180">Últimos 6 Meses</SelectItem>
                <SelectItem value="365">Último Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* RANKING */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-lg border border-border overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Ranking de Vendedores/Funcionários
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            {filteredCommissionData.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">Nenhuma transação neste período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">#</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Vendedor
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                        Transações
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                        Valor Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                        Comissão (1%)
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommissionData.map((item, index) => (
                      <motion.tr
                        key={item.employeeId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-bold text-primary">#{index + 1}</td>
                        <td className="px-6 py-4 text-sm text-foreground font-medium">{item.employeeName}</td>
                        <td className="px-6 py-4 text-sm text-right text-muted-foreground">
                          {item.transactionCount}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-success">
                          R$ {item.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-primary">
                          R$ {item.commission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => handlePrintCommission(item)}
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ABA: REGISTRAR */}
        <TabsContent value="registros" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4" />
                  Registrar Venda/Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-display">Registrar Nova Transação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo *</Label>
                    <Select value={transactionType} onValueChange={(v) => setTransactionType(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venda">💳 Venda</SelectItem>
                        <SelectItem value="serviço">🔧 Serviço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Vendedor/Funcionário Responsável *</Label>
                    <Select
                      value={formData.employee_id}
                      onValueChange={(value) => {
                        const emp = employees.find((e) => e.id === value);
                        setFormData({ ...formData, employee_id: value, employee_name: emp?.name || "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Nome do Cliente *</Label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="Nome ou empresa"
                    />
                  </div>

                  <div>
                    <Label>Descrição *</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Instalação de para-brisa, Venda de retrovisor"
                    />
                  </div>

                  <div>
                    <Label>Valor (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <Button
                    onClick={handleAddTransaction}
                    disabled={submitting}
                    className="w-full gradient-primary text-primary-foreground font-semibold"
                  >
                    {submitting ? "Registrando..." : "Registrar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* HISTÓRICO DE TRANSAÇÕES */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-lg border border-border overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Histórico de Transações</h3>
                <div className="text-xs text-muted-foreground">
                  {filteredTransactions.length} transações
                </div>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">Nenhuma transação neste período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Vendedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                        Comissão (1%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((trans, index) => (
                      <motion.tr
                        key={trans.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          {new Date(trans.date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            {trans.type === "venda" ? "💳 Venda" : "🔧 Serviço"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-foreground">{trans.employeeName}</td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">{trans.clientName}</td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">{trans.description}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-success text-right">
                          R$ {trans.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-primary text-right">
                          R$ {(trans.value * 0.01).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
