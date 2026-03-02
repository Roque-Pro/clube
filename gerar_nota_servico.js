import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

const doc = new jsPDF('p', 'mm', 'a4');
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 15;
const contentWidth = pageWidth - 2 * margin;

let yPos = 10;

// Cores
const primaryColor = [30, 50, 140]; // Azul Iguaçu
const secondaryColor = [100, 100, 100]; // Cinza
const accentColor = [240, 120, 30]; // Laranja

// Helper para adicionar linha de separação
const addLine = (yPosition, color = primaryColor) => {
  doc.setDrawColor(...color);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
};

// Helper para adicionar texto
const addText = (text, x = margin, y = yPos, options = {}) => {
  const {
    size = 10,
    color = [0, 0, 0],
    align = 'left',
    bold = false,
    maxWidth = contentWidth
  } = options;

  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.text(text, x, y, { align, maxWidth });
  return y;
};

// Header com logo placeholder e título
yPos = 15;
doc.setFillColor(...primaryColor);
doc.rect(0, 0, pageWidth, 35, 'F');

// Espaço para logo (placeholder)
doc.setFontSize(12);
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.text('[LOGO IGUAÇU AUTO VIDROS]', margin, 12);

// Título
doc.setFontSize(16);
doc.setFont('helvetica', 'bold');
doc.text('NOTA DE SERVIÇO', pageWidth / 2, 25, { align: 'center' });

yPos = 45;

// Informacoes da empresa
addText('PRESTADORA DE SERVICO', margin, yPos, { size: 11, bold: true, color: primaryColor });
yPos += 7;
addText('NexosDigital', margin, yPos, { size: 10, bold: true });
yPos += 5;
addText('Desenvolvimento de Plataformas Digitais', margin, yPos, { size: 9, color: secondaryColor });
yPos += 8;

// Cliente
addText('CLIENTE', margin, yPos, { size: 11, bold: true, color: primaryColor });
yPos += 7;
addText('Iguacu Auto Vidros | Clube do Vidro', margin, yPos, { size: 10, bold: true });
yPos += 8;

// Linha de separação
addLine(yPos);
yPos += 6;

// Projeto
addText('PROJETO: Plataforma de Gestão - Clube do Vidro', margin, yPos, { size: 10, bold: true });
yPos += 7;

const hoje = new Date().toLocaleDateString('pt-BR');
addText(`Data da Nota: ${hoje}`, margin, yPos, { size: 9 });
yPos += 8;

addLine(yPos);
yPos += 8;

// CRONOGRAMA DETALHADO
addText('CRONOGRAMA DE EXECUÇÃO', margin, yPos, { size: 12, bold: true, color: primaryColor });
yPos += 8;

// Semana 1 (Concluída)
doc.setFillColor(200, 230, 200);
doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
addText('SEMANA 1 (CONCLUÍDA) - Desenvolvimento e Implementação', margin + 2, yPos, { size: 10, bold: true, color: [0, 100, 0] });
yPos += 8;

const week1Tasks = [
  '[CONCLUIDO] Estrutura do projeto com React + TypeScript + Vite',
  '[CONCLUIDO] Implementacao do banco de dados (Supabase)',
  '[CONCLUIDO] Sistema de autenticacao e gestao de usuarios',
  '[CONCLUIDO] Dashboard e painel de controle',
  '[CONCLUIDO] Modulo de gestao de clientes',
  '[CONCLUIDO] Sistema de estoque e inventario',
  '[CONCLUIDO] Modulo de vendas com calculo de comissoes',
  '[CONCLUIDO] Historico de acoes e auditoria',
  '[CONCLUIDO] Interface responsiva com TailwindCSS + ShadcN UI',
  '[CONCLUIDO] Temas claro/escuro implementados'
];

week1Tasks.forEach(task => {
  addText(task, margin + 5, yPos, { size: 9 });
  yPos += 5;
});

yPos += 3;

// Semana 2 (Atual)
doc.setFillColor(255, 240, 200);
doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
addText('SEMANA 2 (ATUAL) - Ajustes Finais e Testes', margin + 2, yPos, { size: 10, bold: true, color: [180, 100, 0] });
yPos += 8;

const week2Tasks = [
  '[EM PROGRESSO] Configuracao de dominio: _________________________',
  '[EM PROGRESSO] Implementacao de logica: Vendedor associado a Produto',
  '[EM PROGRESSO] Testes de integracao e funcionalidades',
  '[EM PROGRESSO] Ajustes de performance e otimizacoes',
  '[EM PROGRESSO] Revisao de UX/UI',
  '[EM PROGRESSO] Testes em diferentes navegadores',
  '[EM PROGRESSO] Validacoes e tratamento de erros'
];

week2Tasks.forEach(task => {
  addText(task, margin + 5, yPos, { size: 9 });
  yPos += 5;
});

yPos += 3;

// Proximas semanas
doc.setFillColor(220, 220, 255);
doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
addText('SEMANAS 3+ - Pos-Liberacao e Monitoramento', margin + 2, yPos, { size: 10, bold: true, color: [30, 50, 140] });
yPos += 8;

