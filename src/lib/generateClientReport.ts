import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

export interface ClientReportData {
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientCpf: string;
  period: "week" | "month" | "quarter" | "all";
}

export const generateClientReport = async (data: ClientReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // 1. Fetch Client Data (for cooperative info)
  const { data: client } = await supabase
    .from("clients")
    .select("is_cooperative, value_per_car")
    .eq("id", data.clientId)
    .single();

  // 2. Fetch Client Vehicles
  const { data: vehicles } = await supabase
    .from("client_vehicles")
    .select("*")
    .eq("client_id", data.clientId);

  // 3. Fetch Services for the client
  let query = supabase
    .from("services")
    .select("*")
    .eq("client_id", data.clientId);

  // Apply period filter
  if (data.period !== "all") {
    const now = new Date();
    let startDate = new Date();
    if (data.period === "week") startDate.setDate(now.getDate() - 7);
    else if (data.period === "month") startDate.setMonth(now.getMonth() - 1);
    else if (data.period === "quarter") startDate.setMonth(now.getMonth() - 3);
    
    query = query.gte("service_date", startDate.toISOString().split("T")[0]);
  }

  const { data: services } = await query;

  // 3. Process Data
  const vehiclesCount = vehicles?.length || 0;
  const servicesCount = services?.length || 0;
  
  // Count services per car (by plate)
  const servicesPerCar: { [plate: string]: number } = {};
  vehicles?.forEach(v => {
    servicesPerCar[v.plate] = services?.filter(s => s.plate === v.plate).length || 0;
  });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55);
  doc.text("Relatório de Cliente", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, pageWidth / 2, 28, { align: "center" });

  // Client Info Section
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text("Informações do Cliente", 14, 40);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Nome: ${data.clientName}`, 14, 48);
  doc.text(`CPF / CNPJ: ${data.clientCpf || "N/A"}`, 14, 54);
  doc.text(`Telefone: ${data.clientPhone}`, 14, 60);
  doc.text(`E-mail: ${data.clientEmail || "N/A"}`, 14, 66);
  
  // Summary Section
  doc.setFontSize(14);
  doc.text("Resumo no Período", 14, 80);
  
  const periodLabels = {
    week: "Última Semana",
    month: "Último Mês",
    quarter: "Último Trimestre",
    all: "Todo o Período"
  };
  
  doc.setFontSize(10);
  doc.text(`Período selecionado: ${periodLabels[data.period]}`, 14, 88);
  doc.text(`Total de veículos cadastrados: ${vehiclesCount}`, 14, 94);
  doc.text(`Total de serviços realizados: ${servicesCount}`, 14, 100);

  // Vehicles Table
  doc.setFontSize(14);
  doc.text("Veículos e Frequência", 14, 115);
  
  const vehicleRows = vehicles?.map(v => [
    v.vehicle,
    v.plate,
    servicesPerCar[v.plate] || 0
  ]) || [];

  autoTable(doc, {
    startY: 120,
    head: [["Veículo", "Placa", "Qtd. Serviços"]],
    body: vehicleRows,
    headStyles: { fillColor: [31, 41, 55] },
  });

  // Recent Services Table
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  doc.setFontSize(14);
  doc.text("Histórico de Serviços (Recentes)", 14, finalY + 15);
  
  const serviceRows = services?.map(s => [
    new Date(s.service_date).toLocaleDateString("pt-BR"),
    s.vehicle,
    s.plate,
    s.service_type,
    `R$ ${Number(s.value).toFixed(2)}`
  ]) || [];

  autoTable(doc, {
    startY: finalY + 20,
    head: [["Data", "Veículo", "Placa", "Serviço", "Valor"]],
    body: serviceRows,
    headStyles: { fillColor: [75, 85, 99] },
  });

  // Cooperative Billing Section (Conditional)
  if (client?.is_cooperative) {
    const tableFinalY = (doc as any).lastAutoTable.finalY || finalY + 20;
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text("Faturamento Cooperativa", 14, tableFinalY + 20);
    
    const valuePerCar = Number(client.value_per_car) || 0;
    const totalBilling = vehiclesCount * valuePerCar;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de Veículos: ${vehiclesCount}`, 14, tableFinalY + 28);
    doc.text(`Valor por Veículo: R$ ${valuePerCar.toFixed(2)}`, 14, tableFinalY + 34);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total a Faturar: R$ ${totalBilling.toFixed(2)}`, 14, tableFinalY + 42);
    doc.setFont("helvetica", "normal");
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} - Iguaçu Auto Vidros - Clube do Parabrisa`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`relatorio_${data.clientName.replace(/\s+/g, "_")}.pdf`);
};
