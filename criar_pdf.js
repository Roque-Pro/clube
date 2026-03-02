import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

const doc = new jsPDF('p', 'mm', 'a4');
const w = doc.internal.pageSize.getWidth();
const h = doc.internal.pageSize.getHeight();
const margin = 20;

let y = 15;

// Cores
const azul = [30, 50, 140];
const laranja = [240, 120, 30];

// Helper
const txt = (text, x = margin, yy = y, size = 10, bold = false, color = [0, 0, 0], align = 'left') => {
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  if (align === 'center') {
    doc.text(text, w/2, yy, { align: 'center' });
  } else {
    doc.text(text, x, yy);
  }
};

// HEADER
doc.setFillColor(...azul);
doc.rect(0, 0, w, 25, 'F');
txt('NOTA DE SERVICO', w/2, 15, 14, true, [255, 255, 255], 'center');

y = 32;

// EMPRESA E CLIENTE
txt('PRESTADORA:', margin, y, 10, true, azul);
y += 5;
txt('NexosDigital', margin, y, 9);
y += 8;

txt('CLIENTE:', margin, y, 10, true, azul);
y += 5;
txt('Iguacu Auto Vidros / Clube do Vidro', margin, y, 9);
y += 10;

// LINHA
doc.setDrawColor(...azul);
doc.line(margin, y, w - margin, y);
y += 6;

// SEMANA 1
txt('SEMANA 1 - JA FEITO (CONCLUIDO)', margin, y, 11, true, [0, 100, 0]);
y += 6;

const s1 = [
  'Plataforma web completa',
  'Gerenciar clientes (criar, editar, listar)',
  'Agendar servicos para clientes',
  'Controlar estoque de produtos',
  'Registrar vendas',
  'Lista de funcionarios',
  'Ver historico de tudo',
  'Login com usuario e senha',
  'Interface bonita - tema claro e escuro',
  'Painel administrativo completo'
];

s1.forEach(item => {
  txt('- ' + item, margin + 5, y, 8.5);
  y += 4.5;
});

y += 2;

// SEMANA 2
txt('SEMANA 2 - AGORA (AJUSTES FINAIS)', margin, y, 11, true, [180, 100, 0]);
y += 6;

const s2 = [
  'Colocar no dominio escolhido',
  'Vendedor associado ao produto',
  'Testes completos - IMPORTANTE para implementar sugestoes',
  'Corrigir qualquer erro',
  'Deixar rapido e seguro'
];

s2.forEach(item => {
  txt('- ' + item, margin + 5, y, 8.5);
  y += 4.5;
});

y += 2;

// DEPOIS
txt('APOS LIBERAR - MONITORAMENTO', margin, y, 11, true, azul);
y += 6;

const s3 = [
  'Plataforma disponivel para os clientes',
  'Ajustar conforme solicitacoes',
  'Acompanhar funcionamento',
  'Novas melhorias'
];

s3.forEach(item => {
  txt('- ' + item, margin + 5, y, 8.5);
  y += 4.5;
});

// Nova pagina
doc.addPage();
y = 15;

// DOMINIO
txt('OPCOES DE DOMINIO', margin, y, 11, true, azul);
y += 6;
txt('Padrao: www.clubedovidro.com.br (escolha uma opcao):', margin, y, 9);
y += 6;

txt('[ ] www.clubedovidro.com.br', margin + 5, y, 9);
y += 5;
txt('[ ] www.app-clubedovidro.com.br', margin + 5, y, 9);
y += 5;
txt('[ ] www.sistema-clubedovidro.com.br', margin + 5, y, 9);
y += 5;
txt('[ ] www.plataforma-clubedovidro.com.br', margin + 5, y, 9);
y += 10;

// LINK TEMPORARIO
txt('ACESSO TEMPORARIO (Vercel)', margin, y, 11, true, azul);
y += 6;
txt('Link enquanto desenvolve (sera deletado apos liberar):', margin, y, 9);
y += 6;
txt('_____________________________________________________________________', margin + 5, y, 9);
y += 10;

// CODIGO
txt('CODIGO DO PROJETO (Drive)', margin, y, 11, true, azul);
y += 6;
txt('Link Google Drive com todo o codigo:', margin, y, 9);
y += 6;
txt('_____________________________________________________________________', margin + 5, y, 9);
y += 12;

// LINHA
doc.setDrawColor(...azul);
doc.line(margin, y, w - margin, y);
y += 8;

// PAGAMENTO
txt('PAGAMENTO - TOTAL: R$ 3.000,00', margin, y, 12, true, laranja);
y += 8;

// Tabela
const colX = [margin + 5, margin + 60, margin + 110, margin + 155];
doc.setFillColor(...azul);
doc.rect(margin, y - 5, w - 2*margin, 6, 'F');

txt('Parcela', colX[0], y, 9, true, [255, 255, 255]);
txt('Percentual', colX[1], y, 9, true, [255, 255, 255]);
txt('Valor', colX[2], y, 9, true, [255, 255, 255]);
txt('Data', colX[3], y, 9, true, [255, 255, 255]);

y += 8;

const pagamentos = [
  ['1a Parcela', '1/3', 'R$ 1.000,00', 'Semana 1 (feito)'],
  ['2a Parcela', '1/3', 'R$ 1.000,00', 'Semana 2 (inicio)'],
  ['3a Parcela', '1/3', 'R$ 1.000,00', '30 dias apos liberar']
];

pagamentos.forEach((p, i) => {
  if (i > 0) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y - 2, w - margin, y - 2);
  }
  txt(p[0], colX[0], y, 9);
  txt(p[1], colX[1], y, 9);
  txt(p[2], colX[2], y, 9);
  txt(p[3], colX[3], y, 9);
  y += 6;
});

y += 8;

// ANOTACOES
txt('IMPORTANTE', margin, y, 11, true, azul);
y += 6;

const notas = [
  'Plataforma pronta para usar na Semana 2',
  'Ajustes apos liberar conforme solicitacoes',
  'Suporte tecnico durante 3 meses',
  'Todo codigo sera entregue protegido',
  'Recomendamos testar antes com clientes reais'
];

notas.forEach(nota => {
  txt('- ' + nota, margin + 5, y, 8);
  y += 4;
});

y += 8;

// FOOTER
doc.setFontSize(8);
doc.setTextColor(100, 100, 100);
doc.text('NexosDigital - Solucoes Digitais', w/2, h - 8, { align: 'center' });

const data = new Date().toLocaleDateString('pt-BR');
doc.text('Documento gerado em ' + data, w/2, h - 4, { align: 'center' });

// SALVAR
const outputPath = path.join(process.cwd(), 'Nota_de_Servico_ClubeDoVidro.pdf');
doc.save(outputPath);

console.log('PDF criado: ' + outputPath);
