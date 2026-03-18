import { motion } from "framer-motion";
import { Check, Zap, Clock, Shield, TrendingUp, Sparkles } from "lucide-react";

interface PlanPromotionCardProps {
    planStatus: "free" | "active" | "expired";
}

const PlanPromotionCard = ({ planStatus }: PlanPromotionCardProps) => {
    // Don't show if plan is already active
    if (planStatus === "active") {
        return null;
    }

    const features = [
        { icon: Zap, text: "3 trocas de vidro/ano" },
        { icon: Clock, text: "Suporte 24/7" },
        { icon: Shield, text: "100% INMETRO" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl p-6 md:p-8 border-2 border-primary/40 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 backdrop-blur-sm"
        >
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-30 blur-xl -z-10" />

            <div className="relative z-10">
                {/* Top section */}
                <div className="mb-6">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-1">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-display font-bold text-foreground mb-1">
                                Proteção de Vidros para Seu Veículo
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Milhares de clientes já protegem seus veículos com nossa solução. Acesso a 3 trocas completas anualmente com suporte 24/7.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Features grid */}
                <div className="grid grid-cols-3 gap-3 mb-6 py-4 border-y border-border/50">
                    {features.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                                className="flex flex-col items-center text-center"
                            >
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
                                    <Icon className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-xs font-medium text-foreground leading-tight">
                                    {feature.text}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Benefits Callout */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Sem carência • Use no 1º mês</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Cancele quando quiser • 100% seguro</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Renovação automática • Sempre protegido</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PlanPromotionCard;
