import jsPDF from "jspdf";

export interface ReceiptProduct {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isGlass?: boolean; // Cada produto pode ser ou não vidro
}

export interface ReceiptData {
  saleId: string;
  storeName: string;
  storeContact: string;
  storeAddress: string;
  storeLogo?: string;
  storeEmail?: string;
  products: ReceiptProduct[]; // Array de produtos
  totalAmount: number;
  paymentMethod: string;
  saleDate: string;
  notes?: string;
  isGlassWarranty?: boolean; // Se ALGUM produto é vidro (mostra garantia no final)
}

// Função para carregar imagem como base64
const loadImageAsBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Não conseguiu carregar canvas"));
      }
    };
    img.onerror = () => reject(new Error("Erro ao carregar imagem"));
    img.src = url;
  });
};

export const generateReceipt = async (data: ReceiptData): Promise<Blob> => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 10;

  // Configurações de fonte
  const headerFont = 16;
  const titleFont = 14;
  const normalFont = 10;
  const smallFont = 8;

  // Cor primária
  const primaryColor = [31, 41, 55]; // #1f2937

  // ============ CABEÇALHO COM LOGO ============
  
  // Logo centralizada no topo (comprimida)
  try {
    const logoBase64 = await loadImageAsBase64(new URL("../img/iguacu_vidros.PNG", import.meta.url).href);
    // Usa JPEG com qualidade reduzida para reduzir tamanho
    pdf.addImage(logoBase64, "JPEG", pageWidth / 2 - 15, yPosition, 30, 30, undefined, "MEDIUM");
    yPosition += 40;
  } catch (err) {
    console.warn("Erro ao carregar logo:", err);
    yPosition += 10;
  }

  // Nome da loja (centralizado)
  pdf.setFontSize(headerFont);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...primaryColor);
  pdf.text(data.storeName, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 8;

  // Separador
  pdf.setDrawColor(...primaryColor);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  // Endereço, Telefone e Email
  pdf.setFontSize(smallFont);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(80, 80, 80);
  
  const addressLines = pdf.splitTextToSize(data.storeAddress, pageWidth - 30);
  pdf.text(addressLines, pageWidth / 2, yPosition, { align: "center" });
  yPosition += addressLines.length * 3 + 2;
  
  pdf.text(`Telefone: ${data.storeContact}`, pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 4;
  
  if (data.storeEmail) {
    pdf.text(`e-mail: ${data.storeEmail}`, pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 4;
  }

  // Frase evangélica
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('"A mão do Senhor fez todas essas coisas"', pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 8;

  // ============ INFORMAÇÕES DA VENDA ============

  pdf.setFontSize(titleFont);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...primaryColor);
  pdf.text("RECIBO DE VENDA", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 8;

  // Separador
  pdf.setDrawColor(...primaryColor);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  // Dados da venda
  pdf.setFontSize(normalFont);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const dataX = 20;
  const dataWidth = pageWidth - 40;

  // Data - Converte para timezone de São Paulo/Paraná (America/Sao_Paulo)
  const saleDate = new Date(data.saleDate);
  const dataFormatted = new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Sao_Paulo"
  }).format(saleDate);
  pdf.text(`Data: ${dataFormatted}`, dataX, yPosition);
  yPosition += 6;

  // ID da venda
  pdf.text(`ID da Venda: ${data.saleId}`, dataX, yPosition);
  yPosition += 10;

  // ============ DETALHES DOS PRODUTOS ============

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(normalFont);
  pdf.setTextColor(...primaryColor);
  pdf.text("Descrição dos Produtos", dataX, yPosition);
  yPosition += 6;

  // Linha de separação
  pdf.setDrawColor(200, 200, 200);
  pdf.line(dataX, yPosition, pageWidth - dataX, yPosition);
  yPosition += 4;

  // Lista de produtos
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  
  data.products.forEach((product, index) => {
    // Produto
    const productLines = pdf.splitTextToSize(`${index + 1}. ${product.name}`, dataWidth);
    pdf.text(productLines, dataX, yPosition);
    yPosition += productLines.length * 4 + 2;

    // Quantidade e preço
    pdf.setFontSize(normalFont - 1);
    pdf.text(`   Quantidade: ${product.quantity} un. | Unitário: R$ ${product.unitPrice.toFixed(2)}`, dataX, yPosition);
    yPosition += 5;
    pdf.text(`   Subtotal: R$ ${product.subtotal.toFixed(2)}`, dataX, yPosition);
    yPosition += 7;
    pdf.setFontSize(normalFont);
  });

  // ============ RESUMO FINANCEIRO ============

  // Fundo cinzento para destaque
  pdf.setFillColor(240, 240, 240);
  pdf.rect(dataX, yPosition, dataWidth, 20, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(normalFont);
  pdf.setTextColor(...primaryColor);

  pdf.text("TOTAL", dataX + 5, yPosition + 6);
  pdf.setFontSize(18);
  pdf.text(`R$ ${data.totalAmount.toFixed(2)}`, pageWidth - dataX - 5, yPosition + 6, {
    align: "right",
  });

  yPosition += 22;

  // ============ GARANTIA (SOMENTE PARA VIDROS) ============

  if (data.isGlassWarranty) {
    // Fundo destacado para a garantia
    pdf.setFillColor(255, 240, 240); // Rosa claro
    pdf.rect(dataX, yPosition, dataWidth, 28, "F");

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(180, 0, 0); // Vermelho
    
    const warrantyLines = [
      "GARANTIA DE 3 MESES",
      "PARA VAZAMENTO",
      "RETIRAR AS 4 FITAS",
      "APÓS LIBERAÇÃO"
    ];
    
    let warrantyY = yPosition + 4;
    warrantyLines.forEach(line => {
      pdf.text(line, pageWidth / 2, warrantyY, { align: "center" });
      warrantyY += 6;
    });

    yPosition += 32;
  }

  // ============ MÉTODO DE PAGAMENTO ============

  pdf.setFontSize(normalFont);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...primaryColor);
  pdf.text("Método de Pagamento", dataX, yPosition);
  yPosition += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const paymentLabels: { [key: string]: string } = {
    dinheiro: "Dinheiro em Espécie",
    pix: "PIX",
    cartao: "Cartão de Crédito/Débito",
  };

  pdf.text(paymentLabels[data.paymentMethod] || data.paymentMethod, dataX, yPosition);
  yPosition += 10;

  // ============ OBSERVAÇÕES ============

  if (data.notes) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(normalFont);
    pdf.setTextColor(...primaryColor);
    pdf.text("Observações", dataX, yPosition);
    yPosition += 5;

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(smallFont);
    const notesLines = pdf.splitTextToSize(data.notes, dataWidth);
    pdf.text(notesLines, dataX, yPosition);
    yPosition += notesLines.length * 4 + 5;
  }

  // ============ RODAPÉ ============

  yPosition = pageHeight - 20;
  pdf.setDrawColor(...primaryColor);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  pdf.setFontSize(smallFont);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(120, 120, 120);
  pdf.text("Obrigado pela compra!", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 4;
  pdf.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, yPosition, {
    align: "center",
  });

  // ============ RETORNAR BLOB ============

  return pdf.output("blob");
};

// Função auxiliar para download direto (mantém compatibilidade)
export const downloadReceipt = async (data: ReceiptData) => {
  const blob = await generateReceipt(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `recibo_${data.saleId}_${new Date().toISOString().split("T")[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
