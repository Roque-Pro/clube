import { motion } from "framer-motion";
import { Sparkles, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";

interface FreeTrocasCardProps {
    replacementsUsed: number;
    maxReplacements: number;
    planStatus: "free" | "active" | "expired";
}

const FreeTrocasCard = ({
    replacementsUsed,
    maxReplacements,
    planStatus,
}: FreeTrocasCardProps) => {
    if (planStatus !== "active") {
        return null;
    }

    const remaining = maxReplacements - replacementsUsed;
    const percentage = (replacementsUsed / maxReplacements) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-8"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground">
                    Trocas Grátis Disponíveis
                </h3>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
                Você tem {remaining} {remaining === 1 ? "troca gratuita" : "trocas gratuitas"} restantes este ano
            </p>

            {/* Visual Representation */}
            <div className="space-y-3">
                {/* Progress Bar */}
                <div className="relative h-3 bg-white dark:bg-gray-800 rounded-full overflow-hidden border border-amber-200 dark:border-amber-800">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                    />
                </div>

                {/* Count Indicators */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        {Array.from({ length: maxReplacements }).map((_, index) => (
                            <motion.div
                                key={index}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                    index < replacementsUsed
                                        ? "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                                        : "bg-gradient-to-br from-amber-400 to-yellow-500 text-white"
                                }`}
                            >
                                {index < replacementsUsed ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    index + 1
                                )}
                            </motion.div>
                        ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                        {replacementsUsed}/{maxReplacements}
                    </span>
                </div>
            </div>

            {/* Status Message */}
            <div className="mt-6 pt-4 border-t border-amber-200 dark:border-amber-800">
                {remaining === 0 ? (
                    <p className="text-sm text-center text-orange-700 dark:text-orange-300 font-medium flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Você atingiu o limite de trocas gratuitas este ano
                    </p>
                ) : remaining === 1 ? (
                    <p className="text-sm text-center text-amber-700 dark:text-amber-300 font-medium flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Última troca gratuita disponível!
                    </p>
                ) : (
                    <p className="text-sm text-center text-amber-700 dark:text-amber-300 font-medium">
                        ✨ Você ainda tem trocas gratuitas disponíveis
                    </p>
                )}
            </div>
        </motion.div>
    );
};

export default FreeTrocasCard;
