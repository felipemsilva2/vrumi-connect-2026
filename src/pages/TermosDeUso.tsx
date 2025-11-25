import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermosDeUso() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Termos de Uso</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar a plataforma Vrumi, você concorda em cumprir e estar vinculado a estes Termos de Uso.
              Se você não concorda com qualquer parte destes termos, não deve usar nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p>
              O Vrumi é uma plataforma educacional online que oferece materiais de estudo, simulados, flashcards e
              outros recursos para auxiliar candidatos na preparação para o exame teórico de habilitação (CNH).
            </p>
            <p className="mt-4">
              <strong>Importante:</strong> Conforme a nova legislação aprovada, em vigor a partir de Dezembro/2025,
              o curso teórico e prático em CFC (Autoescola) deixou de ser obrigatório para as categorias A e B.
              O Vrumi oferece todo o suporte necessário para seu estudo autônomo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cadastro e Conta de Usuário</h2>
            <p>Para utilizar nossos serviços, você deve:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Ter pelo menos 18 anos de idade ou consentimento dos responsáveis legais</li>
              <li>Fornecer informações verdadeiras, precisas e completas durante o registro</li>
              <li>Manter a segurança de sua senha e aceitar toda a responsabilidade por atividades em sua conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Assinatura e Pagamentos</h2>
            <p>
              O acesso completo aos recursos da plataforma requer uma assinatura paga. Os termos específicos de
              pagamento, renovação e cancelamento são apresentados claramente no momento da contratação.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>As assinaturas são renovadas automaticamente a menos que sejam canceladas</li>
              <li>Você pode cancelar sua assinatura a qualquer momento através das configurações da conta</li>
              <li>Não oferecemos reembolsos proporcionais para cancelamentos no meio do período de assinatura</li>
              <li>Reservamo-nos o direito de modificar nossos preços mediante aviso prévio</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo disponível na plataforma Vrumi, incluindo textos, gráficos, logos, imagens, vídeos,
              áudio e software, é de propriedade exclusiva do Vrumi ou de seus licenciadores e é protegido por leis
              de direitos autorais.
            </p>
            <p className="mt-4">
              Você não pode copiar, reproduzir, distribuir, publicar, exibir, executar, modificar ou criar trabalhos
              derivados sem autorização prévia por escrito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Uso Aceitável</h2>
            <p>Ao usar nossos serviços, você concorda em NÃO:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Compartilhar sua conta com terceiros</li>
              <li>Usar a plataforma para fins comerciais sem autorização</li>
              <li>Fazer engenharia reversa ou tentar extrair código-fonte</li>
              <li>Interferir ou interromper a integridade ou desempenho da plataforma</li>
              <li>Transmitir vírus, malware ou qualquer código malicioso</li>
              <li>Violar quaisquer leis locais, estaduais ou nacionais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitação de Responsabilidade</h2>
            <p>
              O Vrumi não garante que os serviços serão ininterruptos ou livres de erros. Não nos responsabilizamos
              por resultados específicos no exame de habilitação ou por quaisquer danos diretos, indiretos,
              incidentais ou consequenciais decorrentes do uso da plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Modificações dos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor
              imediatamente após sua publicação na plataforma. O uso continuado de nossos serviços após as alterações
              constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Rescisão</h2>
            <p>
              Podemos suspender ou encerrar sua conta e acesso aos serviços a qualquer momento, sem aviso prévio,
              se acreditarmos que você violou estes Termos de Uso.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Lei Aplicável</h2>
            <p>
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas
              relacionadas a estes termos serão resolvidas nos tribunais brasileiros competentes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
            <p>
              Para questões sobre estes Termos de Uso, entre em contato conosco através do email:
              <a href="mailto:juridico@vrumi.com.br" className="text-primary ml-1">juridico@vrumi.com.br</a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
