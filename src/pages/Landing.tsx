import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Shield,
    Zap,
    TrendingUp,
    Users,
    Check,
    ArrowRight,
    Sparkles,
    Calendar,
    Clock,
    Hammer,
    DollarSign,
    AlertCircle,
    ChevronDown,
    Heart,
    Award,
    MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Landing = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setSubmitted(true);
            setTimeout(() => {
                navigate("/plan-auth", { state: { email } });
            }, 1500);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" },
        },
    };

    // Calculate annual pricing
    const monthlyPrice = 19.9;
    const annualPrice = 239.00;
    const annualPriceSavings = (monthlyPrice * 0.15 * 12).toFixed(2); // Simulating ~15% savings

    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-white to-blue-50 overflow-hidden">
        {/* Animated background elements */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl opacity-40 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl opacity-40 animate-pulse" />
          <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl opacity-30" />
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-blue-200/30 bg-white/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/50"
                          >
                            <Shield className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-display font-bold text-gray-900">
                                Clube do Vidro
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600">
                                Iguaçu Auto Vidros
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                            onClick={() => {
                                const element = document.getElementById("faq");
                                element?.scrollIntoView({ behavior: "smooth" });
                            }}
                            variant="ghost"
                            size="sm"
                            className="hidden sm:inline-flex text-gray-700 hover:text-blue-600"
                        >
                            FAQ
                        </Button>
                        <Button
                            onClick={() => navigate("/ajuda")}
                            variant="ghost"
                            size="sm"
                            className="text-gray-700 hover:text-blue-600"
                        >
                            Ajuda
                        </Button>
                        <Button
                            onClick={() => navigate("/auth")}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 text-white hover:border-blue-400 hover:text-white"
                        >
                            <span className="hidden sm:inline">Acesso</span>
                            <span className="sm:hidden">Login</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-12 lg:pt-24 lg:pb-20">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-4xl mx-auto"
                >


                    {/* Main Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black text-gray-900 mb-6 leading-tight"
                    >
                        Vidros{" "}
                        <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                            Perfeitos
                        </span>
                        <br />
                        <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">
                            Carro Protegido
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
                    >
                        Seu carro merece cuidado. Nós oferecemos a tranquilidade que você procura com
                        <strong className="text-blue-600"> 3 trocas anuais, agendamento fácil e suporte 24/7.</strong>
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
                    >
                        <Button
                          onClick={() => navigate("/plan-auth")}
                          size="lg"
                          className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all gap-2 w-full sm:w-auto"
                        >
                          Assinar Agora <ArrowRight className="w-5 h-5" />
                        </Button>
                        <Button
                          onClick={() => {
                            const element = document.getElementById("benefits");
                            element?.scrollIntoView({ behavior: "smooth" });
                          }}
                          size="lg"
                          variant="outline"
                          className="border-2 border-gray-300 hover:border-blue-500 text-white hover:text-blue-600 font-bold text-lg px-8 py-6 rounded-xl w-full sm:w-auto"
                        >
                          <Zap className="w-5 h-5" />
                          Ver Benefícios
                        </Button>
                    </motion.div>

                    {/* Pricing Highlight */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, duration: 0.8 }}
                      className="bg-white border-2 border-blue-200 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-xl"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="text-center sm:border-r sm:border-gray-200 pb-4 sm:pb-0">
                                <p className="text-gray-600 text-sm mb-2">Plano Anual</p>
                                <p className="text-4xl sm:text-5xl font-display font-black text-blue-600">
                                    R$ {annualPrice.toFixed(2)}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                                    Renovação automática
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-600 text-sm mb-2">Incluso</p>
                                <div className="flex items-center justify-center gap-2">
                                    <Shield className="w-5 h-5 text-green-500" />
                                    <p className="text-2xl sm:text-3xl font-display font-bold text-green-600">
                                        3
                                    </p>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                                    Trocas anuais
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mt-12"
                    >
                      <ChevronDown className="w-6 h-6 text-blue-600 mx-auto" />
                    </motion.div>
                </motion.div>

                {/* Hero Image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 1 }}
                    className="mt-12 w-full max-w-2xl"
                >
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                        <img
                            src="/src/img/iguacu_vidros.PNG"
                            alt="Iguaçu Auto Vidros - Filial"
                            className="w-full h-auto object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1, duration: 0.6 }}
                            className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md rounded-xl p-4 flex items-center gap-3 shadow-xl"
                        >
                            <Check className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="text-sm font-bold text-gray-900">
                                    Profissionais Certificados
                                </p>
                                <p className="text-xs text-gray-600">
                                    15+ anos de experiência
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Problem Section - Why You Need Us */}
            <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
                    >
                        {/* Left side - Text */}
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-gray-900 mb-6">
                                    Por que seu carro precisa de um plano?
                                </h2>
                                <p className="text-lg sm:text-xl text-gray-600 mb-6 leading-relaxed">
                                    Vidros trincados comprometem sua segurança na estrada. Uma simples
                                    <strong> pedra no asfalto pode custar caro.</strong>
                                </p>
                                <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                                    Por isso criamos o Clube do Vidro: para que você dirija com
                                    <strong> segurança e tranquilidade,</strong> sem se preocupar com
                                    custos inesperados.
                                </p>

                                {/* Benefits List */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                                            <Check className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Sem Surpresas</p>
                                            <p className="text-gray-600">
                                                Custo fixo e previsível. Sem taxa de adesão ou multa de
                                                cancelamento.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                                            <Check className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Agendamento Rápido</p>
                                            <p className="text-gray-600">
                                                5 minutos no app. Assistência em até 2 horas em emergências.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                                            <Check className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Qualidade Garantida</p>
                                            <p className="text-gray-600">
                                                Vidros originais. Garantia de 12 meses em cada serviço.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right side - Stats Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-3xl p-8 sm:p-12 shadow-xl"
                        >
                            <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-8">
                                Dados que Falam
                            </h3>

                            <div className="space-y-8">
                                <div className="border-l-4 border-blue-600 pl-6">
                                    <p className="text-5xl sm:text-6xl font-display font-black text-blue-600 mb-2">
                                        27%
                                    </p>
                                    <p className="text-gray-700 text-lg font-semibold">
                                        dos acidentes no Brasil são causados por problemas nos vidros
                                    </p>
                                </div>

                                <div className="border-l-4 border-blue-500 pl-6">
                                    <p className="text-5xl sm:text-6xl font-display font-black text-blue-600 mb-2">
                                        R$ 800+
                                    </p>
                                    <p className="text-gray-700 text-lg font-semibold">
                                        custa uma troca de vidro de qualidade no mercado
                                    </p>
                                </div>

                                <div className="border-l-4 border-green-500 pl-6">
                                    <p className="text-5xl sm:text-6xl font-display font-black text-green-600 mb-2">
                                        2x
                                    </p>
                                    <p className="text-gray-700 text-lg font-semibold">
                                        em média, quanto um carro sofre com vidros por ano
                                    </p>
                                </div>
                            </div>

                            {/* Savings highlight */}
                            <div className="mt-8 bg-white rounded-2xl p-6 border-2 border-blue-300">
                                <p className="text-sm text-gray-600 mb-2">Com nosso plano, você economiza:</p>
                                <p className="text-3xl sm:text-4xl font-display font-black text-blue-600">
                                    R$ {(annualPrice).toFixed(2)}/ano
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    Em comparação a pagar por troca no mercado
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Benefits Section */}
            <section
                id="benefits"
                className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white"
            >
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 sm:mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-gray-900 mb-4 sm:mb-6">
                            Por que escolher o <span className="text-blue-600">Clube do Vidro</span>?
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                            Benefícios práticos que transformam a experiência de cuidar do seu carro
                        </p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                    >
                        {[
                            {
                                icon: DollarSign,
                                title: "Economia Garantida",
                                description:
                                    "No mercado custa R$ 800+ por vidro. Aqui você paga R$ 239 por ano, com 3 trocas.",
                                color: "from-blue-500 to-blue-600",
                                light: "bg-blue-50",
                            },
                            {
                                icon: Clock,
                                title: "Agendamento Fácil",
                                description:
                                    "5 minutos no app. Escolha data, horário e local. Assistência em até 2 horas.",
                                color: "from-blue-500 to-blue-600",
                                light: "bg-blue-50",
                            },
                            {
                                icon: Shield,
                                title: "Qualidade Comprovada",
                                description:
                                    "Apenas vidros originais. Parcerias certificadas. Garantia de 12 meses.",
                                color: "from-green-500 to-green-600",
                                light: "bg-green-50",
                            },
                            {
                                icon: Calendar,
                                title: "3 Trocas Anuais",
                                description:
                                    "Renova todo 1º de janeiro. Use quando precisar: vidro dianteiro, traseiro ou lateral.",
                                color: "from-purple-500 to-purple-600",
                                light: "bg-purple-50",
                            },
                            {
                                icon: Users,
                                title: "Comunidade Confiável",
                                description:
                                    "Milhares de proprietários já confiam em nós. Acesso a dicas exclusivas.",
                                color: "from-pink-500 to-pink-600",
                                light: "bg-pink-50",
                            },
                            {
                                icon: Award,
                                title: "Suporte 24/7",
                                description:
                                    "Sempre disponível. Emergência na estrada? Nós atendemos. Sem demora.",
                                color: "from-amber-500 to-amber-600",
                                light: "bg-amber-50",
                            },
                        ].map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    whileHover={{ y: -5 }}
                                    className={`${feature.light} border-2 border-gray-200 hover:border-blue-300 rounded-2xl p-6 sm:p-8 transition-all duration-300 cursor-pointer group`}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                                    >
                                        <Icon className="w-7 h-7 text-white" />
                                    </motion.div>
                                    <h3 className="text-xl sm:text-2xl font-display font-bold text-gray-900 mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* Plan Details Section */}
            <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 sm:mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-gray-900 mb-4">
                            O Que está Incluído
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-600">
                            Um plano completo para sua tranquilidade
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Left - Plan Features */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="space-y-4"
                        >
                            {[
                                {
                                    title: "3 Trocas de Vidro por Ano",
                                    description:
                                        "Use quando precisar. Vidro dianteiro, traseiro, lateral. Sem restrições.",
                                },
                                {
                                    title: "Vidros 100% Originais",
                                    description:
                                        "Todos os vidros são originais com garantia de 12 meses contra defeitos.",
                                },
                                {
                                    title: "Agendamento Rápido",
                                    description:
                                        "Agende pelo app em 5 minutos. Disponibilidade em 24-48 horas.",
                                },
                                {
                                    title: "Assistência 24/7",
                                    description:
                                        "Emergência na estrada? Atendemos em até 2 horas para a maioria dos locais.",
                                },
                                {
                                    title: "Renovação Automática",
                                    description:
                                        "Todo 1º de janeiro suas 3 trocas se renovam automaticamente.",
                                },
                                {
                                    title: "Sem Carência",
                                    description:
                                        "Use seus serviços desde o primeiro mês. Sem espera.",
                                },
                                {
                                    title: "Ambiente do Cliente",
                                    description:
                                        "Acompanhe seu plano em nosso app. Histórico de trocas. Próximas datas.",
                                },
                                {
                                    title: "Suporte Especializado",
                                    description:
                                        "Dúvidas? Fale com nosso time. Email, telefone ou chat no app.",
                                },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.6 }}
                                    viewport={{ once: true }}
                                    className="flex gap-4 items-start p-4 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                                        <Check className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{item.title}</p>
                                        <p className="text-gray-600 text-sm">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Right - Pricing & CTA */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="flex flex-col"
                        >
                            <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-3 border-blue-300 rounded-3xl p-8 sm:p-12 shadow-2xl h-full flex flex-col justify-between">
                                <div>
                                    <h3 className="text-3xl sm:text-4xl font-display font-black text-gray-900 mb-2">
                                        Seu Plano Anual
                                    </h3>
                                    <p className="text-gray-600 text-lg mb-8">
                                        Investimento pequeno. Tranquilidade grande.
                                    </p>

                                    <div className="bg-white rounded-2xl p-6 mb-8 border-2 border-blue-200">
                                        <p className="text-gray-600 text-sm mb-2">Valor Total (Renovação Automática)</p>
                                        <p className="text-5xl sm:text-6xl font-display font-black text-blue-600 mb-2">
                                            R$ {annualPrice.toFixed(2)}
                                        </p>
                                        <p className="text-gray-600 text-base">
                                            Apenas
                                            <strong className="text-blue-600 ml-1">
                                                R$ {monthlyPrice.toFixed(2)}/mês
                                            </strong>
                                        </p>
                                    </div>

                                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-8">
                                        <p className="text-sm text-gray-700">
                                            <strong className="text-yellow-700">💡 Dica:</strong> Assine agora e
                                            economize em comparação a tratar vidros quebrados. Normalmente custa
                                            R$ 800+ por troca.
                                        </p>
                                    </div>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <span>3 trocas incluídas por ano</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <span>Sem taxa de adesão</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <span>Sem multa para cancelar</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <span>Cancelamento a qualquer momento</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => navigate("/plan-auth")}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
                                >
                                    Assinar Plano Anual <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section
                id="faq"
                className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50"
            >
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 sm:mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-gray-900 mb-4">
                            Dúvidas Frequentes
                        </h2>
                        <p className="text-lg text-gray-600">
                            Respostas rápidas para suas perguntas
                        </p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        {[
                            {
                                question: "Como funciona o agendamento?",
                                answer:
                                    "Você agenda pelo nosso app em 5 minutos. Escolhe data, horário e local de preferência. Em emergências, atendemos em até 2 horas. Para agendamentos normais, temos slots em 24-48 horas.",
                            },
                            {
                                question: "Posso usar as 3 trocas para qualquer tipo de vidro?",
                                answer:
                                    "Sim! Você pode usar para vidro dianteiro, traseiro, lateral ou qualquer combinação. O importante é manter seu carro seguro.",
                            },
                            {
                                question: "O que acontece se não usar as 3 trocas no ano?",
                                answer:
                                    "As trocas se renovam todo 1º de janeiro. Se sobrar, elas expiram. Mas com nosso serviço, você usa com tranquilidade.",
                            },
                            {
                                question: "Quanto tempo dura a instalação?",
                                answer:
                                    "Normalmente entre 30 minutos a 2 horas, dependendo do tipo de vidro. Nossos profissionais trabalham com agilidade e precisão.",
                            },
                            {
                                question: "Os vidros têm garantia?",
                                answer:
                                    "Todos os vidros instalados têm garantia de 12 meses contra defeitos de fabricação e instalação. Sua segurança é nossa prioridade.",
                            },
                            {
                                question: "Posso cancelar quando quiser?",
                                answer:
                                    "Sim, totalmente. Sem multa, sem taxa de cancelamento. Basta avisar e sua assinatura para no mês seguinte.",
                            },
                            {
                                question: "Preciso descer do carro para o serviço?",
                                answer:
                                    "Você escolhe. Pode agendar em casa e nós vamos até você, ou ir a uma de nossas filiais. Você no controle.",
                            },
                            {
                                question: "Como funciona a renovação automática?",
                                answer:
                                    "No dia de renovação (1º de janeiro), a cobrança é automática no método de pagamento registrado. Suas 3 trocas se renovam e você continua protegido.",
                            },
                        ].map((faq, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className="bg-white border-2 border-gray-200 hover:border-blue-300 rounded-xl p-6 sm:p-8 transition-all"
                            >
                                <h3 className="text-lg sm:text-xl font-display font-bold text-gray-900 mb-3">
                                    {faq.question}
                                </h3>
                                <p className="text-gray-600 text-base leading-relaxed">
                                    {faq.answer}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Additional Help */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="mt-12 sm:mt-16 bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 sm:p-10 text-center"
                    >
                        <Heart className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3">
                            Não encontrou sua resposta?
                        </h3>
                        <p className="text-gray-600 text-lg mb-6">
                            Nosso time está pronto para ajudar. Entre em contato!
                        </p>
                        <Button
                            onClick={() => navigate("/ajuda")}
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                            Entrar em Contato <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 opacity-95" />

                    <div className="relative z-10 p-8 sm:p-12 md:p-16 text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: -20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-white mb-4 sm:mb-6"
                        >
                            Proteja Seu Carro Hoje
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-xl sm:text-2xl text-white/95 mb-6 sm:mb-8"
                        >
                            Por apenas <strong>R$ {monthlyPrice.toFixed(2)}/mês</strong> (R${" "}
                            {annualPrice.toFixed(2)}/ano), tenha 3 trocas de vidro + suporte 24/7
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-lg sm:text-xl text-white/90 mb-8 sm:mb-10"
                        >
                            ✨ Sem taxa de adesão • Cancelamento sem multa • Começe hoje
                        </motion.p>

                        <motion.form
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            viewport={{ once: true }}
                            onSubmit={handleSubscribe}
                            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8"
                        >
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-white/20 border-white/30 text-white placeholder:text-white/70 text-base"
                                required
                            />
                            <Button
                                type="submit"
                                size="lg"
                                className="bg-white text-blue-600 hover:bg-white/90 font-bold whitespace-nowrap"
                            >
                                {submitted ? "Redirecionando..." : "Assinar Agora"}
                            </Button>
                        </motion.form>

                        {submitted && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-white/80"
                            >
                                Bem-vindo! Você será redirecionado em instantes...
                            </motion.p>
                        )}

                        <p className="text-xs sm:text-sm text-white/70 mt-6">
                            ✓ Cadastro rápido • ✓ Aprovação instantânea • ✓ Comece hoje mesmo
                        </p>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="relative border-t-2 border-gray-200 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
                        {/* Brand */}
                        <div>
                            <h3 className="font-display font-bold text-gray-900 mb-4 text-lg">
                                Clube do Vidro
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Plano de manutenção pela Iguaçu Auto Vidros. Proteção e tranquilidade para seu
                                carro, mês a mês.
                            </p>
                        </div>

                        {/* Product */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4 text-base">Produto</h4>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li>
                                    <a href="#" className="hover:text-blue-600 transition font-medium">
                                        Plano Completo
                                    </a>
                                </li>
                                <li>
                                    <a href="#benefits" className="hover:text-blue-600 transition font-medium">
                                        Benefícios
                                    </a>
                                </li>
                                <li>
                                    <a href="#faq" className="hover:text-blue-600 transition font-medium">
                                        FAQ
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4 text-base">Legal</h4>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li>
                                    <a href="#" className="hover:text-blue-600 transition font-medium">
                                        Termos de Uso
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-blue-600 transition font-medium">
                                        Privacidade
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-blue-600 transition font-medium">
                                        Contato
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4 text-base">Suporte</h4>
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <a
                                        href="mailto:contato@clubedovidro.com"
                                        className="text-gray-600 hover:text-blue-600 transition font-medium"
                                    >
                                        contato@clubedovidro.com
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="tel:1133334444"
                                        className="text-gray-600 hover:text-blue-600 transition font-medium"
                                    >
                                        (11) 3333-4444
                                    </a>
                                </li>
                                <li className="text-gray-600">
                                    Seg-Sex • 8h às 20h
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="border-t border-gray-200 pt-8 sm:pt-12">
                        <p className="text-center text-sm text-gray-600 mb-2">
                            © 2024 Clube do Vidro • Plano de Manutenção da Iguaçu Auto Vidros. Todos os direitos
                            reservados.
                        </p>
                        <p className="text-center text-xs text-gray-500">
                            Desenvolvido com ❤️ para cuidadores de carros • Segurança e tranquilidade em primeiro
                            lugar
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
