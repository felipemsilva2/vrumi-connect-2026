import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
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

                <h1 className="text-4xl font-bold mb-8 text-foreground">Política de Privacidade</h1>

                <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                    <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">1. Coleta de Dados</h2>
                        <p>
                            Coletamos informações que você nos fornece diretamente, como nome, email e dados de pagamento ao criar uma conta ou assinar nossos serviços. Também coletamos dados de uso e progresso nos estudos para personalizar sua experiência.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">2. Uso das Informações</h2>
                        <p>
                            Utilizamos seus dados para:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>Fornecer e manter nossos serviços.</li>
                            <li>Processar pagamentos e gerenciar sua conta.</li>
                            <li>Personalizar o conteúdo de estudo e recomendações.</li>
                            <li>Enviar comunicações importantes sobre o serviço.</li>
                            <li>Melhorar e otimizar nossa plataforma.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">3. Compartilhamento de Dados</h2>
                        <p>
                            Não vendemos seus dados pessoais. Podemos compartilhar informações com prestadores de serviços terceirizados que nos ajudam a operar a plataforma (como processadores de pagamento), sempre sob estritas obrigações de confidencialidade.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">4. Segurança</h2>
                        <p>
                            Empregamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração ou destruição. No entanto, nenhum método de transmissão pela internet é 100% seguro.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">5. Seus Direitos</h2>
                        <p>
                            Você tem o direito de acessar, corrigir ou excluir seus dados pessoais. Você também pode optar por não receber comunicações de marketing a qualquer momento.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">6. Cookies</h2>
                        <p>
                            Utilizamos cookies e tecnologias similares para melhorar a navegação, lembrar suas preferências e analisar o tráfego do site. Você pode gerenciar as preferências de cookies no seu navegador.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">7. Contato</h2>
                        <p>
                            Se tiver dúvidas sobre nossa política de privacidade, entre em contato conosco.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
