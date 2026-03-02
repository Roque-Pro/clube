import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "primary" | "accent" | "warning" | "success";
  delay?: number;
}

const variantClasses: Record<string, string> = {
  default: "border-border/50",
  primary: "border-primary/30",
  accent: "border-accent/30",
  warning: "border-warning/30",
  success: "border-success/30",
};

const iconVariants: Record<string, string> = {
  default: "bg-secondary text-secondary-foreground",
  primary: "bg-primary/15 text-primary",
  accent: "bg-accent/15 text-accent",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/15 text-success",
};

const StatCard = ({ title, value, icon: Icon, description, variant = "default", delay = 0 }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("glass-card p-6", variantClasses[variant])}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-display font-bold mt-2 text-foreground">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", iconVariants[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
