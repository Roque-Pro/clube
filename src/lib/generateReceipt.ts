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

// Função auxiliar para calcular a altura necessária do documento
const calculateRequiredHeight = (data: ReceiptData): number => {
  let yPosition = 5;

  // Logo
  yPosition += 26;

  // Nome da loja
  const storeNameLines = data.storeName.split('\n');
  yPosition += storeNameLines.length * 4 + 1;

  // Separador e frase evangélica
  yPosition += 3; // separador
  yPosition += 3; // frase 1
  yPosition += 3; // frase 2

  // Título e separador
  yPosition += 3; // RECIBO
  yPosition += 3; // separador

  // Dados da venda
  yPosition += 4; // Data
  yPosition += 4; // ID

  // Produtos
  yPosition += 3; // "PRODUTOS"
  yPosition += 2; // linha separação
  
  data.products.forEach((product) => {
    // Nome do produto
    const estimatedLines = Math.ceil(product.name.length / 30); // aproximadamente 30 caracteres por linha em 80mm
    yPosition += estimatedLines * 3 + 1;
    yPosition += 3; // Qtd e preço
    yPosition += 3; // Subtotal
  });

  // Resumo financeiro
  yPosition += 2;
  yPosition += 12; // Box com total

  // Garantia se aplicável
  if (data.isGlassWarranty) {
    yPosition += 1;
    yPosition += 18; // Box de garantia
    yPosition += 12; // Exclusões
  }

  // Método de pagamento
  yPosition += 1;
  yPosition += 3; // "PAGAMENTO"
  yPosition += 5; // método

  // Observações
  if (data.notes) {
    yPosition += 3; // "OBS"
    const estimatedNoteLines = Math.ceil(data.notes.length / 35);
    yPosition += estimatedNoteLines * 2.5 + 2;
  }

  // Rodapé
  yPosition += 2;
  yPosition += 2;
  yPosition += 2; // "Obrigado!"
  yPosition += 2; // Data

  // Adicionar margem final
  yPosition += 5;

  return yPosition;
};

