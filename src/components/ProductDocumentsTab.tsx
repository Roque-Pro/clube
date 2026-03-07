import { useState, useEffect } from "react";
import { Upload, Download, Trash2, File, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProductDocument {
    id: string;
    product_id: string;
    file_name: string;
    file_url: string;
    file_size: number;
    uploaded_at: string;
}

interface ProductDocumentsTabProps {
    productId: string;
    productName: string;
}

export const ProductDocumentsTab = ({ productId, productName }: ProductDocumentsTabProps) => {
    const [documents, setDocuments] = useState<ProductDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { toast } = useToast();

    // Carregar documentos do produto
    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("product_documents")
                .select("*")
                .eq("product_id", productId)
                .order("uploaded_at", { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error: any) {
            console.error("Erro ao carregar documentos:", error);
            toast({
                title: "Erro ao carregar documentos",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [productId]);

    // Handle upload de arquivo
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validação de tamanho (50MB máximo)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo não pode ultrapassar 50MB",
          variant: "destructive",
        });
        return;
      }

      try {
        setUploading(true);
        
        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 9);
        const fileExt = file.name.split(".").pop() || "file";
        const fileName = `${productId}_${timestamp}_${randomId}.${fileExt}`;

        // Upload para Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from("product-documents")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw uploadError;
        }

        // Obter URL público do arquivo
        const { data: publicData } = supabase.storage
          .from("product-documents")
          .getPublicUrl(fileName);

        const fileUrl = publicData.publicUrl;

        // Registrar documento no banco de dados
        const { data: insertedData, error: dbError } = await supabase
          .from("product_documents")
          .insert([
            {
              product_id: productId,
              file_name: file.name,
              file_url: fileUrl,
              file_size: file.size,
            },
          ])
          .select();

        if (dbError) {
          console.error("Database insert error:", dbError);
          throw dbError;
        }

        toast({
          title: "Arquivo enviado com sucesso",
          description: `${file.name} foi anexado ao produto`,
        });

        // Atualizar lista de documentos
        await fetchDocuments();

        // Limpar input
        event.target.value = "";
      } catch (error: any) {
        console.error("Erro ao fazer upload:", error);
        toast({
          title: "Erro ao fazer upload",
          description: error.message || "Verifique as permissões RLS e do bucket",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    };

    // Delete documento
    const handleDeleteDocument = async (document: ProductDocument) => {
      try {
        setDeletingId(document.id);

        // Extrair caminho do arquivo da URL
        // Suporte tanto para URL pública quanto privada
        let filePath = "";
        if (document.file_url.includes("/storage/v1/object/public/product-documents/")) {
          filePath = document.file_url.split("/storage/v1/object/public/product-documents/")[1];
        } else if (document.file_url.includes("/object/public/product-documents/")) {
          filePath = document.file_url.split("/object/public/product-documents/")[1];
        }

        if (filePath) {
          // Deletar do Storage
          const { error: storageError } = await supabase.storage
            .from("product-documents")
            .remove([filePath]);

          if (storageError) {
            console.warn("Storage delete warning:", storageError);
            // Continuar mesmo se falhar no storage, deletar do banco
          }
        }

            // Deletar registro do banco de dados
            const { error: dbError } = await supabase
                .from("product_documents")
                .delete()
                .eq("id", document.id);

            if (dbError) throw dbError;

            toast({
                title: "Arquivo removido",
                description: `${document.file_name} foi deletado com sucesso`,
            });

            // Atualizar lista
            setDocuments(documents.filter((d) => d.id !== document.id));
        } catch (error: any) {
            console.error("Erro ao deletar documento:", error);
            toast({
                title: "Erro ao remover arquivo",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setDeletingId(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split(".").pop()?.toLowerCase();
        return ext ? ext.toUpperCase() : "FILE";
    };

    return (
        <div className="space-y-6">
            {/* Seção de Upload */}
            <div className="glass-card p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Anexar Documentos</h3>

                <div className="border-2 border-dashed border-border rounded-lg p-8">
                    <div className="flex flex-col items-center gap-3">
                        {uploading ? (
                            <>
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">Enviando arquivo...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-primary" />
                                <p className="text-sm text-muted-foreground">
                                    Clique para selecionar ou arraste um arquivo
                                </p>
                                <p className="text-xs text-muted-foreground">Máximo 50MB</p>

                                <label className="mt-2">
                                    <Input
                                        type="file"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                    <Button
                                        asChild
                                        className="cursor-pointer gradient-primary text-primary-foreground font-semibold gap-2"
                                    >
                                        <span>
                                            <Upload className="w-4 h-4" />
                                            Selecionar Arquivo
                                        </span>
                                    </Button>
                                </label>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Lista de Documentos */}
            <div className="glass-card p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    Documentos Anexados ({documents.length})
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="py-8 text-center">
                        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors border border-border/50"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                                        <File className="w-5 h-5 text-primary" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground text-sm truncate">
                                            {doc.file_name}
                                        </p>
                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                            <span>{formatFileSize(doc.file_size)}</span>
                                            <span>•</span>
                                            <span>{formatDate(doc.uploaded_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 flex-shrink-0 ml-3">
                                    <a
                                        href={doc.file_url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-primary/30 text-primary hover:bg-primary/10"
                                        >
                                            <Download className="w-3 h-3" />
                                        </Button>
                                    </a>

                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={deletingId === doc.id}
                                        onClick={() => handleDeleteDocument(doc)}
                                    >
                                        {deletingId === doc.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3 h-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