const futureTasks = [
  '[PLANEJADO] Liberacao do sistema em producao',
  '[PLANEJADO] Monitoramento continuo',
  '[PLANEJADO] Sugestoes de melhorias com base no uso real',
  '[PLANEJADO] Ajustes solicitados pelos usuarios',
  '[PLANEJADO] Novas funcionalidades conforme demanda'
];

futureTasks.forEach(task => {
  addText(task, margin + 5, yPos, { size: 9 });
  yPos += 5;
});

yPos += 3;

// Nova página para pagamento e domínios
if (yPos > 200) {
  doc.addPage();
  yPos = 15;
}

addLine(yPos);
yPos += 8;

// Sugestoes de Dominio
addText('SUGESTOES DE DOMINIO', margin, yPos, { size: 12, bold: true, color: primaryColor });
yPos += 7;
addText('Verifique disponibilidade e escolha uma das opcoes abaixo:', margin, yPos, { size: 9 });
yPos += 6;

const domains = [
  '[ ] clube.iguacuvidros.com.br',
  '[ ] app.iguacuvidros.com.br',
  '[ ] sistema.iguacuvidros.com.br',
  '[ ] plataforma.iguacuvidros.com.br'
];

domains.forEach(domain => {
  addText(domain, margin + 8, yPos, { size: 9 });
  yPos += 5;
});

yPos += 3;

// Link do Drive
addText('DOCUMENTACAO - Acesso ao Codigo', margin, yPos, { size: 11, bold: true, color: primaryColor });
yPos += 7;
addText('Link do Drive (Codigo do Projeto):', margin, yPos, { size: 9, bold: true });
yPos += 5;
addText('___________________________________________________', margin + 5, yPos, { size: 9 });
yPos += 8;

addLine(yPos);
yPos += 8;

// Estrutura de Pagamento
addText('PLANO DE PAGAMENTO', margin, yPos, { size: 12, bold: true, color: primaryColor });
yPos += 8;

// Tabela de pagamento
const tableStartY = yPos;
const colWidth = contentWidth / 4;

// Header
doc.setFillColor(...primaryColor);
doc.rect(margin, tableStartY - 5, contentWidth, 6, 'F');

const headers = ['Etapa', 'Percentual', 'Valor', 'Data'];
headers.forEach((header, i) => {
  addText(header, margin + (i * colWidth) + 3, tableStartY, { size: 9, bold: true, color: [255, 255, 255] });
});

yPos = tableStartY + 6;

// Dados da tabela
const payments = [
  ['1a Parcela', '1/3', '_____________', 'Semana 1 (Concluida)'],
  ['2a Parcela', '1/3', '_____________', 'Inicio Semana 3'],
  ['3a Parcela', '1/3', '_____________', '30 dias apos liberacao']
];

doc.setDrawColor(200, 200, 200);
payments.forEach((row, idx) => {
  const rowY = yPos + (idx * 8);
  if (idx > 0) doc.line(margin, rowY - 1, pageWidth - margin, rowY - 1);
  
  row.forEach((cell, i) => {
    const cellX = margin + (i * colWidth) + 3;
    addText(cell, cellX, rowY + 1, { size: 9 });
  });
});

yPos = yPos + (payments.length * 8) + 5;

// Valor Total
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(...accentColor);
const valorTotalY = yPos + 3;
doc.text('VALOR TOTAL DO PROJETO: _______________', pageWidth - margin - 80, valorTotalY);

yPos = valorTotalY + 12;

addLine(yPos);
yPos += 8;

// Notas adicionais
addText('OBSERVAÇÕES IMPORTANTES', margin, yPos, { size: 11, bold: true, color: primaryColor });
yPos += 7;

const notes = [
  '- O sistema esta pronto para liberacao apos conclusao da semana 2',
  '- Ajustes pos-liberacao serao realizados conforme solicitacoes',
  '- Suporte tecnico continuo durante o primeiro mes',
  '- Documentacao completa sera entregue com o acesso ao Drive',
  '- Testes sao recomendados antes de colocar em producao',
  '- Acesso ao codigo-fonte sob contrato de nao-divulgacao'
];

notes.forEach(note => {
  addText(note, margin + 3, yPos, { size: 8 });
  yPos += 5;
});

yPos += 8;

// Footer
addLine(yPos);
yPos += 8;

doc.setFontSize(9);
doc.setTextColor(...secondaryColor);
doc.text('Desenvolvido por NexosDigital | Soluções Digitais Profissionais', pageWidth / 2, yPos, { align: 'center' });
yPos += 5;
doc.text(`Documento gerado em ${hoje}`, pageWidth / 2, yPos, { align: 'center' });

// Salvar PDF
const outputPath = path.join(process.cwd(), 'Nota_de_Servico_ClubeDoVidro.pdf');
doc.save(outputPath);

console.log(`✓ PDF criado com sucesso: ${outputPath}`);
