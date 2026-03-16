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
    
    const sizeClasses = {
        sm: "w-2 h-2",
        md: "w-3 h-3",
        lg: "w-4 h-4",
    };

    const badgeColor = isActive 
        ? "bg-green-500 shadow-lg shadow-green-500/50" 
        : isExpired
        ? "bg-orange-500 shadow-lg shadow-orange-500/50"
        : "bg-red-500 shadow-lg shadow-red-500/50";

    const tooltipText = isActive 
        ? "Plano Ativo ✓" 
        : isExpired
        ? "Plano Expirado"
        : "Sem Plano - Pendente Pagamento";

    const statusContent = (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={`${sizeClasses[size]} rounded-full ${badgeColor} inline-block relative flex-shrink-0`}
        >
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute inset-0 rounded-full ${
                    isActive ? "bg-green-500/30" : isExpired ? "bg-orange-500/30" : "bg-red-500/30"
                }`}
            />
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
