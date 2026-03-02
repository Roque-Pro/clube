import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface VehicleValidationModalProps {
  isOpen: boolean;
  isNational: boolean;
  vehicleInfo: {
    brand: string;
    model: string;
    year: string;
  };
  onClose: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
}

export const VehicleValidationModal = ({
  isOpen,
  isNational,
  vehicleInfo,
  onClose,
  onConfirm,
  isLoading = false,
}: VehicleValidationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card p-8 max-w-sm w-full"
          >
            {isNational ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                </div>

                <h2 className="text-lg font-bold text-foreground text-center mb-2">
                  Veículo Aprovado
                </h2>

                <p className="text-sm text-muted-foreground text-center mb-4">
                  {vehicleInfo.brand} {vehicleInfo.model}
                  {vehicleInfo.year !== "desconhecido" && ` (${vehicleInfo.year})`}
                </p>

                <p className="text-sm text-muted-foreground text-center mb-6">
                  Este é um veículo <strong className="text-success">nacional</strong> e você está elegível para criar sua conta e aderir ao Clube do Vidro.
                </p>

                <Button onClick={onConfirm || onClose} className="w-full">
                  Continuar
                </Button>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                </div>

                <h2 className="text-lg font-bold text-foreground text-center mb-2">
                  Veículo Não Elegível
                </h2>

                <p className="text-sm text-muted-foreground text-center mb-4">
                  {vehicleInfo.brand} {vehicleInfo.model}
                  {vehicleInfo.year !== "desconhecido" && ` (${vehicleInfo.year})`}
                </p>

                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground mb-1">
                        Apenas proprietários de veículos nacionais podem aderir ao Clube do Vidro
                      </p>
                      <p>
                        O veículo informado é <strong>importado</strong> e não está elegível para o plano.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={onClose} variant="outline" className="w-full">
                  Voltar
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
