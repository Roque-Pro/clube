import { useState, useEffect } from "react";
import { X, Download, MessageCircle, Printer, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  fileName: string;
}

export const ReceiptModal = ({ isOpen, onClose, pdfBlob, fileName }: ReceiptModalProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfShareUrl, setPdfShareUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfBlob]);

  const handleDownload = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const handleWhatsApp = async () => {
    if (!whatsappNumber.trim()) {
      alert("Por favor, insira um número de WhatsApp");
      return;
    }

    setUploadingPdf(true);

    try {
      // Faz download do PDF
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      // Formata o número: remove espaços, parênteses, hífens e adiciona código do país
      let phone = whatsappNumber.replace(/\D/g, "");
      
      // Se não começar com 55 (código Brasil), adiciona
      if (!phone.startsWith("55")) {
        phone = "55" + phone;
      }

      // Abre WhatsApp
      const whatsappUrl = `https://wa.me/${phone}`;
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
      }, 500);
      
      alert("✓ PDF baixado!\n\nO WhatsApp será aberto. Anexe o arquivo para enviar.");

      setWhatsappModalOpen(false);
      setWhatsappNumber("");
    } catch (err) {
      console.error("Erro:", err);
      alert("Erro ao processar. Tente novamente.");
    } finally {
      setUploadingPdf(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pr-0">
          <DialogTitle>Cupom Fiscal</DialogTitle>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-muted rounded-lg p-4 mb-4">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-lg border border-border"
              title="Cupom Fiscal"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">Carregando PDF...</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end flex-wrap">
          <Button
            variant="outline"
            onClick={onClose}
            className="gap-2"
          >
            Fechar
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            onClick={() => setWhatsappModalOpen(true)}
            className="gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
          <Button
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </Button>
        </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Modal */}
      <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enviar via WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">Número de WhatsApp *</Label>
              <Input
                id="whatsapp"
                placeholder="(45) 99999-9999"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                type="tel"
              />
              <p className="text-xs text-muted-foreground">
                Digite o número com DDD. Ex: (45) 99999-9999 ou 4599999999
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setWhatsappModalOpen(false);
                  setWhatsappNumber("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleWhatsApp}
                disabled={uploadingPdf}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {uploadingPdf ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
