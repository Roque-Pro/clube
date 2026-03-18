import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClientStatusBadgeProps {
    planStatus?: "free" | "active" | "expired";
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    clientName?: string;
    showName?: boolean;
}

const ClientStatusBadge = ({
    planStatus = "free",
    size = "md",
    showLabel = false,
    clientName,
    showName = true,
}: ClientStatusBadgeProps) => {
    const isActive = planStatus === "active";
    const isExpired = planStatus === "expired";

    const tooltipText = isActive 
        ? "Plano Ativo ✓" 
        : isExpired
        ? "Plano Expirado"
        : "Sem Plano - Pendente Pagamento";

    const statusContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-xs flex-shrink-0 ${
                isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : isExpired
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}
        >
            {isActive ? "PLANO ON" : isExpired ? "PLANO EXPIRADO" : "PLANO OFF"}
        </motion.div>
    );

    return (
        <div className="flex items-center gap-2 inline-flex">
            {clientName && showName && (
                <span className="font-semibold text-foreground truncate">{clientName}</span>
            )}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {statusContent}
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-gray-900 text-white border-0">
                        {tooltipText}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};

export default ClientStatusBadge;