export const generateReceipt = async (data: ReceiptData): Promise<Blob> => {
  // Calcular altura necessária
  const requiredHeight = calculateRequiredHeight(data);

  // Formato: Bobina térmica 80mm com altura dinâmica
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, requiredHeight], // 80mm de largura, altura calculada dinamicamente
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 5;

  // Configurações de fonte (reduzidas para caber em 80mm)
  const headerFont = 11;
  const titleFont = 10;
  const normalFont = 8;
  const smallFont = 7;

  // Cor primária
  const primaryColor = [31, 41, 55]; // #1f2937

  // ============ CABEÇALHO COM LOGO ============
  
  // Logo centralizada no topo (bem menor para 80mm)
  try {
    const logoBase64 = await loadImageAsBase64(new URL("../img/iguacu_vidros_black.png", import.meta.url).href);
    // Logo reduzida para 80mm
    pdf.addImage(logoBase64, "PNG", pageWidth / 2 - 14, yPosition, 28, 24, undefined, "MEDIUM");
    yPosition += 26;
  } catch (err) {
    console.warn("Erro ao carregar logo:", err);
    yPosition += 5;
  }

  // Nome da loja (centralizado, compacto)
  pdf.setFontSize(headerFont);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...primaryColor);
  const storeNameLines = data.storeName.split('\n');
  let storeNameY = yPosition;
  storeNameLines.forEach((line) => {
    pdf.text(line, pageWidth / 2, storeNameY, { align: "center", maxWidth: 70 });
    storeNameY += 4;
  });
  yPosition = storeNameY + 1;

  // Separador
  pdf.setDrawColor(...primaryColor);
  pdf.line(3, yPosition, pageWidth - 3, yPosition);
  yPosition += 3;

  // Frase evangélica (reduzida)
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(smallFont);
  pdf.setTextColor(100, 100, 100);
  pdf.text('"A mão do Senhor"', pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 3;
  pdf.text('"fez todas essas coisas"', pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 3;

  // ============ INFORMAÇÕES DA VENDA ============

  pdf.setFontSize(titleFont);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...primaryColor);
  pdf.text("RECIBO DE VENDA", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 3;

  // Separador
  pdf.setDrawColor(...primaryColor);
  pdf.line(3, yPosition, pageWidth - 3, yPosition);
  yPosition += 3;

  // Dados da venda (compacto)
  pdf.setFontSize(normalFont);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const dataX = 4;
  const dataWidth = pageWidth - 8;

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
  yPosition += 4;

  // ID da venda (reduzido)
  pdf.setFontSize(smallFont);
  pdf.text(`ID: ${data.saleId}`, dataX, yPosition);
  yPosition += 4;

  // ============ DETALHES DOS PRODUTOS ============

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(normalFont);
  pdf.setTextColor(...primaryColor);
  pdf.text("PRODUTOS", dataX, yPosition);
  yPosition += 3;

  // Linha de separação
  pdf.setDrawColor(200, 200, 200);
  pdf.line(dataX, yPosition, pageWidth - dataX, yPosition);
  yPosition += 2;

  // Lista de produtos (compacta)
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  
  data.products.forEach((product, index) => {
    // Produto (sem número, mais compacto) - AUMENTADO PARA 10
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    const productLines = pdf.splitTextToSize(product.name, dataWidth - 1);
    pdf.text(productLines, dataX + 1, yPosition);
    yPosition += productLines.length * 3.5 + 1;
    pdf.setFont("helvetica", "normal");

    // Quantidade e preço em uma linha compacta
    pdf.setFontSize(smallFont);
    const qtyPrice = `Qtd: ${product.quantity} | R$ ${product.unitPrice.toFixed(2)}`;
    pdf.text(qtyPrice, dataX + 1, yPosition);
    yPosition += 3;
    
    // Subtotal
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total: R$ ${product.subtotal.toFixed(2)}`, dataX + 1, yPosition);
    pdf.setFont("helvetica", "normal");
    yPosition += 3;
  });

  // ============ RESUMO FINANCEIRO ============

  yPosition += 2;

  // Fundo cinzento para destaque
  pdf.setFillColor(240, 240, 240);
  pdf.rect(dataX, yPosition, dataWidth, 10, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(normalFont);
  pdf.setTextColor(...primaryColor);

  pdf.text("TOTAL", dataX + 2, yPosition + 6);
  pdf.setFontSize(12);
  pdf.text(`R$ ${data.totalAmount.toFixed(2)}`, pageWidth - dataX - 2, yPosition + 6, {
    align: "right",
  });

  yPosition += 12;

  // ============ GARANTIA (SOMENTE PARA VIDROS) ============

  if (data.isGlassWarranty) {
    yPosition += 1;
    
    // Fundo destacado para a garantia (compacto)
    pdf.setFillColor(255, 240, 240); // Rosa claro
    pdf.rect(dataX, yPosition, dataWidth, 16, "F");

    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(180, 0, 0); // Vermelho
    
    const warrantyLines = [
      "GARANTIA DE 3 MESES",
      "PARA VAZAMENTO",
      "RETIRAR AS 4 FITAS"
    ];
    
    let warrantyY = yPosition + 2;
    warrantyLines.forEach(line => {
      pdf.text(line, pageWidth / 2, warrantyY, { align: "center" });
      warrantyY += 4;
    });

    yPosition += 18;

    // Exclusões da garantia (compacto)
    pdf.setFillColor(255, 240, 240); // Rosa claro
    pdf.rect(dataX, yPosition, dataWidth, 10, "F");
    
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(180, 0, 0);
    
    const exclusionText = "Não cobrimos quebra de para-brisas, vigias ou vidros de portas.";
    const exclusionLines = pdf.splitTextToSize(exclusionText, dataWidth - 2);
    pdf.text(exclusionLines, dataX + 1, yPosition + 2);
    
    yPosition += 12;
  }

  // ============ MÉTODO DE PAGAMENTO ============

  yPosition += 1;

  pdf.setFontSize(smallFont);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...primaryColor);
  pdf.text("PAGAMENTO", dataX, yPosition);
  yPosition += 3;

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(smallFont);

  const paymentLabels: { [key: string]: string } = {
    dinheiro: "Dinheiro",
    pix: "PIX",
    cartao: "Cartão",
  };

  pdf.text(paymentLabels[data.paymentMethod] || data.paymentMethod, dataX, yPosition);
  yPosition += 5;

  // ============ OBSERVAÇÕES ============

  if (data.notes) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(smallFont);
    pdf.setTextColor(...primaryColor);
    pdf.text("OBS", dataX, yPosition);
    yPosition += 3;

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(6);
    const notesLines = pdf.splitTextToSize(data.notes, dataWidth - 2);
    pdf.text(notesLines, dataX + 1, yPosition);
    yPosition += notesLines.length * 2.5 + 2;
  }

  // ============ RODAPÉ ============

  yPosition += 2;
  pdf.setDrawColor(...primaryColor);
  pdf.line(3, yPosition, pageWidth - 3, yPosition);
  yPosition += 2;

  pdf.setFontSize(6);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(120, 120, 120);
  pdf.text("Obrigado!", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 2;
  pdf.text(`${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, yPosition, {
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
