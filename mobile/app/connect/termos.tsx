import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsOfUseScreen() {
    const { theme } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Termos de Uso</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>Termos de Uso</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Vrumi Connect • Dezembro de 2024</Text>

                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Bem-vindo ao Vrumi Connect! Estes Termos de Uso ("Termos") regem o uso do aplicativo móvel Vrumi Connect ("Aplicativo" ou "Serviço"), operado pela Vrumi Tecnologia LTDA ("Vrumi", "nós" ou "nosso").
                </Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Ao acessar ou usar o Aplicativo, você concorda com estes Termos. Se você não concordar, não utilize o Serviço.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Descrição do Serviço</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    O Vrumi Connect é uma plataforma que conecta alunos a instrutores de direção particulares. O Serviço permite:
                </Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Para Alunos: Buscar, avaliar e agendar aulas práticas de direção com instrutores verificados.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Para Instrutores: Cadastrar-se, definir disponibilidade, aceitar alunos e receber pagamentos.</Text>
                <Text style={[styles.importantBox, { color: theme.textSecondary, borderColor: theme.cardBorder, backgroundColor: theme.card }]}>
                    Importante: A Vrumi é uma plataforma de intermediação. Não somos uma autoescola e não fornecemos diretamente serviços de instrução de direção.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Elegibilidade</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>Para usar o Serviço, você deve:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Ter pelo menos 18 anos de idade.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Possuir capacidade legal para celebrar contratos.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Fornecer informações verdadeiras e precisas no cadastro.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Não ter sido previamente banido da plataforma.</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>2.1 Requisitos Adicionais para Instrutores</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>Instrutores devem:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Possuir CNH válida com permissão para exercer atividade remunerada.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Apresentar documentação exigida para verificação.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Possuir veículo adequado e em conformidade com as normas de trânsito.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Manter seguro veicular vigente.</Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Cadastro e Conta</Text>
                <Text style={[styles.subsectionTitle, { color: theme.text }]}>3.1 Criação de Conta</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>Você é responsável por:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Fornecer informações verdadeiras e atualizadas.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Manter a confidencialidade da sua senha.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Todas as atividades realizadas em sua conta.</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>3.2 Verificação de Instrutores</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Instrutores passam por um processo de verificação que inclui análise de documentos. A aprovação pode levar até 5 dias úteis. A Vrumi reserva-se o direito de recusar ou cancelar cadastros a seu critério.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Agendamento e Aulas</Text>
                <Text style={[styles.subsectionTitle, { color: theme.text }]}>4.1 Agendamento</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Alunos podem agendar aulas diretamente pelo aplicativo.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• O agendamento só é confirmado após o pagamento.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Instrutores devem confirmar presença no início de cada aula via check-in.</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>4.2 Duração das Aulas</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Aulas padrão têm duração de 50 minutos.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Atrasos de qualquer parte reduzem proporcionalmente o tempo de aula.</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>4.3 Cancelamentos</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary, fontWeight: 'bold' }]}>Por Alunos:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Cancelamentos com mais de 24h de antecedência: reembolso integral.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Cancelamentos com menos de 24h: sem reembolso automático (a critério do instrutor).</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary, fontWeight: 'bold', marginTop: 8 }]}>Por Instrutores:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Instrutores devem cancelar com antecedência mínima de 2 horas.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Cancelamentos frequentes podem resultar em suspensão da conta.</Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Pagamentos</Text>
                <Text style={[styles.subsectionTitle, { color: theme.text }]}>5.1 Processamento</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Pagamentos são processados pelo Stripe, nosso parceiro de pagamentos. Aceitamos cartões de crédito e débito. O valor é retido até a conclusão da aula.
                </Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>5.2 Repasse a Instrutores</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    O valor é liberado para o instrutor após confirmação de presença (check-in). A Vrumi retém uma taxa de serviço de 15% sobre cada transação. Repasses são processados semanalmente.
                </Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>5.3 Reembolsos</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Reembolsos são processados em até 10 dias úteis para o método de pagamento original.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Responsabilidades</Text>
                <Text style={[styles.subsectionTitle, { color: theme.text }]}>6.1 Da Vrumi</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Manter a plataforma funcionando de forma estável.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Verificar a documentação básica de instrutores.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Processar pagamentos de forma segura.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Fornecer suporte aos usuários.</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>6.2 Dos Alunos</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Comparecer às aulas no horário agendado.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Tratar instrutores com respeito.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Comunicar cancelamentos com antecedência.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Não solicitar serviços fora da plataforma para evitar a taxa.</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>6.3 Dos Instrutores</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Manter documentação e veículo em dia.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Comparecer às aulas no horário agendado.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Fornecer instrução de qualidade e segura.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Tratar alunos com respeito e profissionalismo.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Realizar o check-in para confirmar a aula.</Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Conduta Proibida</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>É expressamente proibido:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Fornecer informações falsas ou enganosas.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Assediar, ameaçar ou discriminar outros usuários.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Usar a plataforma para atividades ilegais.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Tentar contornar o sistema de pagamentos.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Criar múltiplas contas para burlar sanções.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Compartilhar credenciais de acesso.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Usar automação ou bots para acessar o Serviço.</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary, marginTop: 8 }]}>Violações podem resultar em suspensão ou banimento permanente.</Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>8. Avaliações</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Alunos e instrutores podem avaliar uns aos outros após cada aula.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Avaliações devem ser honestas e baseadas na experiência real.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• A Vrumi pode remover avaliações que violem nossas diretrizes.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Avaliações falsas ou manipuladas são proibidas.</Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>9. Propriedade Intelectual</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    O Aplicativo, marca Vrumi, logotipos e conteúdos são propriedade da Vrumi. Você não pode copiar, modificar ou distribuir nosso conteúdo sem autorização. Ao enviar conteúdo (fotos, avaliações), você nos concede licença para uso na plataforma.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>10. Limitação de Responsabilidade</Text>
                <Text style={[styles.subsectionTitle, { color: theme.text }]}>10.1 Isenção</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>A Vrumi:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Não é responsável pela qualidade das aulas ministradas pelos instrutores.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Não garante resultados específicos (aprovação em exames, etc.).</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Não se responsabiliza por acidentes durante as aulas.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Não é parte no contrato entre aluno e instrutor.</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>10.2 Indenização</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Você concorda em isentar a Vrumi de qualquer reclamação, dano ou despesa decorrente de seu uso do Serviço, violação destes Termos ou disputas com outros usuários.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>11. Modificações</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Podemos modificar estes Termos a qualquer momento. Alterações significativas serão comunicadas com antecedência de 30 dias. O uso continuado após as alterações constitui aceitação dos novos Termos.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>12. Rescisão</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    <Text style={{ fontWeight: 'bold' }}>12.1 Por Você:</Text> Você pode encerrar sua conta a qualquer momento pelo aplicativo (Perfil  Conta  Excluir Conta).
                </Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    <Text style={{ fontWeight: 'bold' }}>12.2 Por Nós:</Text> Podemos suspender ou encerrar sua conta por violação destes Termos, atividade fraudulenta, reclamações recorrentes ou inatividade prolongada.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>13. Disposições Gerais</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    13.1 Lei Aplicável: Estes Termos são regidos pelas leis da República Federativa do Brasil.
                </Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    13.2 Foro: Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>14. Contato</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>Para dúvidas sobre estes Termos:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• E-mail: suporte@vrumi.com.br</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Chat: Disponível no aplicativo em Ajuda e Suporte</Text>

                <Text style={[styles.footer, { color: theme.textMuted }]}>Vrumi Tecnologia LTDA • Brasil</Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 24,
        marginBottom: 12,
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 12,
        textAlign: 'justify',
    },
    bulletPoint: {
        fontSize: 15,
        lineHeight: 24,
        marginLeft: 8,
        marginBottom: 6,
    },
    importantBox: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginVertical: 12,
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    footer: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
});
