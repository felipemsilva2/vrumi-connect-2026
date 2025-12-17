import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Linking,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';

// Tawk.to IDs
const TAWK_PROPERTY_ID = '6942b52104b74e19810b0a1e';
const TAWK_WIDGET_ID = '1jcm972ol';

const FAQ_ITEMS = [
    {
        question: 'Como agendar uma aula?',
        answer: 'Na aba "Buscar", encontre um instrutor, clique em "Ver perfil" e escolha um horário disponível. Confirme o agendamento e pronto!',
    },
    {
        question: 'Como cancelar uma aula?',
        answer: 'Vá em "Minhas Aulas", encontre a aula que deseja cancelar e clique em "Cancelar". Cancelamentos devem ser feitos com pelo menos 24h de antecedência.',
    },
    {
        question: 'Como funciona o pagamento?',
        answer: 'O pagamento é feito diretamente pelo app via cartão de crédito ou PIX. O valor só é liberado para o instrutor após a aula ser realizada.',
    },
    {
        question: 'Como me tornar um instrutor?',
        answer: 'No seu perfil, clique em "Quero ser instrutor" e preencha o cadastro com seus documentos. Após a verificação, você estará apto a receber alunos.',
    },
    {
        question: 'Como funciona o check-in da aula?',
        answer: 'No início da aula, o instrutor gera um QR Code que o aluno escaneia. Isso confirma a presença de ambos e inicia a aula oficialmente.',
    },
];

export default function SuporteScreen() {
    const { theme, isDark } = useTheme();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [chatLoading, setChatLoading] = useState(true);

    const handleWhatsApp = () => {
        const phone = '5511999999999'; // TODO: Replace with real number
        const message = encodeURIComponent('Olá! Preciso de ajuda com o app Vrumi.');
        Linking.openURL(`https://wa.me/${phone}?text=${message}`);
    };

    const handleEmail = () => {
        Linking.openURL('mailto:suporte@vrumi.com.br?subject=Suporte%20Vrumi');
    };

    // Direct Tawk.to chat URL
    const tawkUrl = `https://tawk.to/chat/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;

    // Chat WebView Screen
    if (showChat) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <SafeAreaView style={[styles.chatHeader, { backgroundColor: theme.card }]} edges={['top']}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            setShowChat(false);
                            setChatLoading(true);
                        }}
                    >
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.chatHeaderTitle, { color: theme.text }]}>Chat ao Vivo</Text>
                    <View style={{ width: 40 }} />
                </SafeAreaView>

                {chatLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                            Conectando ao suporte...
                        </Text>
                    </View>
                )}

                <WebView
                    source={{ uri: tawkUrl }}
                    style={{ flex: 1 }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    thirdPartyCookiesEnabled={true}
                    sharedCookiesEnabled={true}
                    onLoadEnd={() => setChatLoading(false)}
                    onError={() => setChatLoading(false)}
                    startInLoadingState={false}
                    userAgent="Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.card }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Ajuda e Suporte</Text>
                <View style={{ width: 40 }} />
            </SafeAreaView>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Fale Conosco</Text>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: '#10b981' }]}
                        onPress={() => setShowChat(true)}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name="chatbubbles" size={28} color="#fff" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Chat ao Vivo</Text>
                            <Text style={styles.actionSubtitle}>Fale agora com nossa equipe</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionCardSmall, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                            onPress={handleWhatsApp}
                        >
                            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                            <Text style={[styles.actionCardSmallText, { color: theme.text }]}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCardSmall, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                            onPress={handleEmail}
                        >
                            <Ionicons name="mail" size={24} color="#10b981" />
                            <Text style={[styles.actionCardSmallText, { color: theme.text }]}>E-mail</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Perguntas Frequentes</Text>

                    {FAQ_ITEMS.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                            onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={[styles.faqQuestion, { color: theme.text }]}>
                                    {item.question}
                                </Text>
                                <Ionicons
                                    name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={theme.textSecondary}
                                />
                            </View>
                            {expandedFaq === index && (
                                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                                    {item.answer}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* App Info */}
                <View style={[styles.appInfo, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Ionicons name="information-circle-outline" size={24} color={theme.textMuted} />
                    <View style={styles.appInfoText}>
                        <Text style={[styles.appInfoTitle, { color: theme.textSecondary }]}>Vrumi Connect</Text>
                        <Text style={[styles.appInfoVersion, { color: theme.textMuted }]}>Versão 1.0.0</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
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
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    chatHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionContent: {
        flex: 1,
        marginLeft: 14,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    actionSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCardSmall: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    actionCardSmallText: {
        fontSize: 14,
        fontWeight: '600',
    },
    faqCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        marginRight: 12,
    },
    faqAnswer: {
        fontSize: 14,
        lineHeight: 22,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    appInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    appInfoText: {
        flex: 1,
    },
    appInfoTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    appInfoVersion: {
        fontSize: 12,
        marginTop: 2,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
});
