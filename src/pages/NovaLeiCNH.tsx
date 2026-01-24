import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Users, BookOpen, Shield, TrendingDown } from 'lucide-react';

const NovaLeiCNH = () => {
    const navigate = useNavigate();

    return (
        <>
            <SEOHead
                title="Nova Lei da CNH 2025: Instrutor Independente e CNH Grátis"
                description="Entenda todas as mudanças da Lei 14.599/2023: instrutor independente, aulas online gratuitas, economia de até 80% e CNH Social. Guia completo atualizado."
                keywords="nova lei CNH 2025, Lei 14.599/2023, instrutor independente, CNH grátis, CNH social, aulas online CNH, mudanças CNH 2025"
                canonical="/nova-lei-cnh"
            />

            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                    <div className="container mx-auto px-4 py-8">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/')}
                            className="mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                            Nova Lei da CNH 2025
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl">
                            Entenda como a Lei 14.599/2023 revolucionou o processo de habilitação no Brasil
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    {/* Principais Mudanças */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold mb-6">O que mudou com a nova lei?</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-card border rounded-lg p-6">
                                <Users className="w-10 h-10 text-primary mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Instrutor Independente</h3>
                                <p className="text-muted-foreground">
                                    Profissionais credenciados podem dar aulas práticas sem vínculo com autoescola. Mais opções e flexibilidade para você.
                                </p>
                            </div>

                            <div className="bg-card border rounded-lg p-6">
                                <BookOpen className="w-10 h-10 text-primary mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Aulas Teóricas Online</h3>
                                <p className="text-muted-foreground">
                                    Estude gratuitamente pelo app "CNH do Brasil". Não há mais exigência de 45 horas presenciais em CFC.
                                </p>
                            </div>

                            <div className="bg-card border rounded-lg p-6">
                                <TrendingDown className="w-10 h-10 text-primary mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Economia de até 80%</h3>
                                <p className="text-muted-foreground">
                                    Com aulas teóricas gratuitas e instrutores independentes, o custo total da CNH pode cair drasticamente.
                                </p>
                            </div>

                            <div className="bg-card border rounded-lg p-6">
                                <Shield className="w-10 h-10 text-primary mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Sem Prazo Limite</h3>
                                <p className="text-muted-foreground">
                                    O prazo de um ano para concluir o processo foi removido. Faça no seu ritmo, sem pressão.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Instrutor Independente */}
                    <section className="mb-12 bg-card border rounded-lg p-8">
                        <h2 className="text-3xl font-bold mb-6">Instrutor Independente: Como Funciona?</h2>

                        <div className="prose prose-lg max-w-none">
                            <p className="text-muted-foreground mb-4">
                                A grande novidade da Lei 14.599/2023 é a regulamentação do <strong>instrutor autônomo</strong>.
                                Agora, profissionais qualificados podem oferecer aulas práticas de direção de forma independente,
                                sem necessidade de vínculo com autoescolas tradicionais.
                            </p>

                            <h3 className="text-2xl font-semibold mt-6 mb-4">Requisitos para ser Instrutor Independente:</h3>
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                    <span>Ter no mínimo 21 anos de idade</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                    <span>Possuir CNH na categoria correspondente há pelo menos 2 anos</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                    <span>Ensino médio completo</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                    <span>Sem infrações gravíssimas recentes</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                    <span>Formação específica em habilidades pedagógicas (curso gratuito do Ministério dos Transportes)</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                    <span>Registro no DETRAN e Ministério dos Transportes</span>
                                </li>
                            </ul>

                            <h3 className="text-2xl font-semibold mt-6 mb-4">Vantagens para o Aluno:</h3>
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                    <span><strong>Economia:</strong> Aulas 30-50% mais baratas que em autoescolas</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                    <span><strong>Flexibilidade:</strong> Horários e locais personalizados</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                    <span><strong>Atenção Individual:</strong> Foco 100% no seu aprendizado</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                    <span><strong>Transparência:</strong> Avaliações e reputação verificadas</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* CNH Grátis */}
                    <section className="mb-12 bg-primary/5 border border-primary/20 rounded-lg p-8">
                        <h2 className="text-3xl font-bold mb-6">CNH Grátis (CNH Social)</h2>

                        <p className="text-muted-foreground mb-4">
                            A <strong>CNH Social</strong> é um programa governamental que oferece habilitação gratuita
                            para pessoas de baixa renda. Disponível em alguns estados brasileiros, o programa cobre
                            custos de exames teóricos, práticos e aulas.
                        </p>

                        <h3 className="text-2xl font-semibold mt-6 mb-4">Quem tem direito?</h3>
                        <p className="text-muted-foreground mb-4">
                            Os critérios variam por estado, mas geralmente incluem:
                        </p>
                        <ul className="space-y-2 mb-6">
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                <span>Renda familiar de até 2 salários mínimos</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                <span>Cadastro no CadÚnico</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                                <span>Residência no estado há pelo menos 2 anos</span>
                            </li>
                        </ul>

                        <p className="text-sm text-muted-foreground">
                            <strong>Importante:</strong> Consulte o DETRAN do seu estado para verificar disponibilidade,
                            requisitos específicos e processo de inscrição.
                        </p>
                    </section>

                    {/* FAQ */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold mb-6">Perguntas Frequentes</h2>

                        <div className="space-y-4">
                            <details className="bg-card border rounded-lg p-6">
                                <summary className="font-semibold cursor-pointer">
                                    A nova lei já está em vigor?
                                </summary>
                                <p className="mt-4 text-muted-foreground">
                                    Sim! A Lei 14.599/2023 e as resoluções do Contran entraram em vigor em dezembro de 2025.
                                    Todas as mudanças já estão valendo em todo o Brasil.
                                </p>
                            </details>

                            <details className="bg-card border rounded-lg p-6">
                                <summary className="font-semibold cursor-pointer">
                                    Posso fazer aulas práticas só com instrutor independente?
                                </summary>
                                <p className="mt-4 text-muted-foreground">
                                    Sim! Você pode fazer todas as suas aulas práticas obrigatórias com um instrutor
                                    independente credenciado, sem precisar se matricular em uma autoescola.
                                </p>
                            </details>

                            <details className="bg-card border rounded-lg p-6">
                                <summary className="font-semibold cursor-pointer">
                                    O certificado do instrutor independente é válido?
                                </summary>
                                <p className="mt-4 text-muted-foreground">
                                    Sim! Instrutores independentes credenciados pelo DETRAN emitem certificados válidos
                                    para o processo de habilitação, com o mesmo valor legal que autoescolas tradicionais.
                                </p>
                            </details>

                            <details className="bg-card border rounded-lg p-6">
                                <summary className="font-semibold cursor-pointer">
                                    Quanto tempo leva para tirar a CNH agora?
                                </summary>
                                <p className="mt-4 text-muted-foreground">
                                    Não há mais prazo limite! Você pode fazer no seu ritmo. Em média, candidatos levam
                                    de 2 a 6 meses, mas você tem total flexibilidade para adequar ao seu tempo disponível.
                                </p>
                            </details>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Encontre seu Instrutor Independente
                        </h2>
                        <p className="text-lg mb-6 opacity-90">
                            Aproveite as vantagens da nova lei. Economize até 80% e tire sua CNH com flexibilidade.
                        </p>
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={() => navigate('/connect')}
                            className="text-lg px-8"
                        >
                            Ver Instrutores Disponíveis
                        </Button>
                    </section>
                </div>
            </div>
        </>
    );
};

export default NovaLeiCNH;
