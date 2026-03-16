import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Sale {
  id: string;
  description: string;
  amount: number;
  sale_date: string;
  employee_name?: string;
  payment_method?: string;
  notes?: string;
}

interface ReportData {
  storeName: string;
  startDate: Date;
  endDate: Date;
  periodLabel: string;
  sales: Sale[];
}

export const generateStoreCashReport = async (data: ReportData) => {
  const pdf = new jsPDF("p", "mm", "a4");

  // Cores
  const primaryColor = [33, 150, 243]; // Azul
  const successColor = [76, 175, 80]; // Verde
  const mutedColor = [158, 158, 158]; // Cinza

  let yPosition = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 15;
  const marginBottom = 15;

  // ============= HEADER =============
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 0, pageWidth, 30, "F");

  // Título
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("RELATÓRIO DE CAIXA", pageWidth / 2, 15, { align: "center" });

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${data.storeName}`, pageWidth / 2, 24, { align: "center" });

  // ============= INFORMAÇÕES DO PERÍODO =============
  yPosition = 45;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("PERÍODO DO RELATÓRIO", marginX, yPosition);

  yPosition += 8;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  pdf.text(
    `Período: ${data.periodLabel} | De ${formatDate(data.startDate)} a ${formatDate(data.endDate)}`,
    marginX,
    yPosition
  );

  // ============= RESUMO FINANCEIRO =============
  yPosition += 15;
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("RESUMO FINANCEIRO", marginX, yPosition);

  yPosition += 8;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");

  const totalSales = data.sales.reduce((sum, sale) => sum + Number(sale.amount), 0);
  const averageSale = data.sales.length > 0 ? totalSales / data.sales.length : 0;
  const maxSale = data.sales.length > 0 ? Math.max(...data.sales.map((s) => Number(s.amount))) : 0;
  const minSale = data.sales.length > 0 ? Math.min(...data.sales.map((s) => Number(s.amount))) : 0;

  const summaryBox = [
    { label: "Total de Vendas", value: `R$ ${totalSales.toFixed(2)}` },
    { label: "Quantidade de Vendas", value: data.sales.length.toString() },
    { label: "Ticket Médio", value: `R$ ${averageSale.toFixed(2)}` },
    { label: "Maior Venda", value: `R$ ${maxSale.toFixed(2)}` },
    { label: "Menor Venda", value: `R$ ${minSale.toFixed(2)}` },
  ];

  const boxWidth = (pageWidth - marginX * 2) / 2 - 2;
  let boxX = marginX;

  summaryBox.forEach((item, index) => {
    if (index % 2 === 0 && index > 0) {
      yPosition += 18;
      boxX = marginX;
    }

    // Draw box
    pdf.setDrawColor(...primaryColor);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(boxX, yPosition, boxWidth, 16, "FD");

    // Label
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(item.label, boxX + 4, yPosition + 5);

    // Value
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text(item.value, boxX + boxWidth - 4, yPosition + 11, { align: "right" });
    pdf.setTextColor(0, 0, 0);

    boxX += boxWidth + 4;
  });

  yPosition += 20;

  // ============= TABELA DE VENDAS =============
  if (data.sales.length > 0) {
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("DETALHAMENTO DE VENDAS", marginX, yPosition);

    yPosition += 10;

    const tableData = data.sales.map((sale) => [
      formatDate(new Date(sale.sale_date)),
      sale.description.substring(0, 30),
      `R$ ${Number(sale.amount).toFixed(2)}`,
      sale.employee_name || "-",
      sale.payment_method || "-",
    ]);

    autoTable(pdf, {
      startY: yPosition,
      head: [["Data", "Descrição", "Valor", "Vendedor", "Pagamento"]],
      body: tableData,
      margin: { top: marginX, right: marginX, bottom: marginBottom, left: marginX },
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontSize: 9,
        fontStyle: "bold",
        halign: "left",
        padding: 3,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: 0,
        padding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { halign: "center", width: 25 },
        1: { halign: "left", width: 50 },
        2: { halign: "right", width: 30 },
        3: { halign: "left", width: 35 },
        4: { halign: "center", width: 25 },
      },
      didDrawPage: (data) => {
        // Footer
        const pageSize = pdf.internal.pageSize;
        const pageHeight = pageSize.getHeight();
        const pageWidth = pageSize.getWidth();

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `Página ${pdf.internal.pages.length - 1}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );

        pdf.setFontSize(8);
        pdf.setTextColor(...mutedColor);
        pdf.text(
          `Gerado em ${new Date().toLocaleString("pt-BR")}`,
          marginX,
          pageHeight - 10
        );
      },
    });
  } else {
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(...mutedColor);
    pdf.text("Nenhuma venda registrada neste período.", marginX, yPosition);
  }

  // ============= FOOTER =============
  const finalY = pdf.internal.pageSize.getHeight() - marginBottom;
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.5);
  pdf.line(marginX, finalY - 2, pageWidth - marginX, finalY - 2);

  pdf.setFontSize(8);
  pdf.setTextColor(...mutedColor);
  pdf.text(
    "Relatório gerado automaticamente pelo sistema de gestão",
    pageWidth / 2,
    finalY + 3,
    { align: "center" }
  );

  // Download
  const fileName = `caixa_${data.storeName.replace(/\s+/g, "_").toLowerCase()}_${formatDate(new Date()).replace(/\//g, "-")}.pdf`;
  pdf.save(fileName);
};
