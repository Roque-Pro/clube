import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Landing = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);
    const [heroSlideIndex, setHeroSlideIndex] = useState(0);
    const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);

    useEffect(() => {
        // Abre o modal quando a página carrega
        const timer = setTimeout(() => {
            setShowAgendamentoModal(true);
        }, 500); // Pequeno delay para melhor UX
        
        return () => clearTimeout(timer);
    }, []);

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

    const slides = [
        {
            title: "Parabrisas",
            subtitle: "Reparo e Troca",
            description: "Vidros de qualidade com instalação profissional",
            icon: "🪟",
        },
        {
            title: "Vigias",
            subtitle: "Laterais e Traseiras",
            description: "Vidros laterais e traseiros com ajuste preciso",
            icon: "🚗",
        },
        {
            title: "Faróis",
            subtitle: "Troca",
            description: "Troque faróis, não fazemos reparos e restauração, fazemos somente trocas",
            icon: "💡",
        },
        {
            title: "Vidros de Janelas",
            subtitle: "Fixos e Móveis",
            description: "Toda vidraçaria automotiva em um único lugar",
            icon: "🔧",
        },
    ];

    const heroSlides = [
        {
            title: "QUEM SOMOS.",
            subtitle: "Iguaçu Auto Vidros",
            description: "Mais do que vidro automotivo, entregamos confiança e segurança para cada cliente. Somos especialistas em qualidade.",
            image: "👤",
            bgImage: "linear-gradient(135deg, rgba(31, 66, 153, 0.70) 0%, rgba(59, 130, 246, 0.70) 100%), url('https://www.canaldapeca.com.br/blog/wp-content/uploads/2018/01/bigstock-Automobile-glaziers-workers-re-63613267-1024x670.jpg')",
            bgPosition: "center",
        },
        {
            title: "CLUBE DO VIDRO",
            subtitle: "Comunidade Premium",
            description: "Junte-se à nossa comunidade exclusiva de clientes VIP. Receba benefícios especiais, descontos prioritários e atendimento personalizado.",
            image: "💎",
            bgImage: "linear-gradient(135deg, #5B4A9E 0%, #8B5FBF 50%, #6F4FA0 100%)",
        },
    ];

    const nextSlide = () => {
        setSlideIndex((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const nextHeroSlide = () => {
        setHeroSlideIndex((prev) => (prev + 1) % heroSlides.length);
    };

    const prevHeroSlide = () => {
        setHeroSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-white to-blue-50 overflow-hidden">
            {/* Animated background elements */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl opacity-40 animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl opacity-40 animate-pulse" />
                <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl opacity-30" />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-blue-200/30 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="h-12 flex items-center"
                        >
                            <img 
                                src="/img/logo.png" 
                                alt="Iguaçu Auto Vidros" 
                                className="h-12 object-contain"
                            />
                        </motion.div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-display font-bold text-gray-900">
                                Iguaçu Auto Vidros
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600">
                                Serviços Automotivos
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

            {/* Hero Section - Full Screen Carousel */}
            <section className="relative w-full min-h-screen overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={heroSlideIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0"
                    >
                        {/* Background with overlay */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: heroSlides[heroSlideIndex].bgImage,
                                backgroundSize: "cover",
                                backgroundPosition: heroSlides[heroSlideIndex].bgPosition || "center",
                            }}
                        />

                        {/* Content */}
                        <div className="relative h-full w-full flex items-center justify-center">
                            {/* Left side - Text content container */}
                            <div className="w-full h-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <motion.div
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2, duration: 0.8 }}
                                    className="space-y-4"
                                >
                                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-black text-white leading-tight">
                                        {heroSlides[heroSlideIndex].title}
                                    </h1>
                                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white/90">
                                        {heroSlides[heroSlideIndex].subtitle}
                                    </h2>
                                    <p className="text-lg sm:text-xl text-white/80 max-w-xl leading-relaxed pt-2">
                                        {heroSlides[heroSlideIndex].description}
                                    </p>

                                    {/* CTA Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                        {heroSlideIndex === 0 ? (
                                            <Button
                                                onClick={() => {
                                                    const element = document.getElementById("servicos");
                                                    element?.scrollIntoView({ behavior: "smooth" });
                                                }}
                                                size="lg"
                                                className="bg-white/20 text-white hover:bg-white/30 font-bold text-xl px-10 py-7 rounded-full backdrop-blur-sm border-2 border-white/40 w-full sm:w-auto"
                                            >
                                                <Zap className="w-5 h-5" />
                                                Ver Serviços
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => navigate("/plan-auth")}
                                                size="lg"
                                                className="bg-white text-purple-600 hover:bg-blue-50 font-bold text-xl px-10 py-7 rounded-full shadow-xl hover:shadow-2xl transition-all gap-2 w-full sm:w-auto"
                                            >
                                                Juntar-se ao Grupo <ArrowRight className="w-5 h-5" />
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Right side - Hero slide image */}
                            <motion.div
                                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="hidden lg:flex absolute right-0 bottom-0 w-1/2 h-full items-center justify-end pr-16 z-20"
                            >
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* Logo centered - large overlay */}
                                    <div className="absolute z-20 flex items-end justify-center" style={{width: '70%', left: 'calc(25% - 200px)', top: '50px', height: 'calc(100% - 50px)'}}>
                                        <img 
                                            src={heroSlideIndex === 0 ? "/img/iguacu_vidros_white.png" : "/img/clube.png"} 
                                            alt={heroSlideIndex === 0 ? "Iguaçu" : "Clube do Vidro"} 
                                            className="h-full object-contain drop-shadow-2xl"
                                            style={{filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))'}}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Navigation Controls */}
                        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8 z-20">
                            <button
                                onClick={prevHeroSlide}
                                className="p-3 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm border border-white/40 text-white"
                                aria-label="Slide anterior"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>

                            {/* Dots */}
                            <div className="flex gap-3">
                                {heroSlides.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setHeroSlideIndex(index)}
                                        className={`rounded-full transition-all backdrop-blur-sm ${
                                            index === heroSlideIndex
                                                ? "bg-white w-8 h-3"
                                                : "bg-white/40 w-3 h-3 hover:bg-white/60"
                                        }`}
                                        aria-label={`Ir para slide ${index + 1}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={nextHeroSlide}
                                className="p-3 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm border border-white/40 text-white"
                                aria-label="Próximo slide"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Slide Counter */}
                        <div className="absolute bottom-24 left-8 text-white/60 text-sm font-semibold">
                            {heroSlideIndex + 1} / {heroSlides.length}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Scroll indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-8 right-8 text-white z-20"
                >
                    <ChevronDown className="w-6 h-6" />
                </motion.div>
            </section>

            {/* Success Story Section */}
            <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                    >
                        {/* Video */}
                        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                            <iframe
                                width="100%"
                                height="400"
                                src="https://www.youtube.com/embed/PoNBRFUj-Z0"
                                title="Nossa História de Sucesso"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="rounded-2xl"
                            />
                        </div>

                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <h2 className="text-4xl sm:text-5xl font-display font-black text-gray-900">
                                Nossa História de Sucesso
                            </h2>
                            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                                Com mais de 20 anos de excelência, a Iguaçu Auto Vidros consolidou-se como referência no mercado de vidraçaria automotiva. Nossa jornada é marcada pela dedicação à qualidade, inovação constante e, principalmente, pela confiança de milhares de clientes satisfeitos.
                            </p>
                            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                                Investimos continuamente em tecnologia, treinamento de nossa equipe e na expansão de nossos serviços para sempre oferecer o melhor atendimento. Somos mais que um serviço, somos parceiros da sua segurança na estrada.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Store Locations Section */}
            <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl sm:text-5xl font-display font-black text-gray-900 mb-4">
                            Nossas Lojas
                        </h2>
                        <p className="text-lg text-gray-600">
                            Visite-nos em uma de nossas unidades
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Store 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <MapPin className="w-8 h-8 text-blue-600 mb-4" />
                            <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                                Iguaçu Som e Acessórios
                            </h3>
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                Rua Carlos Marques Rollo 1123<br />
                                Califórnia, Nova Iguaçu
                            </p>
                            <Button
                                onClick={() => window.open("https://www.google.com/maps/search/Rua+Carlos+Marques+Rollo+1123+Califórnia+Nova+Iguaçu", "_blank")}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                                <MapPin className="w-4 h-4 mr-2" />
                                Ver no Mapa
                            </Button>
                        </motion.div>

                        {/* Store 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <MapPin className="w-8 h-8 text-blue-600 mb-4" />
                            <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                                Iguaçu Auto Vidros
                            </h3>
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                Rua Oscar Soares 1226<br />
                                Califórnia, Nova Iguaçu
                            </p>
                            <Button
                                onClick={() => window.open("https://www.google.com/maps/search/Rua+Oscar+Soares+1226+Califórnia+Nova+Iguaçu", "_blank")}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                                <MapPin className="w-4 h-4 mr-2" />
                                Ver no Mapa
                            </Button>
                        </motion.div>

                        {/* Store 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <MapPin className="w-8 h-8 text-blue-600 mb-4" />
                            <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                                JJ Parabrisas
                            </h3>
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                Avenida Nilo Peçanha 1058<br />
                                Centro, Nova Iguaçu
                            </p>
                            <Button
                                onClick={() => window.open("https://www.google.com/maps/search/Avenida+Nilo+Peçanha+1058+Centro+Nova+Iguaçu", "_blank")}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                                <MapPin className="w-4 h-4 mr-2" />
                                Ver no Mapa
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Agendamento Rápido Section */}
            <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl sm:text-5xl font-display font-black text-gray-900 mb-4">
                            Agendamento Rápido e Fácil
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Agende seu serviço com conforto e segurança
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-8 sm:p-10 shadow-2xl"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="flex flex-col justify-center">
                                <h3 className="text-3xl font-display font-bold text-blue-700 mb-4">
                                    Agende Agora
                                </h3>
                                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                                    Precisa apenas de um cadastro rápido para realizar seu agendamento com conforto, segurança e profissionalismo. Nossa equipe está pronta para atender você da melhor forma possível.
                                </p>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <span className="text-gray-700">Cadastro rápido e seguro</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <span className="text-gray-700">Agendamento online facilitado</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <span className="text-gray-700">Atendimento profissional</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <span className="text-gray-700">Suporte 24/7 para você</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => navigate("/plan-auth")}
                                    size="lg"
                                    className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold w-full sm:w-auto"
                                >
                                    Agendar Agora <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>

                            <div className="flex flex-col justify-center items-center">
                                <div className="bg-white rounded-2xl p-8 shadow-lg w-full">
                                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-4">
                                        Processo Simples
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                                                <span className="font-semibold text-gray-900">Cadastre-se</span>
                                            </div>
                                            <p className="text-sm text-gray-600 ml-11">Preencha seus dados em poucos segundos</p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                                                <span className="font-semibold text-gray-900">Escolha o Serviço</span>
                                            </div>
                                            <p className="text-sm text-gray-600 ml-11">Selecione o vidro ou acessório que precisa</p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                                                <span className="font-semibold text-gray-900">Agende a Data</span>
                                            </div>
                                            <p className="text-sm text-gray-600 ml-11">Escolha o melhor dia e horário para você</p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">4</div>
                                                <span className="font-semibold text-gray-900">Receba Confirmação</span>
                                            </div>
                                            <p className="text-sm text-gray-600 ml-11">Pronto! Você receberá a confirmação</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Services Section */}
            <section id="servicos" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 sm:mb-16"
                    >
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-gray-900 mb-4">
                            Nossos Serviços
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                            Tudo que seu veículo precisa em vidraçaria automotiva, com qualidade e rapidez
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        variants={containerVariants}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {[
                            {
                                title: "Parabrisas",
                                description: "Troca de parabrisas com vidros de qualidade",
                                icon: Sparkles,
                            },
                            {
                                title: "Vigias",
                                description: "Troca de vidros laterais e traseiros com instalação profissional",
                                icon: Shield,
                            },
                            {
                                title: "Faróis",
                                description: "Troca de faróis e lanternas",
                                icon: Zap,
                            },
                            {
                                title: "Vidros Especiais",
                                description: "Troca de vidros de portas, janelas e componentes",
                                icon: Hammer,
                            },
                            {
                                title: "Som Automotivo e Acessórios",
                                description: "Som, rádios, auto-falantes, painel multimídia, insul-filme, WindowBlue, películas de alta performance e muito mais",
                                icon: Zap,
                            },
                            {
                                title: "Insumos e Auto Peças",
                                description: "Troca de insumos e peças automotivas",
                                icon: Hammer,
                            },
                        ].map((service, index) => {
                            const IconComponent = service.icon;
                            return (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    className="bg-white border-2 border-gray-200 hover:border-blue-300 rounded-xl p-6 sm:p-8 transition-all hover:shadow-lg"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                                        <IconComponent className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                                        {service.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {service.description}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 sm:mb-16"
                    >
                        <h2 className="text-4xl sm:text-5xl font-display font-black text-gray-900 mb-4">
                            Por Que Confiar em Nós
                        </h2>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        variants={containerVariants}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-8"
                    >
                        {[
                            {
                                icon: Award,
                                title: "Experiência de 20 Anos",
                                description: "Décadas de confiança e excelência em vidraçaria automotiva",
                            },
                            {
                                icon: TrendingUp,
                                title: "Qualidade Garantida",
                                description: "Vidros originais e reparos com padrão de fábrica",
                            },
                            {
                                icon: Clock,
                                title: "Atendimento Rápido",
                                description: "Serviço ágil sem comprometer a qualidade",
                            },
                            {
                                icon: Users,
                                title: "Equipe Profissional",
                                description: "Técnicos experientes e certificados no ramo",
                            },
                        ].map((feature, index) => {
                            const IconComponent = feature.icon;
                            return (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    className="flex gap-6 items-start"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                                        <IconComponent className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 sm:mb-16"
                    >
                        <h2 className="text-4xl sm:text-5xl font-display font-black text-gray-900 mb-4">
                            Perguntas Frequentes
                        </h2>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        variants={containerVariants}
                        viewport={{ once: true }}
                        className="space-y-4 sm:space-y-6"
                    >
                        {[
                            {
                                question: "Qual o tempo de atendimento?",
                                answer:
                                    "Você escolhe. Pode vir até nós ou agendar um atendimento no local do seu veículo. Geralmente concluímos em 1-2 horas.",
                            },
                            {
                                question: "Os vidros têm garantia?",
                                answer:
                                    "Sim! Todos os vidros instalados têm garantia de 12 meses contra defeitos de fabricação e instalação.",
                            },
                            {
                                question: "Qual é o valor dos serviços?",
                                answer:
                                    "Os preços variam conforme o serviço e modelo do veículo. Entre em contato para um orçamento personalizado sem compromisso.",
                            },
                            {
                                question: "Vocês atendem em domicílio?",
                                answer:
                                    "Sim, para a maioria dos serviços fazemos atendimento em domicílio. Consulte-nos sobre disponibilidade.",
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
                            Ainda tem dúvidas?
                        </h3>
                        <p className="text-gray-600 text-lg mb-6">
                            Nossa equipe está pronta para ajudar. Fale conosco!
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
                            Seu Vidro em Boas Mãos
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-xl sm:text-2xl text-white/95 mb-6 sm:mb-8"
                        >
                            Mais de 20 anos cuidando da segurança e visibilidade do seu veículo
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-lg sm:text-xl text-white/90 mb-8 sm:mb-10"
                        >
                            ✨ Qualidade garantida • Atendimento rápido • Profissionais certificados
                        </motion.p>

                        <p className="text-xs sm:text-sm text-white/70 mt-6">
                            ✓ Orçamento personalizado • ✓ Agendamento facilitado • ✓ Comece hoje
                        </p>
                    </div>
                </motion.div>
            </section>

            {/* Modal de Agendamento Rápido */}
            <AnimatePresence>
                {showAgendamentoModal && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAgendamentoModal(false)}
                            className="fixed inset-0 bg-black/50 z-40"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white relative">
                                    <button
                                        onClick={() => setShowAgendamentoModal(false)}
                                        className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <h2 className="text-2xl font-display font-bold mb-2">
                                        Agende Agora!
                                    </h2>
                                    <p className="text-white/90 text-sm">
                                        Rápido, seguro e fácil
                                    </p>
                                </div>

                                {/* Content */}
                                <div className="p-8">
                                    <p className="text-gray-700 mb-6 text-base leading-relaxed">
                                        Realize seu agendamento em poucos segundos. Precisa apenas de um cadastro rápido para agendar seu serviço com <strong>conforto, segurança e profissionalismo</strong>.
                                    </p>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="text-sm text-gray-700">Cadastro seguro e rápido</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="text-sm text-gray-700">Agendamento online facilitado</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="text-sm text-gray-700">Suporte 24/7 dedicado</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="text-sm text-gray-700">Profissionalismo garantido</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            onClick={() => {
                                                setShowAgendamentoModal(false);
                                                navigate("/plan-auth", { state: { skipPlanInfo: true } });
                                            }}
                                            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 text-base"
                                        >
                                            Agendar Agora <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                        <button
                                            onClick={() => setShowAgendamentoModal(false)}
                                            className="w-full py-3 text-gray-700 hover:text-gray-900 font-medium transition border border-gray-200 rounded-lg"
                                        >
                                            Talvez Depois
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="relative border-t-2 border-gray-200 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
                        {/* Brand */}
                        <div>
                            <h3 className="font-display font-bold text-gray-900 mb-4 text-lg">
                                Iguaçu Auto Vidros
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Especialistas em vidraçaria automotiva com mais de 20 anos de excelência e confiabilidade.
                            </p>
                        </div>

                        {/* Services */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4 text-base">Serviços</h4>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li>
                                    <a href="#servicos" className="hover:text-blue-600 transition font-medium">
                                        Parabrisas
                                    </a>
                                </li>
                                <li>
                                    <a href="#servicos" className="hover:text-blue-600 transition font-medium">
                                        Vigias
                                    </a>
                                </li>
                                <li>
                                    <a href="#servicos" className="hover:text-blue-600 transition font-medium">
                                        Faróis
                                    </a>
                                </li>
                                <li>
                                    <a href="#servicos" className="hover:text-blue-600 transition font-medium">
                                        Vidros Especiais
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Legal */}
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
                                    <a href="#faq" className="hover:text-blue-600 transition font-medium">
                                        FAQ
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-blue-600 transition font-medium">
                                        Contato
                                    </a>
                                </li>
                            </ul>
                        </div>

                    </div>

                    {/* Bottom */}
                    <div className="border-t border-gray-200 pt-8 sm:pt-12">
                        <p className="text-center text-sm text-gray-600 mb-2">
                            © 2024 Iguaçu Auto Vidros. Todos os direitos reservados.
                        </p>
                        <p className="text-center text-xs text-gray-500 mb-3">
                            Qualidade, segurança e confiabilidade há mais de 20 anos
                        </p>
                        <p className="text-center text-xs text-gray-500">
                            Desenvolvido por <a href="https://www.technexos.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold">TechNexos</a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
