import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NewLawExplained = () => {
    const navigate = useNavigate();

    return (
        <section className="py-20 px-4 bg-muted/30">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                            ATUALIZAÇÃO URGENTE
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                            Entenda a Nova Lei da CNH
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            O CONTRAN aprovou o fim da obrigatoriedade das aulas em autoescolas.
                            Veja o que muda para você e como o Vrumi se torna sua melhor opção.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Antes */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-card border border-border p-8 rounded-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <XCircle size={120} />
                        </div>
                        <h3 className="text-2xl font-bold text-muted-foreground mb-6 flex items-center gap-2">
                            <XCircle className="text-destructive" />
                            Como era (Antes)
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-muted-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                                <span>45 horas de aulas teóricas obrigatórias em sala de aula</span>
                            </li>
                            <li className="flex items-start gap-3 text-muted-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                                <span>Altos custos com matrículas e taxas de autoescola</span>
                            </li>
                            <li className="flex items-start gap-3 text-muted-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                                <span>Horários rígidos e deslocamento diário</span>
                            </li>
                            <li className="flex items-start gap-3 text-muted-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                                <span>Processo lento e burocrático</span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Agora */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="bg-gradient-to-br from-primary/5 to-background border-2 border-primary/20 p-8 rounded-2xl relative overflow-hidden shadow-lg"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CheckCircle2 size={120} className="text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <CheckCircle2 className="text-primary" />
                            Como ficou (Agora)
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-foreground font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span>Você estuda por conta própria (Self-Study)</span>
                            </li>
                            <li className="flex items-start gap-3 text-foreground font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span>Economia de até 70% no valor total da CNH</span>
                            </li>
                            <li className="flex items-start gap-3 text-foreground font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span>Estude onde e quando quiser com o Vrumi</span>
                            </li>
                            <li className="flex items-start gap-3 text-foreground font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span>Foco total na prova teórica (que continua obrigatória)</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-center"
                >
                    <p className="text-xl text-foreground mb-8 max-w-3xl mx-auto">
                        A prova teórica <strong>continua obrigatória e rigorosa</strong>.
                        O Vrumi é a ferramenta oficial para você se preparar sozinho e garantir sua aprovação de primeira.
                    </p>
                    <button
                        onClick={() => navigate("/entrar?mode=register")}
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 gap-2 group"
                    >
                        Começar a Estudar Agora
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

export default NewLawExplained;
