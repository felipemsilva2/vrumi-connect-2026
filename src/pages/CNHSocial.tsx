import { EligibilityChecker } from "@/components/cnh-social/EligibilityChecker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, CheckCircle, HelpCircle, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import MinimalModernHero from "@/components/ui/minimal";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";

const STATE_LINKS = [
    { uf: "AC", name: "Acre", url: "https://www.ac.getran.com.br/site/apps/hotsite-cnh-social-ac/" },
    { uf: "AL", name: "Alagoas", url: "https://alagoasdigital.al.gov.br/servico/3063" },
    { uf: "AM", name: "Amazonas", url: "https://detrancidadao.am.gov.br/#cnh-social" },
    { uf: "BA", name: "Bahia", url: "https://www.ba.gov.br/servico/detran/solicitar-cnh-da-gente" },
    { uf: "CE", name: "Ceará", url: "https://educacao.detran.ce.gov.br/cnh-popular/" },
    { uf: "DF", name: "Distrito Federal", url: "https://www.sedes.df.gov.br/w/cnh-social" },
    { uf: "ES", name: "Espírito Santo", url: "https://detran.es.gov.br/cnhsocial" },
    { uf: "GO", name: "Goiás", url: "https://goias.gov.br/detran/cnh-social/" },
    { uf: "MT", name: "Mato Grosso", url: "https://www.detran.mt.gov.br/ser-familia-cnh-social" },
    { uf: "MS", name: "Mato Grosso do Sul", url: "https://www2.meudetran.ms.gov.br/habilitacao.php" },
    { uf: "PA", name: "Pará", url: "https://cnhpd.detran.pa.gov.br/index.xhtml" },
    { uf: "PB", name: "Paraíba", url: "https://habilitacaosocial.pb.gov.br/" },
    { uf: "RN", name: "Rio Grande do Norte", url: "https://cnhpopular.detran.rn.gov.br/" },
    { uf: "RS", name: "Rio Grande do Sul", url: "https://cnhsocial.detran.rs.gov.br/" },
    { uf: "RO", name: "Rondônia", url: "https://cnhsocial.detran.ro.gov.br/" },
    { uf: "RR", name: "Roraima", url: "https://www.detran.rr.gov.br/" },
    { uf: "SE", name: "Sergipe", url: "https://www.detran.se.gov.br/portal/?pg=cnh_social_acompanhamento" },
];

export default function CNHSocial() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            {/* Hero Section */}
            <MinimalModernHero
                logo={<div className="flex items-center gap-2"></div>}
                badge="PROGRAMA CNH SOCIAL 2026"
                title="Sua habilitação gratuita."
                subtitle="Entenda o programa e verifique se você tem direito ao benefício."
                description="A CNH Social é um programa governamental que permite a emissão da Carteira Nacional de Habilitação de forma totalmente gratuita para pessoas de baixa renda."
                accentColor="#10b981"
                className="pt-20"
            />

            <div className="max-w-6xl mx-auto px-4 -mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-20">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">

                    {/* What is it? */}
                    <Card className="shadow-lg border border-border/50 bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <HelpCircle className="text-primary" />
                                O que é a CNH Social?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground space-y-4 leading-relaxed">
                            <p>
                                A CNH Social é um programa governamental que permite a emissão da Carteira Nacional de Habilitação (CNH) de forma totalmente gratuita para pessoas de baixa renda.
                            </p>
                            <p>
                                Recentemente, uma nova lei federal foi sancionada para expandir e padronizar o benefício, mas a implementação prática ainda depende dos Detrans de cada estado.
                            </p>
                            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                <h3 className="font-semibold text-primary mb-2">O que o programa cobre?</h3>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Exames médicos e psicológicos</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Aulas teóricas e práticas</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Taxas do Detran</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Provas teóricas e práticas</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Emissão do documento</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* States List */}
                    <Card className="shadow-lg border border-border/50 bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <MapPin className="text-primary" />
                                Estados Participantes
                            </CardTitle>
                            <CardDescription>
                                Confira a lista de estados que já possuem programas ativos ou em implementação.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {STATE_LINKS.map((state) => (
                                    <Button
                                        key={state.uf}
                                        variant="outline"
                                        className="justify-start h-auto py-3 px-4 hover:bg-primary/5 hover:scale-[1.02] hover:shadow-md transition-transform duration-200"
                                        asChild
                                    >
                                        <a href={state.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                                            <span className="font-bold text-primary w-8">{state.uf}</span>
                                            <span className="flex-1 text-left truncate">{state.name}</span>
                                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                        </a>
                                    </Button>
                                ))}
                            </div>
                            <p className="text-xs text-center text-muted-foreground mt-6">
                                * A disponibilidade de vagas e períodos de inscrição variam conforme o estado.
                            </p>
                        </CardContent>
                    </Card>

                    {/* FAQ */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-foreground px-2">Perguntas Frequentes</h2>
                        <Accordion type="single" collapsible className="w-full bg-card rounded-xl shadow-sm px-4 border border-border/50">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Quem tem direito à CNH Social?</AccordionTrigger>
                                <AccordionContent>
                                    Geralmente, o programa é destinado a pessoas com mais de 18 anos, inscritas no CadÚnico, com renda familiar per capita de até meio salário mínimo. É necessário saber ler e escrever.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Posso usar a CNH Social para trabalhar?</AccordionTrigger>
                                <AccordionContent>
                                    Sim! A CNH emitida pelo programa é idêntica à comum e tem a mesma validade legal. Você pode exercer atividade remunerada (EAR) normalmente, desde que cumpra os requisitos da categoria.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>O exame toxicológico é gratuito?</AccordionTrigger>
                                <AccordionContent>
                                    Para as categorias A e B (moto e carro), o exame toxicológico não é exigido. Para categorias C, D e E, ele é obrigatório, mas a cobertura do custo depende das regras específicas do edital do seu estado.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                </div>

                {/* Sidebar / Checker */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="sticky top-24">
                        <EligibilityChecker />

                        <div className="mt-6 bg-card p-6 rounded-xl shadow-md border border-border/50">
                            <h3 className="font-bold text-lg mb-2">Ainda tem dúvidas?</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Nossa equipe preparou um guia completo de estudos para te ajudar a passar na prova de primeira.
                            </p>
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                                <Link to="/painel">Ir para o Dashboard</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
