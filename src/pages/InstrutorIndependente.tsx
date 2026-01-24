import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, Star, MapPin, CheckCircle2, XCircle } from 'lucide-react';

const InstrutorIndependente = () => {
    const navigate = useNavigate();

    return (
        <>
            <SEOHead
                title="Instrutor Independente: O que é, Vantagens e Como Contratar"
                description="Descubra como funciona o instrutor independente de direção. Compare com autoescolas, veja preços, vantagens e encontre instrutores credenciados pelo DETRAN."
                keywords="instrutor independente, instrutor particular de direção, instrutor autônomo, aulas particulares direção, quanto custa instrutor particular, instrutor credenciado DETRAN"
                canonical="/instrutor-independente"
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
                            Instrutor Independente de Direção
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl">
                            Tudo o que você precisa saber sobre aulas particulares de direção com instrutores credenciados
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    {/* O que é */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold mb-6">O que é um Instrutor Independente?</h2>
                        <div className="prose prose-lg max-w-none">
                            <p className="text-muted-foreground text-lg mb-4">
                                Um <strong>instrutor independente</strong> (também chamado de instrutor autônomo) é um profissional
                                credenciado pelo DETRAN que oferece aulas práticas de direção sem vínculo com autoescolas tradicionais.
                            </p>
                            <p className="text-muted-foreground text-lg mb-4">
                                Com a <strong>Lei 14.599/2023</strong>, essa modalidade foi oficialmente regulamentada, permitindo
                                que candidatos à CNH escolham entre fazer aulas em autoescolas ou com instrutores particulares.
                            </p>
                        </div>
                    </section>

                    {/* Comparação */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold mb-6">Instrutor Independente vs Autoescola</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Instrutor Independente */}
                            <div className="bg-primary/5 border-2 border-primary rounded-lg p-6">
                                <h3 className="text-2xl font-semibold mb-4 text-primary">Instrutor Independente</h3>

                                <div className="space-y-3">
                                    <div className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">30-50% mais barato</span>
                                    </div>
                                    <div className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">Horários flexíveis</span>
                                    </div>
                                    <div className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">Atenção individualizada</span>
                                    </div>
                                    <div className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">Escolha o local das aulas</span>
                                    </div>
                                    <div className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">Pagamento direto ao instrutor</span>
                                    </div>
                                    <div className="flex items-start">
                                        <XCircle className="w-5 h-5 text-red-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">Você precisa buscar o instrutor</span>
                                    </div>
                                </div>
                            </div>

                            {/* Autoescola */}
                            <div className="bg-card border rounded-lg p-6">
                                <h3 className="text-2xl font-semibold mb-4">Autoescola Tradicional</h3>

                                <div className="space-y-3">
                                    <div className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">Tudo em um só lugar</span>
                                    </div>
                                    <div className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">Estrutura física estabelecida</span>
                                    </div>
                                    <div className="flex items-start">
                                        <XCircle className="w-5 h-5 text-red-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">Mais caro (pacotes completos)</span>
                                    </div>
                                    <div className="flex items-start">
                                        <XCircle className="w-5 h-5 text-red-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">Horários menos flexíveis</span>
                                    </div>
                                    <div className="flex items-start">
                                        <XCircle className="w-5 h-5 text-red-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">Instrutores rotativos</span>
                                    </div>
                                    <div className="flex items-start">
                                        <XCircle className="w-5 h-5 text-red-500 mr-2 mt-1 flex-shrink-0" />
                                        <span className="text-sm">Locais fixos de aula</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Preços */}
                    <section className="mb-12 bg-card border rounded-lg p-8">
                        <h2 className="text-3xl font-bold mb-6 flex items-center">
                            <DollarSign className="w-8 h-8 text-primary mr-2" />
                            Quanto Custa?
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Preços Médios (2025)</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-primary/5 rounded-lg p-4">
                                        <p className="text-sm text-muted-foreground mb-1">Instrutor Independente</p>
                                        <p className="text-2xl font-bold text-primary">R$ 80-120</p>
                                        <p className="text-xs text-muted-foreground">por aula (50min)</p>
                                    </div>
                                    <div className="bg-muted rounded-lg p-4">
                                        <p className="text-sm text-muted-foreground mb-1">Autoescola Tradicional</p>
                                        <p className="text-2xl font-bold">R$ 150-200</p>
                                        <p className="text-xs text-muted-foreground">por aula (50min)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                                <h4 className="font-semibold text-lg mb-2 text-green-800 dark:text-green-200">
                                    💰 Economia Total
                                </h4>
                                <p className="text-muted-foreground">
                                    Considerando 20 aulas práticas obrigatórias, você pode economizar entre <strong>R$ 1.400 a R$ 1.600</strong>
                                    escolhendo um instrutor independente ao invés de uma autoescola tradicional.
                                </p>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                * Preços variam por região, experiência do instrutor e tipo de veículo.
                                Valores são aproximados e servem como referência.
                            </p>
                        </div>
                    </section>

                    {/* Como Escolher */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold mb-6">Como Escolher um Bom Instrutor?</h2>

                        <div className="space-y-4">
                            <div className="flex items-start bg-card border rounded-lg p-4">
                                <Star className="w-6 h-6 text-primary mr-3 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold mb-1">Verifique as Avaliações</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Leia comentários de outros alunos. Procure por avaliações consistentemente positivas
                                        e atenção aos detalhes mencionados.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start bg-card border rounded-lg p-4">
                                <CheckCircle2 className="w-6 h-6 text-primary mr-3 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold mb-1">Confirme o Credenciamento</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Todo instrutor independente deve estar registrado no DETRAN. Na Vrumi, todos os
                                        instrutores são verificados antes de serem aprovados.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start bg-card border rounded-lg p-4">
                                <Calendar className="w-6 h-6 text-primary mr-3 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold mb-1">Verifique Disponibilidade</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Certifique-se de que o instrutor tem horários compatíveis com sua rotina.
                                        Flexibilidade é uma das principais vantagens!
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start bg-card border rounded-lg p-4">
                                <MapPin className="w-6 h-6 text-primary mr-3 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold mb-1">Considere a Localização</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Escolha um instrutor que atenda sua região ou que possa buscá-lo.
                                        Isso economiza tempo e facilita a logística.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Como Funciona na Vrumi */}
                    <section className="mb-12 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8">
                        <h2 className="text-3xl font-bold mb-6">Como Funciona na Vrumi?</h2>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Busque Instrutores</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Filtre por localização, preço, avaliações e disponibilidade. Veja perfis completos
                                        com fotos, descrição e avaliações de outros alunos.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Agende sua Aula</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Escolha data e horário diretamente na plataforma. O instrutor confirma e você
                                        recebe todas as informações por e-mail e notificação.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Pague com Segurança</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Pagamento online seguro via cartão de crédito ou PIX. O valor só é repassado
                                        ao instrutor após a aula ser realizada.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                                    4
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Faça sua Aula</h3>
                                    <p className="text-sm text-muted-foreground">
                                        O instrutor te busca no local combinado. Após a aula, você pode avaliar
                                        e deixar um comentário sobre a experiência.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Encontre seu Instrutor Independente
                        </h2>
                        <p className="text-lg mb-6 opacity-90">
                            Mais de 50 instrutores credenciados. Economia, flexibilidade e qualidade garantida.
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

export default InstrutorIndependente;
