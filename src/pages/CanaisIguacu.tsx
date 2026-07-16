import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  MapPin, 
  Phone, 
  PlayCircle, 
  ExternalLink,
  Sun,
  Moon,
  Truck
} from "lucide-react";

const CanaisIguacu = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const links = [
    {
      title: "Clube do Vidro",
      description: "Conheça nosso clube exclusivo e benefícios",
      icon: <Globe className="w-6 h-6" />,
      url: "/",
      primary: true
    },
    {
      title: "Solicitação de Reboque!",
      description: "Solicitar guincho em horário comercial",
      icon: <Truck className="w-6 h-6" />,
      url: "https://wa.me/5521974636253",
      isEmergency: true
    },
    {
      title: "Loja 01 - Jardim Imperial - Nova Iguaçu",
      description: "Av: Carlos Marques Rollo, 1123",
      phone: "21974636253",
      icon: <MapPin className="w-6 h-6" />,
      url: "https://www.google.com/maps/search/Rua+Carlos+Marques+Rollo+1123+Califórnia+Nova+Iguaçu"
    },
    {
      title: "Loja 02 - Centro Nova Iguaçu",
      description: "Rua Oscar Soares, 1226",
      phone: "21982772904",
      icon: <MapPin className="w-6 h-6" />,
      url: "https://www.google.com/maps/search/Rua+Oscar+Soares+1226+Califórnia+Nova+Iguaçu"
    },
    {
      title: "Loja 03 - Centro Nova Iguaçu",
      description: "Av: Nilo Peçanha, 1058",
      phone: "21974636253",
      icon: <MapPin className="w-6 h-6" />,
      url: "https://www.google.com/maps/search/Avenida+Nilo+Peçanha+1058+Centro+Nova+Iguaçu"
    },
    {
      title: "Conheça nossa história",
      description: "Assista ao vídeo e saiba mais sobre nós",
      icon: <PlayCircle className="w-6 h-6" />,
      url: "https://youtu.be/PoNBRFUj-Z0?si=_vlfdFIgYMi8cYZS"
    }
  ];

  const handleLinkClick = (url: string) => {
    if (url.startsWith("/")) {
      window.location.href = url;
    } else {
      window.open(url, "_blank");
    }
  };

  const handlePhoneClick = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.open(`https://wa.me/55${phone}`, "_blank");
  };

  const themeClasses = isDarkMode 
    ? {
        bg: "bg-slate-950",
        header: "from-slate-900 via-blue-950 to-slate-900",
        card: "bg-slate-900 border-slate-800 text-white",
        cardHover: "hover:border-blue-500/50 hover:bg-slate-800",
        textPrimary: "text-white",
        textSecondary: "text-slate-400",
        iconBg: "bg-slate-800 text-blue-400",
        footer: "bg-slate-950 border-slate-900",
        footerText: "text-slate-600",
        footerHover: "hover:text-slate-400"
      }
    : {
        bg: "bg-slate-50",
        header: "from-blue-900 via-blue-800 to-blue-900",
        card: "bg-white border-slate-200 text-slate-900",
        cardHover: "hover:border-blue-300 hover:bg-white",
        textPrimary: "text-slate-900",
        textSecondary: "text-slate-500",
        iconBg: "bg-blue-50 text-blue-600",
        footer: "bg-white border-slate-100",
        footerText: "text-slate-400",
        footerHover: "hover:text-slate-600"
      };

  return (
    <div className={`min-h-screen ${themeClasses.bg} flex flex-col items-center transition-colors duration-500`}>
      {/* Header / Top Bar */}
      <div className={`w-full bg-gradient-to-r ${themeClasses.header} py-12 px-4 shadow-2xl relative overflow-hidden transition-colors duration-500`}>
        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute top-6 right-6 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 shadow-lg"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isDarkMode ? "dark" : "light"}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.3 }}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className={`absolute -top-24 -left-24 w-64 h-64 ${isDarkMode ? "bg-blue-900" : "bg-white"} rounded-full blur-3xl`} />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
        </div>

        <div className="max-w-md mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="flex justify-center mb-6"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <img 
                src="/img/iguacu_vidros_white.png" 
                alt="Iguaçu Auto Vidros" 
                className="relative h-24 object-contain drop-shadow-2xl"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-white text-3xl font-display font-black tracking-tight mb-3">
              Iguaçu Auto Vidros
            </h1>
            <div className="h-1 w-12 bg-blue-400 mx-auto rounded-full mb-4" />
            <p className="text-blue-100/90 text-sm font-medium leading-relaxed max-w-xs mx-auto">
              Especialistas em segurança e confiança automotiva. Conecte-se com nossas unidades e conheça nossos serviços.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Links List */}
      <div className="w-full max-w-md px-4 -mt-8 pb-12 space-y-4 relative z-20">
        {links.map((link, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index + 0.4, duration: 0.5 }}
          >
            <button
              onClick={() => handleLinkClick(link.url)}
              className={`w-full group relative flex items-center p-5 rounded-2xl border transition-all duration-300 text-left ${
                link.primary 
                  ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700 hover:scale-[1.03] shadow-xl shadow-blue-600/30" 
                  : (link as any).isEmergency
                    ? "bg-amber-500 border-amber-400 text-white hover:bg-amber-600 hover:scale-[1.03] shadow-xl shadow-amber-500/30 animate-pulse"
                    : `${themeClasses.card} ${themeClasses.cardHover} hover:scale-[1.03] shadow-lg`
              }`}
            >
              <div className={`p-4 rounded-xl mr-4 transition-transform group-hover:scale-110 ${
                link.primary || (link as any).isEmergency ? "bg-white/10" : themeClasses.iconBg
              }`}>
                {link.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg tracking-tight">{link.title}</h3>
                <p className={`text-sm mt-0.5 ${link.primary || (link as any).isEmergency ? "text-white/90" : themeClasses.textSecondary}`}>
                  {link.description}
                </p>
                {link.phone && (
                  <button
                    onClick={(e) => handlePhoneClick(e, link.phone!)}
                    className={`mt-3 flex items-center text-xs font-bold py-1.5 px-4 rounded-full transition-all ${
                      link.primary 
                        ? "bg-white/20 text-white hover:bg-white/30" 
                        : isDarkMode
                          ? "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-800/50"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 mr-2" />
                    Chamar no WhatsApp
                  </button>
                )}
              </div>
              <div className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 ${
                link.primary ? "bg-white/10" : isDarkMode ? "bg-slate-800" : "bg-blue-50"
              }`}>
                <ExternalLink className={`w-4 h-4 ${
                  link.primary ? "text-white" : "text-blue-500"
                }`} />
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Footer / Signature */}
      <footer className={`mt-auto py-8 w-full text-center ${themeClasses.footer} border-t transition-colors duration-500`}>
        <a 
          href="https://www.technexos.com.br/diagnostico-gratuito" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`group inline-flex items-center gap-1.5 transition-colors ${themeClasses.footerText} ${themeClasses.footerHover}`}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold opacity-60">Desenvolvido por</span>
          <span className="font-black text-sm tracking-tighter uppercase">Technexos</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-40" />
        </a>
      </footer>
    </div>
  );
};

export default CanaisIguacu;
