import { useState, useRef } from "react";
import { Upload, File, AlertCircle, CheckCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBulkVehicleUpload } from "@/hooks/useBulkVehicleUpload";

interface BulkVehicleUploadProps {
  clientId: string;
  onSuccess: () => void;
  isEnabled: boolean;
}

export const BulkVehicleUpload = ({ clientId, onSuccess, isEnabled }: BulkVehicleUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadVehicles, uploading } = useBulkVehicleUpload();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");

  if (!isEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-8 rounded-2xl border border-amber-500/30 bg-amber-50/5 dark:bg-amber-950/10"
      >
        <div className="flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              Upload em Massa
            </h3>
            <p className="text-sm text-muted-foreground">
              Esta funcionalidade não está habilitada para sua conta. Entre em contato com o administrador do sistema.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie um arquivo CSV",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    setUploadStatus("idle");
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const count = await uploadVehicles(clientId, selectedFile);
      setUploadStatus("success");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Sucesso!",
        description: `${count} veículo(s) importado(s) com sucesso`,
      });
      onSuccess();
    } catch (error: any) {
      setUploadStatus("error");
      toast({
        title: "Erro ao fazer upload",
        description: error.message || "Ocorreu um erro ao processar o arquivo",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-8 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload em Massa
        </h3>
      </div>

      <div className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            dragOver
              ? "border-primary bg-primary/5"
              : selectedFile
                ? "border-success bg-success/5"
                : "border-border bg-muted/30 hover:border-primary/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <File className="w-5 h-5 text-success" />
              <div className="text-left">
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">Arraste um arquivo CSV aqui</p>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique para selecionar manualmente
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar arquivo
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-xs font-semibold text-foreground mb-2">Formato esperado:</p>
          <pre className="text-xs text-muted-foreground bg-background p-2 rounded border border-border overflow-x-auto">
{`vehicle,plate
Honda Civic 2022,ABC-1D23
Toyota Corolla 2020,XYZ-9W87`}
          </pre>
        </div>

        {/* Status Messages */}
        {uploadStatus === "success" && (
          <div className="flex items-start gap-3 p-3 bg-success/10 border border-success/30 rounded-lg">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <p className="text-sm text-success">Veículos importados com sucesso!</p>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">Erro ao importar veículos. Verifique o arquivo e tente novamente.</p>
          </div>
        )}

        {/* Action Buttons */}
        {selectedFile && (
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 gradient-primary text-primary-foreground font-semibold"
            >
              {uploading ? "Enviando..." : "Enviar Veículos"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={uploading}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
