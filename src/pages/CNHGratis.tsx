import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Users, FileCheck, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

const CNHGratis = () => {
    const navigate = useNavigate();

    return (
        <>
            <SEOHead
                title="CNH Grátis 2025: Como Funciona a CNH Social e Quem Tem Direito"
                description="Descubra como conseguir a CNH grátis através do programa CNH Social. Veja requisitos, estados participantes e passo a passo para se inscrever."
                keywords="CNH grátis, CNH social, habilitação gratuita, CNH popular, como tirar CNH de graça, CNH social 2025, programa CNH grátis"
                canonical="/cnh-gratis"
            />

            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-b">
                    <div className="container mx-auto px-4 py-8">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/')}
                            className="mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                        <div className="flex items-center gap-3 mb-4">
                            <Gift className="w-12 h-12 text-green-600" />
                            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                                CNH Grátis (CNH Social)
                            </h1>
                        </div>
                        <p className="text-xl text-muted-foreground max-w-3xl">
                            Saiba como conseguir sua habilitação gratuitamente através do programa governamental
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    {/* O que é */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold mb-6">O que é a CNH Social?</h2>
                        <div className="prose prose-lg max-w-none">
                            <p className="text-muted-foreground text-lg mb-4">
                                A <strong>CNH Social</strong> (também conhecida como CNH Grátis ou CNH Popular) é um programa
                                governamental que oferece habilitação gratuita para pessoas de baixa renda.
                            </p>
                            <p className="text-muted-foreground text-lg mb-4">
                                O programa cobre todos os custos do processo de habilitação, incluindo:
                            </p>
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Exame médico e psicotécnico</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Aulas teóricas (quando não feitas pelo app gratuito)</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Aulas práticas de direção</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Taxas de exames teórico e prático</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Emissão da CNH</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Quem tem direito */}
                    <section className="mb-12 bg-card border rounded-lg p-8">
                        <h2 className="text-3xl font-bold mb-6 flex items-center">
                            <Users className="w-8 h-8 text-primary mr-2" />
                            Quem Tem Direito?
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Requisitos Gerais</h3>
                                <p className="text-muted-foreground mb-4">
                                    Os critérios variam por estado, mas geralmente incluem:
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <div>
                                            <strong>Renda familiar baixa:</strong> Até 2 salários mínimos (pode variar por estado)
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <div>
                                            <strong>Cadastro no CadÚnico:</strong> Estar inscrito no Cadastro Único para Programas Sociais
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <div>
                                            <strong>Residência:</strong> Morar no estado há pelo menos 2 anos (alguns estados exigem mais)
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <div>
                                            <strong>Idade mínima:</strong> 18 anos completos
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <div>
                                            <strong>Alfabetização:</strong> Saber ler e escrever
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                                            Grupos Prioritários
                                        </h4>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                            Alguns estados dão prioridade para: beneficiários do Bolsa Família, jovens em busca do
                                            primeiro emprego, pessoas com deficiência, e trabalhadores de setores específicos (transporte,
                                            agricultura, etc.).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Estados Participantes */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold mb-6 flex items-center">
                            <MapPin className="w-8 h-8 text-primary mr-2" />
                            Estados Participantes
                        </h2>

                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                            <p className="text-muted-foreground mb-4">
                                A CNH Social é um programa <strong>estadual</strong>, não federal. Isso significa que cada estado
                                decide se oferece o programa, os requisitos específicos e o número de vagas disponíveis.
                            </p>
                            <p className="text-muted-foreground">
                                <strong>Estados que já ofereceram o programa:</strong> São Paulo, Rio de Janeiro, Minas Gerais,
                                Bahia, Paraná, Rio Grande do Sul, Pernambuco, Ceará, Goiás, entre outros.
                            </p>
                        </div>

                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold mb-3">Como Verificar no Seu Estado</h3>
                            <ol className="space-y-3 list-decimal list-inside">
                                <li className="text-muted-foreground">
                                    Acesse o site oficial do DETRAN do seu estado
                                </li>
                                <li className="text-muted-foreground">
                                    Procure por "CNH Social", "CNH Grátis" ou "CNH Popular"
                                </li>
                                <li className="text-muted-foreground">
                                    Verifique se há edital aberto para inscrições
                                </li>
                                <li className="text-muted-foreground">
                                    Leia atentamente os requisitos específicos do seu estado
                                </li>
                            </ol>
                        </div>
                    </section>

                    {/* Como se Inscrever */}
                    <section className="mb-12 bg-card border rounded-lg p-8">
                        <h2 className="text-3xl font-bold mb-6 flex items-center">
                            <FileCheck className="w-8 h-8 text-primary mr-2" />
                            Como se Inscrever
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0 mt-1">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Verifique sua Elegibilidade</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Confirme que você atende todos os requisitos do programa no seu estado.
                                        Tenha em mãos documentos como RG, CPF, comprovante de residência e comprovante de renda.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0 mt-1">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Cadastre-se no CadÚnico</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Se ainda não tem, procure o CRAS (Centro de Referência de Assistência Social) mais próximo
                                        para fazer seu cadastro no CadÚnico. É obrigatório para a maioria dos programas.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0 mt-1">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Aguarde o Edital</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Fique atento ao site do DETRAN e redes sociais oficiais. Os editais geralmente são publicados
                                        1-2 vezes por ano, com número limitado de vagas.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0 mt-1">
                                    4
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Faça a Inscrição</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Quando o edital abrir, inscreva-se online ou presencialmente (conforme orientação do DETRAN).
                                        Envie toda a documentação solicitada dentro do prazo.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0 mt-1">
                                    5
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Acompanhe o Resultado</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Se selecionado, você receberá instruções sobre como iniciar o processo.
                                        Siga todas as orientações e prazos estabelecidos pelo DETRAN.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Alternativas */}
                    <section className="mb-12 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8">
                        <h2 className="text-3xl font-bold mb-6">E se não conseguir a CNH Social?</h2>

                        <p className="text-muted-foreground mb-6">
                            As vagas da CNH Social são limitadas e a concorrência é alta. Se você não for selecionado
                            ou seu estado não oferece o programa, ainda há formas de economizar:
                        </p>

                        <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                                <h3 className="font-semibold mb-2">✅ Use o App Gratuito CNH do Brasil</h3>
                                <p className="text-sm text-muted-foreground">
                                    Estude para o exame teórico gratuitamente pelo aplicativo oficial.
                                    Isso elimina o custo das aulas teóricas em autoescola.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                                <h3 className="font-semibold mb-2">✅ Contrate um Instrutor Independente</h3>
                                <p className="text-sm text-muted-foreground">
                                    Para as aulas práticas, escolha um instrutor independente pela Vrumi.
                                    Você pode economizar 30-50% comparado a autoescolas tradicionais.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                                <h3 className="font-semibold mb-2">✅ Parcele os Custos</h3>
                                <p className="text-sm text-muted-foreground">
                                    Com a nova lei, não há mais prazo limite. Você pode fazer o processo aos poucos,
                                    conforme sua disponibilidade financeira.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Economize com Instrutores Independentes
                        </h2>
                        <p className="text-lg mb-6 opacity-90">
                            Mesmo sem a CNH Social, você pode economizar até 50% nas aulas práticas
                        </p>
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={() => navigate('/connect')}
                            className="text-lg px-8"
                        >
                            Ver Instrutores e Preços
                        </Button>
                    </section>
                </div>
            </div>
        </>
    );
};

export default CNHGratis;
