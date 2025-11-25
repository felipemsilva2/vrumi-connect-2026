import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PoliticaPrivacidade() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
            <p>
              A Vrumi ("nós", "nosso" ou "plataforma") está comprometida em proteger sua privacidade. Esta Política
              de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você
              usa nossa plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Informações que Coletamos</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Informações Fornecidas por Você</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Informações de pagamento (processadas por provedores terceirizados seguros)</li>
              <li>Informações de perfil opcionais (foto, preferências de estudo)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Informações Coletadas Automaticamente</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dados de uso (páginas visitadas, tempo de estudo, progresso nos materiais)</li>
              <li>Informações do dispositivo (tipo de dispositivo, sistema operacional, navegador)</li>
              <li>Endereço IP e dados de localização aproximada</li>
              <li>Cookies e tecnologias similares</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Como Usamos Suas Informações</h2>
            <p>Usamos suas informações para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Fornecer, operar e manter nossos serviços</li>
              <li>Processar pagamentos e gerenciar assinaturas</li>
              <li>Personalizar sua experiência de aprendizado</li>
              <li>Enviar atualizações, avisos e comunicações administrativas</li>
              <li>Analisar o uso da plataforma para melhorar nossos serviços</li>
              <li>Detectar, prevenir e resolver problemas técnicos ou de segurança</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Compartilhamento de Informações</h2>
            <p>Não vendemos suas informações pessoais. Podemos compartilhar suas informações com:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Provedores de Serviços:</strong> Empresas terceirizadas que nos ajudam a operar a plataforma
                (hospedagem, processamento de pagamentos, análise de dados)
              </li>
              <li>
                <strong>Requisitos Legais:</strong> Quando exigido por lei ou para proteger nossos direitos legais
              </li>
              <li>
                <strong>Transferências Comerciais:</strong> Em caso de fusão, aquisição ou venda de ativos
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Seus Direitos e Escolhas</h2>
            <p>De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem direito a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Acessar suas informações pessoais</li>
              <li>Corrigir dados imprecisos ou incompletos</li>
              <li>Solicitar a exclusão de suas informações</li>
              <li>Revogar consentimento para processamento de dados</li>
              <li>Portabilidade de dados para outro fornecedor</li>
              <li>Informações sobre compartilhamento de dados</li>
            </ul>
            <p className="mt-4">
              Para exercer esses direitos, entre em contato através do email: privacidade@vrumi.com.br
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Cookies e Tecnologias Similares</h2>
            <p>
              Usamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso da plataforma e
              personalizar conteúdo. Você pode controlar o uso de cookies através das configurações do seu navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Segurança de Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra
              acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhum método de transmissão
              pela internet é 100% seguro.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Retenção de Dados</h2>
            <p>
              Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos
              nesta política, a menos que um período de retenção maior seja exigido ou permitido por lei.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Menores de Idade</h2>
            <p>
              Nossos serviços são destinados a pessoas com 18 anos ou mais. Se você tem menos de 18 anos, deve ter
              o consentimento dos seus responsáveis legais para usar a plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas
              através da plataforma ou por e-mail. O uso continuado após as alterações constitui aceitação da política
              atualizada.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
            <p>
              Para questões sobre esta Política de Privacidade ou sobre como tratamos seus dados pessoais, entre em
              contato conosco:
            </p>
            <ul className="list-none mt-4 space-y-2">
              <li>Email: <a href="mailto:privacidade@vrumi.com.br" className="text-primary">privacidade@vrumi.com.br</a></li>
              <li>Encarregado de Dados (DPO): dpo@vrumi.com.br</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
