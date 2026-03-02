import { useState, useEffect } from "react";
import { Search, Calendar, User, Database, Trash2, Plus, Edit2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuditLog {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    entity_name: string;
    details: string;
    user_email: string;
    created_at: string;
}

const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
        case "create":
            return <Plus className="w-5 h-5 text-green-500" />;
        case "update":
            return <Edit2 className="w-5 h-5 text-blue-500" />;
        case "delete":
            return <Trash2 className="w-5 h-5 text-red-500" />;
        case "register":
            return <CheckCircle className="w-5 h-5 text-purple-500" />;
        default:
            return <Database className="w-5 h-5 text-primary" />;
    }
};

const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
        case "create":
            return "bg-green-500/15 border-green-500/30";
        case "update":
            return "bg-blue-500/15 border-blue-500/30";
        case "delete":
            return "bg-red-500/15 border-red-500/30";
        case "register":
            return "bg-purple-500/15 border-purple-500/30";
        default:
            return "bg-primary/15 border-primary/30";
    }
};

const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
        create: "Criado",
        update: "Atualizado",
        delete: "Deletado",
        register: "Registrado",
    };
    return labels[action.toLowerCase()] || action;
};

// Cores por tipo de entidade
const getEntityColor = (entityType: string) => {
    const colors: { [key: string]: string } = {
        products: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800",
        estoque: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800",
        clients: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
        replacements: "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800",
        trocas: "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800",
        services: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
        employees: "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800",
        funcionarios: "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800",
        vendas: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800",
        patrimonio: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/20 dark:border-cyan-800",
    };
    return colors[entityType.toLowerCase()] || "bg-slate-50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800";
};

// Cores de ícone por tipo de entidade
const getEntityIconColor = (entityType: string) => {
    const iconColors: { [key: string]: string } = {
        products: "text-emerald-600 dark:text-emerald-400",
        estoque: "text-emerald-600 dark:text-emerald-400",
        clients: "text-blue-600 dark:text-blue-400",
        replacements: "text-violet-600 dark:text-violet-400",
        trocas: "text-violet-600 dark:text-violet-400",
        services: "text-amber-600 dark:text-amber-400",
        employees: "text-rose-600 dark:text-rose-400",
        funcionarios: "text-rose-600 dark:text-rose-400",
        vendas: "text-orange-600 dark:text-orange-400",
        patrimonio: "text-cyan-600 dark:text-cyan-400",
    };
    return iconColors[entityType.toLowerCase()] || "text-slate-600 dark:text-slate-400";
};

// Badge de tipo com cor
const getEntityBadgeColor = (entityType: string) => {
    const badgeColors: { [key: string]: string } = {
        products: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
        estoque: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
        clients: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
        replacements: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200",
        trocas: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200",
        services: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
        employees: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
        funcionarios: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
        vendas: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
        patrimonio: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200",
    };
    return badgeColors[entityType.toLowerCase()] || "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200";
};

const History = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("audit_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(500);

            if (error) throw error;
            setLogs(data || []);
        } catch (error: any) {
            console.error("Erro ao carregar histórico:", error);
            toast({
                title: "Erro ao carregar histórico",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filtered = logs.filter(
        (log) =>
            log.entity_name.toLowerCase().includes(search.toLowerCase()) ||
            log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
            log.user_email.toLowerCase().includes(search.toLowerCase()) ||
            log.details.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <PageHeader title="Histórico" description="Registro completo de todas as movimentações do sistema" />

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por entidade, tipo, usuário..."
                        className="pl-10 bg-card border-border"
                    />
                </div>
            </div>

            {loading ? (
                <p className="text-center text-muted-foreground py-12">Carregando histórico...</p>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((log, i) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className={`border rounded-lg p-4 flex items-start justify-between gap-4 backdrop-blur-sm ${getEntityColor(
                                    log.entity_type
                                )}`}
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${getEntityColor(log.entity_type)}`}>
                                        <div className={getEntityIconColor(log.entity_type)}>
                                            {getActionIcon(log.action)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <p className="font-semibold text-foreground">{log.entity_name}</p>
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getEntityBadgeColor(
                                                log.entity_type
                                            )}`}>
                                                {log.entity_type}
                                            </span>
                                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-background/60 text-foreground">
                                                {getActionLabel(log.action)}
                                            </span>
                                        </div>
                                        {log.details && (
                                            <p className="text-sm text-foreground/70 mb-2 break-words">{log.details}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                <span>{log.user_email}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    {new Date(log.created_at).toLocaleDateString("pt-BR")} às{" "}
                                                    {new Date(log.created_at).toLocaleTimeString("pt-BR")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filtered.length === 0 && (
                        <p className="text-center text-muted-foreground py-12">
                            {logs.length === 0 ? "Nenhum registro ainda." : "Nenhum resultado encontrado."}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default History;
