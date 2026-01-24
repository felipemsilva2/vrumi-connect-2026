import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyTextScreen() {
    const { theme } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Política de Privacidade</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>Política de Privacidade</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Vrumi Connect • Dezembro de 2024</Text>

                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    A Vrumi ("nós", "nosso" ou "Vrumi") opera o aplicativo móvel Vrumi Connect. Esta página informa sobre nossas políticas relativas à coleta, uso e divulgação de dados pessoais quando você usa nosso Serviço.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Dados que Coletamos</Text>
                <Text style={[styles.subsectionTitle, { color: theme.text }]}>1.1 Dados de Cadastro</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>Quando você cria uma conta, coletamos:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Nome completo</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Endereço de e-mail</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Número de telefone (opcional)</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Foto de perfil (opcional)</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>1.2 Dados de Instrutores</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>Se você se cadastrar como instrutor, também coletamos:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• CPF (para verificação de identidade)</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• CNH (Carteira Nacional de Habilitação)</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Comprovante de residência</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Dados bancários para recebimento de pagamentos</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Informações do veículo (modelo, placa, ano)</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>1.3 Dados de Uso</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>Coletamos automaticamente:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Informações do dispositivo (modelo, sistema operacional)</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Logs de acesso e navegação no aplicativo</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Histórico de aulas agendadas e realizadas</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Mensagens trocadas pelo chat interno</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>1.4 Dados de Pagamento</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Para processar transações, utilizamos o Stripe como processador de pagamentos. Os dados de cartão são processados diretamente pelo Stripe e não são armazenados em nossos servidores.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Como Usamos seus Dados</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>Utilizamos os dados coletados para:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Fornecer o Serviço: Conectar alunos a instrutores, processar agendamentos e pagamentos.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Verificação: Validar a identidade e credenciais de instrutores.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Comunicação: Enviar notificações sobre aulas, lembretes e atualizações do serviço.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Suporte: Responder a dúvidas e solucionar problemas.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Melhorias: Analisar o uso do aplicativo para aprimorar a experiência.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Segurança: Detectar e prevenir fraudes ou atividades suspeitas.</Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Compartilhamento de Dados</Text>
                <Text style={[styles.subsectionTitle, { color: theme.text }]}>3.1 Entre Usuários</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Alunos podem ver: nome, foto, cidade, avaliações e disponibilidade dos instrutores.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Instrutores podem ver: nome e foto dos alunos que agendaram aulas.</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>3.2 Terceiros</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>Compartilhamos dados com:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Stripe: Para processamento de pagamentos.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Supabase: Infraestrutura de banco de dados (servidores seguros).</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Expo: Para entrega de notificações push.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Autoridades: Quando exigido por lei ou ordem judicial.</Text>
                <Text style={[styles.importantBox, { color: theme.textSecondary, borderColor: theme.cardBorder, backgroundColor: theme.card }]}>
                    Não vendemos seus dados pessoais a terceiros.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Armazenamento e Segurança</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Seus dados são armazenados em servidores seguros da Supabase.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Utilizamos criptografia SSL/TLS para transmissão de dados.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Senhas são armazenadas com hash seguro (bcrypt).</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Acesso aos dados é restrito a funcionários autorizados.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Realizamos backups regulares para proteção contra perda de dados.</Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Seus Direitos (LGPD)</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
                </Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Acesso: Solicitar uma cópia dos seus dados pessoais.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Correção: Atualizar dados incorretos ou incompletos.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Exclusão: Solicitar a remoção dos seus dados.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Portabilidade: Receber seus dados em formato estruturado.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Revogação: Retirar seu consentimento a qualquer momento.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Oposição: Opor-se ao tratamento de seus dados.</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary, marginTop: 8 }]}>
                    Para exercer esses direitos, entre em contato pelo e-mail: suporte@vrumi.com.br
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Exclusão de Conta</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>Você pode excluir sua conta a qualquer momento através do aplicativo:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>1. Acesse seu Perfil</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>2. Vá em Conta</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>3. Toque em Excluir Conta</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>4. Confirme a exclusão</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary, marginTop: 12, fontWeight: 'bold' }]}>Ao excluir sua conta:</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Todos os seus dados pessoais serão removidos permanentemente.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Histórico de aulas e mensagens serão apagados.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Esta ação é irreversível.</Text>
                <Text style={[styles.paragraph, { color: theme.textMuted, fontStyle: 'italic', marginTop: 8, fontSize: 13 }]}>
                    Nota: Podemos reter alguns dados por obrigação legal (ex: registros fiscais de transações) pelo período exigido por lei.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Cookies e Tecnologias Similares</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    O aplicativo móvel não utiliza cookies. Para o site web, utilizamos:
                </Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Cookies essenciais para funcionamento do site.</Text>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• Analytics para entender o comportamento dos visitantes.</Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>8. Menores de Idade</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Nosso Serviço não é destinado a menores de 18 anos. Não coletamos intencionalmente dados de menores. Se você é pai/responsável e acredita que seu filho nos forneceu dados pessoais, entre em contato conosco.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>9. Alterações nesta Política</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre alterações significativas por e-mail ou notificação no aplicativo. O uso continuado do Serviço após as alterações constitui aceitação da nova política.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>10. Contato</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato:</Text>
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
