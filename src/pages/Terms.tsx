import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6 hover:bg-transparent hover:text-primary p-0"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                <h1 className="text-4xl font-bold mb-8 text-foreground">Termos de Uso</h1>

                <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                    <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar e usar o Vrumi, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, você não deve usar nossos serviços.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">2. Uso da Plataforma</h2>
                        <p>
                            O Vrumi é uma plataforma educacional destinada a auxiliar no estudo para a obtenção da CNH. O conteúdo fornecido é para fins informativos e educacionais.
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>Você é responsável por manter a confidencialidade da sua conta.</li>
                            <li>É proibido compartilhar sua conta com terceiros.</li>
                            <li>Você concorda em fornecer informações verdadeiras e precisas no cadastro.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">3. Propriedade Intelectual</h2>
                        <p>
                            Todo o conteúdo disponível no Vrumi, incluindo textos, gráficos, logotipos, imagens e software, é propriedade do Vrumi ou de seus licenciadores e é protegido por leis de direitos autorais.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">4. Planos e Pagamentos</h2>
                        <p>
                            Oferecemos planos de assinatura para acesso a recursos premium. Os pagamentos são processados de forma segura. O cancelamento pode ser feito a qualquer momento, respeitando as regras de reembolso vigentes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">5. Limitação de Responsabilidade</h2>
                        <p>
                            O Vrumi não garante a aprovação no exame oficial do DETRAN. O sucesso depende do esforço individual e estudo do usuário. Não nos responsabilizamos por falhas técnicas externas ou interrupções temporárias do serviço.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">6. Alterações nos Termos</h2>
                        <p>
                            Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação na plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">7. Contato</h2>
                        <p>
                            Para dúvidas sobre estes termos, entre em contato através do nosso suporte.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Terms;
