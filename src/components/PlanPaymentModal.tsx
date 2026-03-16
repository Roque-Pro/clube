import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    X,
    DollarSign,
    Zap,
    Clock,
    Shield,
    AlertCircle,
    Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PlanPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPaymentClick: () => void;
    isLoading?: boolean;
    clientName?: string;
}

const PlanPaymentModal = ({
    isOpen,
    onClose,
    onPaymentClick,
    isLoading = false,
    clientName,
}: PlanPaymentModalProps) => {
    const planPrice = 239;
    const monthlyPrice = 19.9;

    const benefits = [
        {
            icon: Zap,
            title: "3 Trocas Anuais",
            description: "Grátis: vidros, faróis, janelas e componentes",
        },
        {
            icon: Clock,
            title: "Suporte 24/7",
            description: "Assistência dedicada em emergências",
        },
        {
            icon: Shield,
            title: "100% INMETRO",
            description: "Vidros homologados com garantia completa",
        },
        {
            icon: Check,
            title: "Sem Carência",
            description: "Use já no primeiro mês após ativação",
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-center">
                        Ativar Plano Clube do Vidro
                    </DialogTitle>
                </DialogHeader>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Price Section */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-2xl p-6 border border-primary/20">
                        <div className="text-center mb-4">
                            <p className="text-sm font-semibold text-muted-foreground mb-2">
                                PLANO ANUAL
                            </p>
                            <div className="flex items-baseline justify-center gap-1 mb-2">
                                <span className="text-4xl font-display font-black text-primary">
                                    R$ {planPrice}
                                </span>
                                <span className="text-lg text-muted-foreground">/ano</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Apenas <strong className="text-primary">R$ {monthlyPrice}/mês</strong>
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 mt-4">
                            <p className="text-xs text-muted-foreground text-center">
                                Renovação automática ao final do período
                            </p>
                        </div>
                    </div>

                    {/* Benefits Grid */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-foreground">
                            O que está incluído:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {benefits.map((benefit, index) => {
                                const Icon = benefit.icon;
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex gap-3 p-3 rounded-lg bg-muted/50"
                                    >
                                        <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {benefit.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground leading-tight">
                                                {benefit.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Info Alert */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900 dark:text-blue-200">
                            <p className="font-semibold mb-1">Próximo passo:</p>
                            <p>
                                Você será redirecionado para completar o pagamento com segurança
                                via Stripe.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={onPaymentClick}
                            disabled={isLoading}
                            className="w-full gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-6"
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <DollarSign className="w-5 h-5" />
                                    Pagar com Stripe
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={onClose}
                            disabled={isLoading}
                            variant="outline"
                            className="w-full"
                        >
                            Cancelar
                        </Button>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center justify-center gap-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield className="w-4 h-4" />
                            <span>Pagamento Seguro</span>
                        </div>
                        <div className="w-px h-4 bg-border"></div>
                        <div className="text-xs text-muted-foreground">
                            ✓ Cancelamento a qualquer momento
                        </div>
                    </div>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
};

export default PlanPaymentModal;
