import { useState } from "react";
import { ChevronDown, Shield, Lock, Calendar, Phone, FileText, CheckCircle, AlertCircle, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

const Help = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

  const faqItems: FAQItem[] = [
    {
      question: "O que é o Clube do Vidro?",
      answer: "O Clube do Vidro é um programa de proteção para seu veículo que oferece até 3 trocas de vidro por ano. Você paga uma mensalidade fixa de R$ 19,90 e tem acesso a vidros 100% originais, sem carência, com assistência 24/7 para emergências. É a solução completa para proteger seu carro contra acidentes com vidros.",
    },
    {
      question: "Como funciona o agendamento de serviço?",
      answer: "Ao entrar na sua conta, clique em 'Novo Agendamento' na seção 'Agendar Serviço'. Escolha o tipo de vidro que precisa trocar (para-brisa, retrovisor, vigia, farol, vidro lateral, etc), selecione a data e hora que melhor se encaixa na sua agenda, adicione observações se necessário e confirme. Você pode fazer até 3 agendamentos por ano. O funcionário da loja confirmará seu agendamento e você receberá a atualização em tempo real na sua conta.",
    },
    {
      question: "Quanto tempo demora para trocar o vidro?",
      answer: "A troca de vidro geralmente leva de 30 minutos a 1 hora, dependendo do tipo de vidro e do veículo. Nossos instaladores são experientes e usam apenas vidros originais. Recomendamos não usar o veículo nos primeiros 30 minutos após a troca para garantir a melhor fixação.",
    },
    {
      question: "O que fazer se esquecer minha senha?",
      answer: "Sua segurança é nossa prioridade. Por isso, não temos opção de 'recuperar senha' automática. Para resetar sua senha, você deve entrar em contato com a Iguaçu Auto Vidros via WhatsApp (45) 99901-0000. Leve sua documentação (RG e CPF) para comprovar sua identidade. Nossa equipe irá verificar seus dados e enviar uma nova senha segura. Isso protege sua conta de acessos não autorizados.",
    },
    {
      question: "Posso agendar mais de um vidro na mesma data?",
      answer: "Sim! Você pode agendar diferentes tipos de vidro no mesmo dia ou em datas diferentes, desde que não exceda suas 3 trocas anuais. Se precisar fazer mais trocas em um ano, entre em contato com nossa equipe para discutir opções.",
    },
    {
      question: "O que incluído no meu plano?",
      answer: "✓ 3 trocas de vidro por ano\n✓ Vidros 100% originais com garantia\n✓ Assistência 24/7 para emergências\n✓ Sem carência - pode usar no 1º mês\n✓ Sem taxa de agendamento\n✓ Acesso ao histórico completo de serviços\n✓ Suporte direto com a equipe",
    },
    {
      question: "Como cancelo ou altero um agendamento?",
      answer: "Para cancelar ou alterar um agendamento pendente ou confirmado, entre em contato diretamente via WhatsApp (45) 99901-0000. Nossa equipe está disponível 24/7 para ajudá-lo. Tenha à mão o número do seu agendamento ou a data marcada para agilizar o processo.",
    },
    {
      question: "O vidro tem garantia?",
      answer: "Sim! Todos os vidros instalados possuem garantia de fábrica. Se detectarmos qualquer defeito no vidro dentro de 30 dias após a instalação, faremos a troca sem custo adicional. Essa garantia cobre defeitos de fabricação, não danos causados por acidentes subsequentes.",
    },
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: "Autenticação Segura",
      description: "Sua conta é protegida por autenticação de email e senha criptografada. Apenas você pode acessar seus dados.",
    },
    {
      icon: Shield,
      title: "Verificação de Identidade",
      description: "Para resetar senha, exigimos documentos físicos. Nenhuma alteração importante sem comprovação de identidade.",
    },
    {
      icon: FileText,
      title: "Histórico Completo",
      description: "Todo agendamento e serviço fica registrado. Você tem controle total do que foi feito em sua conta.",
    },
    {
      icon: Calendar,
      title: "Dados Organizados",
      description: "Seus agendamentos, serviços e trocas ficam organizados cronologicamente para sua consulta.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-border/40 bg-background/80">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <a href="/" className="text-xl font-display font-bold text-foreground hover:text-primary transition">
            ← Voltar
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Central de Ajuda
          </h1>
          <p className="text-xl text-muted-foreground">
            Tudo que você precisa saber sobre o Clube do Vidro
          </p>
        </motion.div>

        {/* Como Funciona */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <div className="glass-card p-8 rounded-2xl border border-primary/30 mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              Como Funciona o Sistema
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-primary">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Crie Sua Conta</h3>
                  <p className="text-muted-foreground">Acesse a página de Login, clique em "Criar minha conta" e preencha seus dados (nome, email, telefone, CPF, veículo e placa). Sua conta estará ativa imediatamente.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-primary">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Acesse Sua Dashboard</h3>
                  <p className="text-muted-foreground">Faça login com suas credenciais (email e senha). Você verá sua conta com informações do plano, dados pessoais e a seção de agendamentos.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-primary">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Agende um Serviço</h3>
                  <p className="text-muted-foreground">Clique em "Novo Agendamento", escolha o tipo de vidro, selecione data e hora, adicione observações se necessário e confirme. Seu agendamento fica pendente até confirmação.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-primary">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Confirmação da Loja</h3>
                  <p className="text-muted-foreground">A equipe da Iguaçu Auto Vidros confirmará seu agendamento. Você verá o status mudar para "Confirmado" em sua conta em tempo real.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-primary">5</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Realize o Serviço</h3>
                  <p className="text-muted-foreground">Compareça à loja na data e hora agendadas. Nossos instaladores realizarão a troca com vidros originais de qualidade. O processo leva entre 30 minutos a 1 hora.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-primary">6</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Serviço Concluído</h3>
                  <p className="text-muted-foreground">Após o serviço, o agendamento será marcado como "Concluído" e a troca registrada em seu histórico. Você pode agendar até 3 trocas por ano.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Segurança */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Segurança da Sua Conta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="glass-card p-6 rounded-lg border border-border/50"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Recuperação de Senha */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <div className="glass-card p-8 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              Esqueceu Sua Senha?
            </h2>
            <div className="space-y-4">
              <p className="text-foreground">
                <strong>A segurança da sua conta é nossa prioridade.</strong> Por isso, não oferecemos recuperação automática de senha. Isso protege você contra acessos não autorizados.
              </p>

              <div className="bg-background/50 rounded-lg p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Passo a Passo para Resetar Senha:</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="font-bold text-primary flex-shrink-0">1.</span>
                    <span>Abra o <strong>WhatsApp</strong> e entre em contato com a <strong>Iguaçu Auto Vidros</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary flex-shrink-0">2.</span>
                    <span>Envie uma mensagem solicitando <strong>"Reset de Senha"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary flex-shrink-0">3.</span>
                    <span>Dirija-se à loja com sua <strong>documentação original</strong> (RG e CPF)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary flex-shrink-0">4.</span>
                    <span>Nossa equipe verificará seus dados e <strong>confirmará sua identidade</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary flex-shrink-0">5.</span>
                    <span>Você receberá uma <strong>nova senha segura</strong> via WhatsApp ou email</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary flex-shrink-0">6.</span>
                    <span><strong>Faça login</strong> e <strong>altere sua senha</strong> para uma que você memorize</span>
                  </li>
                </ol>
              </div>

              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-4 border border-border">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Contato via WhatsApp:</p>
                  <a href="https://wa.me/5545999010000" className="text-primary font-semibold hover:underline">
                    (45) 99901-0000
                  </a>
                </div>
              </div>

              <p className="text-xs text-muted-foreground border-t pt-4">
                <strong>Por que fazemos assim?</strong> Senhas automáticas enviadas por link podem ser interceptadas. A verificação presencial garante que apenas o titular da conta tenha acesso, protegendo seus dados e seus agendamentos.
              </p>
            </div>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">
            Perguntas Frequentes
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
                className="glass-card border border-border/50 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition"
                >
                  <span className="font-semibold text-foreground text-left">{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-primary transition-transform ${
                      expandedFAQ === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedFAQ === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-4 pb-4 text-muted-foreground border-t border-border/50 whitespace-pre-wrap"
                  >
                    {item.answer}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Contact */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <div className="glass-card p-8 rounded-2xl border border-primary/30 text-center">
            <Smartphone className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              Ainda Tem Dúvidas?
            </h2>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está disponível 24/7 para ajudá-lo com qualquer dúvida ou suporte.
            </p>
            <a href="https://wa.me/5545999010000">
              <Button className="gap-2">
                <Phone className="w-4 h-4" />
                Contate-nos via WhatsApp
              </Button>
            </a>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Help;
