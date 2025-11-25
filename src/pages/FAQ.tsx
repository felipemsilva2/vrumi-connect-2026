import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Perguntas Frequentes</h1>
          <p className="text-muted-foreground">
            Encontre respostas para as dúvidas mais comuns sobre nossa plataforma.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left">
              O que é o Vrumi e como funciona?
            </AccordionTrigger>
            <AccordionContent>
              O Vrumi é uma plataforma completa de estudos para obtenção da CNH. Oferecemos materiais didáticos,
              simulados, flashcards e uma biblioteca completa de sinais de trânsito para você estudar e se preparar
              para o exame teórico.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left">
              Como funciona o sistema de assinatura?
            </AccordionTrigger>
            <AccordionContent>
              Oferecemos planos mensais e trimestrais que dão acesso completo a todos os recursos da plataforma.
              Você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left">
              O conteúdo é atualizado de acordo com a legislação vigente?
            </AccordionTrigger>
            <AccordionContent>
              Sim! Nosso conteúdo é constantemente atualizado para refletir as mudanças na legislação de trânsito
              brasileira e nas diretrizes do CONTRAN. Você sempre estará estudando com informações atualizadas.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left">
              Posso acessar o Vrumi pelo celular?
            </AccordionTrigger>
            <AccordionContent>
              Sim! Nossa plataforma é totalmente responsiva e funciona perfeitamente em smartphones, tablets e
              computadores. Você pode estudar de onde estiver, no horário que preferir.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-left">
              Como funcionam os simulados?
            </AccordionTrigger>
            <AccordionContent>
              Os simulados são provas práticas que seguem o formato oficial do exame teórico do DETRAN. Você pode
              fazer quantos simulados quiser e acompanhar seu desempenho ao longo do tempo.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-left">
              O que são flashcards e como usar?
            </AccordionTrigger>
            <AccordionContent>
              Flashcards são cartões de estudo com perguntas de um lado e respostas do outro. Eles utilizam a técnica
              de repetição espaçada para otimizar sua memorização. Nosso sistema identifica automaticamente os tópicos
              que você precisa revisar com mais frequência.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger className="text-left">
              Como funciona a Sala de Estudos com IA?
            </AccordionTrigger>
            <AccordionContent>
              A Sala de Estudos permite que você visualize o material didático em PDF e faça perguntas para nossa IA
              especializada em legislação de trânsito. É como ter um professor particular 24/7 disponível para tirar
              suas dúvidas.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger className="text-left">
              Posso cancelar minha assinatura a qualquer momento?
            </AccordionTrigger>
            <AccordionContent>
              Sim! Você pode cancelar sua assinatura a qualquer momento através das configurações da sua conta.
              Não há multas ou taxas de cancelamento. Você continuará tendo acesso aos recursos até o fim do período pago.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9">
            <AccordionTrigger className="text-left">
              O Vrumi oferece certificado de conclusão?
            </AccordionTrigger>
            <AccordionContent>
              Com a nova lei em vigor a partir de Dezembro/2025, o certificado de conclusão do curso teórico do CFC
              deixou de ser obrigatório para as categorias A e B. Você pode utilizar o Vrumi para se preparar
              de forma autônoma para os exames oficiais do DETRAN, que continuam sendo obrigatórios.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-11">
            <AccordionTrigger className="text-left">
              A autoescola deixou de ser obrigatória?
            </AccordionTrigger>
            <AccordionContent>
              Sim! A lei foi aprovada pelo Presidente e entra em vigor em Dezembro de 2025.
              <br /><br />
              <strong>O que mudou:</strong>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Não é mais obrigatório frequentar aulas teóricas e práticas em Autoescolas (CFCs) para categorias A e B.</li>
                <li>Você tem total liberdade para estudar por conta própria ou com instrutores independentes.</li>
                <li>A economia no processo de habilitação pode chegar a 80%.</li>
                <li>Os exames teórico e prático do DETRAN continuam sendo obrigatórios para garantir sua aptidão.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10">
            <AccordionTrigger className="text-left">
              Como entro em contato com o suporte?
            </AccordionTrigger>
            <AccordionContent>
              Você pode entrar em contato conosco através do email suporte@vrumi.com.br ou através das nossas
              redes sociais. Nossa equipe responde em até 24 horas úteis.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Não encontrou sua resposta?</CardTitle>
            <CardDescription>
              Entre em contato conosco através do email suporte@vrumi.com.br
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      <Footer />
    </>
  );
}
