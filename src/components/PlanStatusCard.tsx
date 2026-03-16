import { motion } from "framer-motion";
import { Shield, Check, AlertCircle, DollarSign, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanStatusCardProps {
    planStatus: "free" | "active" | "expired";
    planPaidAt?: string;
    planEnd?: string;
    onPaymentClick: () => void;
    onRenewClick?: () => void;
}

const PlanStatusCard = ({
    planStatus,
    planPaidAt,
    planEnd,
    onPaymentClick,
    onRenewClick,
}: PlanStatusCardProps) => {
    const getStatusDisplay = () => {
        switch (planStatus) {
            case "active":
                return {
                    title: "Plano Ativo ✓",
                    description: "Seu plano está ativo e válido",
                    icon: Check,
                    color: "from-green-500 to-emerald-600",
                    bgColor: "bg-green-50 dark:bg-green-950/20",
                    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
                };
            case "expired":
                return {
                    title: "Plano Expirado",
                    description: "Seu plano expirou em " + new Date(planEnd || "").toLocaleDateString("pt-BR"),
                    icon: AlertCircle,
                    color: "from-orange-500 to-red-600",
                    bgColor: "bg-orange-50 dark:bg-orange-950/20",
                    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
                };
            case "free":
            default:
                return {
                    title: "Sem Plano Ativo",
                    description: "Ative seu plano para obter 3 trocas gratuitas",
                    icon: Zap,
                    color: "from-blue-500 to-purple-600",
                    bgColor: "bg-blue-50 dark:bg-blue-950/20",
                    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
                };
        }
    };

    const status = getStatusDisplay();
    const StatusIcon = status.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 mb-8 ${status.bgColor} border-2 border-current/10`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${status.color} flex items-center justify-center flex-shrink-0`}>
                        <StatusIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-bold text-foreground mb-1">
                            {status.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {status.description}
                        </p>
                    </div>
                </div>
            </div>

            {planStatus === "active" && (
                <div className="grid grid-cols-3 gap-4 mb-6 pt-4 border-t border-current/10">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Plano Válido Até</p>
                        <p className="font-semibold text-foreground">
                            {planEnd ? new Date(planEnd).toLocaleDateString("pt-BR") : "-"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.badgeColor}`}>
                            Ativo
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Benefício</p>
                        <p className="font-semibold text-foreground flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            3 Trocas/Ano
                        </p>
                    </div>
                </div>
            )}

            {planStatus === "expired" && (
                <Button
                    onClick={onRenewClick}
                    className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold"
                >
                    <DollarSign className="w-4 h-4" />
                    Renovar Plano - R$ 239/ano
                </Button>
            )}

            {planStatus === "free" && (
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                            <Check className="w-4 h-4 text-green-600" />
                            <span>3 Trocas/Ano</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>Suporte 24/7</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4 text-purple-600" />
                            <span>100% INMETRO</span>
                        </div>
                    </div>
                    <Button
                        onClick={onPaymentClick}
                        className="w-full gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold"
                    >
                        <DollarSign className="w-4 h-4" />
                        Ativar Plano - R$ 239/ano (R$ 19,90/mês)
                    </Button>
                </div>
            )}
        </motion.div>
    );
};

export default PlanStatusCard;
