import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Keyboard,
    Dimensions,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../src/lib/supabase';
import NotesManager from '../components/notes/NotesManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const QUICK_ACTIONS = [
    { icon: 'bulb', label: 'Simplificar', color: '#3b82f6', prompt: 'Explique o conteúdo que estou vendo como se eu tivesse 10 anos.' },
    { icon: 'flash', label: 'Resumir', color: '#f59e0b', prompt: 'Resuma o conteúdo atual em 3 pontos principais.' },
    { icon: 'help-circle', label: 'Dúvidas', color: '#8b5cf6', prompt: 'Quais são as dúvidas mais comuns sobre este assunto?' },
    { icon: 'school', label: 'Mnemônico', color: '#10b981', prompt: 'Crie uma frase ou mnemônico para me ajudar a memorizar este conteúdo.' },
];

export default function StudyRoomScreen() {
    const { theme, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<'pdf' | 'chat'>('pdf');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pdfError, setPdfError] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(true);
    const [notesVisible, setNotesVisible] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // PDF URL
    const pdfUrl = 'https://owtylihsslimxdiovxia.supabase.co/storage/v1/object/public/materiais/MANUAL-OBTENCAO_2025.pdf';

    const handleGoBack = () => {
        // Navigate to dashboard tab instead of router.back()
        router.replace('/(tabs)');
    };

    const handleSendMessage = async (customMessage?: string) => {
        const messageToSend = customMessage || inputValue.trim();
        if (!messageToSend || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageToSend,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        Keyboard.dismiss();

        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Usuário não autenticado');
            }

            const pdfContext = `O usuário está visualizando o PDF "Manual de Obtenção da CNH" na página ${currentPage} de ${totalPages}. Ele pode estar perguntando sobre o conteúdo dessa página.`;

            const { data, error } = await supabase.functions.invoke('study-chat', {
                body: {
                    message: messageToSend,
                    pdfContext
                },
            });

            if (error) throw error;

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
            };

            setMessages(prev => [...prev, aiResponse]);

            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Desculpe, ocorreu um erro. Tente novamente.',
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAction = (prompt: string) => {
        handleSendMessage(prompt);
        setActiveTab('chat');
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={handleGoBack}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Sala de Estudos</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.headerButton, { backgroundColor: theme.card }]}
                        onPress={() => setNotesVisible(true)}
                    >
                        <Ionicons name="document-text-outline" size={20} color={theme.text} />
                    </TouchableOpacity>
                    {messages.length > 0 && (
                        <TouchableOpacity
                            style={[styles.headerButton, { backgroundColor: theme.card }]}
                            onPress={clearChat}
                        >
                            <Ionicons name="trash-outline" size={20} color={theme.text} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tab Selector */}
            <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'pdf' && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => setActiveTab('pdf')}
                >
                    <Ionicons
                        name="document-text"
                        size={18}
                        color={activeTab === 'pdf' ? '#fff' : theme.textSecondary}
                    />
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'pdf' ? '#fff' : theme.textSecondary }
                    ]}>
                        Manual PDF
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'chat' && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => setActiveTab('chat')}
                >
                    <Ionicons
                        name="chatbubbles"
                        size={18}
                        color={activeTab === 'chat' ? '#fff' : theme.textSecondary}
                    />
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'chat' ? '#fff' : theme.textSecondary }
                    ]}>
                        Chat IA
                    </Text>
                    {messages.length > 0 && (
                        <View style={styles.messageBadge}>
                            <Text style={styles.messageBadgeText}>{messages.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Quick Actions - Visible in Both Tabs */}
            <View style={styles.quickActionsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickActionsScroll}
                >
                    {QUICK_ACTIONS.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.quickActionButton, { backgroundColor: action.color }]}
                            onPress={() => handleQuickAction(action.prompt)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={action.icon as any} size={20} color="#fff" />
                            <Text style={styles.quickActionText}>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            {activeTab === 'pdf' ? (
                <View style={styles.pdfContainer}>
                    {pdfLoading && (
                        <View style={[styles.pdfLoadingOverlay, { backgroundColor: theme.background }]}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                                Carregando Manual...
                            </Text>
                        </View>
                    )}

                    {pdfError ? (
                        <View style={[styles.pdfPlaceholder, { backgroundColor: theme.card }]}>
                            <Ionicons name="alert-circle" size={48} color="#ef4444" />
                            <Text style={[styles.pdfTitle, { color: theme.text, marginTop: 16 }]}>
                                Erro ao carregar PDF
                            </Text>
                            <TouchableOpacity
                                style={[styles.retryButton, { borderColor: theme.cardBorder, marginTop: 16 }]}
                                onPress={() => {
                                    setPdfError(false);
                                    setPdfLoading(true);
                                }}
                            >
                                <Ionicons name="refresh" size={18} color={theme.text} />
                                <Text style={[styles.retryButtonText, { color: theme.text }]}>Tentar Novamente</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <WebView
                            source={{
                                uri: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`
                            }}
                            style={styles.pdf}
                            onLoadStart={() => setPdfLoading(true)}
                            onLoadEnd={() => setPdfLoading(false)}
                            onError={() => {
                                setPdfError(true);
                                setPdfLoading(false);
                            }}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            startInLoadingState={true}
                            scalesPageToFit={true}
                            allowsFullscreenVideo={false}
                        />
                    )}
                </View>
            ) : (
                <KeyboardAvoidingView
                    style={styles.chatContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={100}
                >
                    {/* Messages */}
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {messages.length === 0 ? (
                            <View style={styles.emptyChat}>
                                <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '20' }]}>
                                    <Ionicons name="chatbubbles-outline" size={48} color={theme.primary} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                    Tire suas dúvidas
                                </Text>
                                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                                    Pergunte sobre o conteúdo do manual ou use as ações rápidas acima!
                                </Text>

                                {/* Suggested Questions */}
                                <View style={styles.suggestedQuestions}>
                                    <Text style={[styles.suggestedTitle, { color: theme.textMuted }]}>
                                        Sugestões:
                                    </Text>
                                    {[
                                        'O que é o CTB?',
                                        'Quais são as categorias de CNH?',
                                        'O que são infrações gravíssimas?',
                                    ].map((question, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.suggestedButton, { backgroundColor: theme.card }]}
                                            onPress={() => handleSendMessage(question)}
                                        >
                                            <Ionicons name="chatbubble-outline" size={16} color={theme.primary} />
                                            <Text style={[styles.suggestedText, { color: theme.text }]}>
                                                {question}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            messages.map((message) => (
                                <View
                                    key={message.id}
                                    style={[
                                        styles.messageBubble,
                                        message.role === 'user'
                                            ? [styles.userMessage, { backgroundColor: theme.primary }]
                                            : [styles.assistantMessage, { backgroundColor: theme.card }]
                                    ]}
                                >
                                    {message.role === 'assistant' && (
                                        <View style={styles.assistantHeader}>
                                            <View style={[styles.assistantIconBg, { backgroundColor: theme.primary + '20' }]}>
                                                <Ionicons name="sparkles" size={12} color={theme.primary} />
                                            </View>
                                            <Text style={[styles.assistantLabel, { color: theme.primary }]}>
                                                Assistente IA
                                            </Text>
                                        </View>
                                    )}
                                    <Text style={[
                                        styles.messageText,
                                        { color: message.role === 'user' ? '#fff' : theme.text }
                                    ]}>
                                        {message.content}
                                    </Text>
                                </View>
                            ))
                        )}

                        {isLoading && (
                            <View style={[styles.loadingBubble, { backgroundColor: theme.card }]}>
                                <ActivityIndicator size="small" color={theme.primary} />
                                <Text style={[styles.loadingBubbleText, { color: theme.textSecondary }]}>
                                    Pensando...
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Input */}
                    <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Digite sua pergunta..."
                                placeholderTextColor={theme.textMuted}
                                value={inputValue}
                                onChangeText={setInputValue}
                                multiline
                                maxLength={500}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    { backgroundColor: inputValue.trim() ? theme.primary : theme.primary + '50' }
                                ]}
                                onPress={() => handleSendMessage()}
                                disabled={!inputValue.trim() || isLoading}
                            >
                                <Ionicons name="send" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            )}

            {/* Notes Manager */}
            <NotesManager
                visible={notesVisible}
                onClose={() => setNotesVisible(false)}
            />
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
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 4,
        marginBottom: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    messageBadge: {
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    messageBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    // Quick Actions - Prominent at Top
    quickActionsWrapper: {
        paddingBottom: 12,
    },
    quickActionsScroll: {
        paddingHorizontal: 16,
        gap: 10,
    },
    quickActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    pdfContainer: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    pdfLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    pdfPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 16,
        borderRadius: 24,
        padding: 32,
    },
    pdfIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    pdfTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    pdfSubtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    openPdfButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderRadius: 16,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    openPdfButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
        marginTop: 16,
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    loadingHint: {
        fontSize: 13,
        marginTop: 8,
    },
    pdfHint: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 16,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '500',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: 'transparent',
    },
    pageIndicator: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    pageIndicatorText: {
        fontSize: 12,
        fontWeight: '600',
    },
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 24,
    },
    emptyChat: {
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 22,
    },
    suggestedQuestions: {
        marginTop: 32,
        width: '100%',
        gap: 10,
    },
    suggestedTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    suggestedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 10,
    },
    suggestedText: {
        fontSize: 15,
        flex: 1,
    },
    messageBubble: {
        maxWidth: '88%',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
    },
    userMessage: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    assistantMessage: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    assistantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    assistantIconBg: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    assistantLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderRadius: 18,
        padding: 14,
        gap: 10,
    },
    loadingBubbleText: {
        fontSize: 14,
    },
    inputContainer: {
        padding: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 26,
        borderWidth: 1,
        paddingLeft: 18,
        paddingRight: 6,
        paddingVertical: 6,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        paddingVertical: 10,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
