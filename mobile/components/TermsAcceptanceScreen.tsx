import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useConsent } from '../hooks/useConsent';
import Checkbox from 'expo-checkbox';
import * as WebBrowser from 'expo-web-browser';

interface TermsAcceptanceScreenProps {
    onComplete: () => void;
}

export default function TermsAcceptanceScreen({ onComplete }: TermsAcceptanceScreenProps) {
    const { theme } = useTheme();
    const { recordConsent } = useConsent();

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [marketingAccepted, setMarketingAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const canProceed = termsAccepted && privacyAccepted;

    const handleOpenTerms = async () => {
        try {
            await WebBrowser.openBrowserAsync('https://vrumi.com.br/termos-de-uso');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível abrir os termos.');
        }
    };

    const handleOpenPrivacy = async () => {
        try {
            await WebBrowser.openBrowserAsync('https://vrumi.com.br/politica-de-privacidade');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível abrir a política de privacidade.');
        }
    };

    const handleAccept = async () => {
        if (!canProceed) return;

        setLoading(true);

        try {
            // Record required consents
            const termsSuccess = await recordConsent('terms', {
                source: 'onboarding',
                platform: 'mobile',
            });

            const privacySuccess = await recordConsent('privacy', {
                source: 'onboarding',
                platform: 'mobile',
            });

            if (!termsSuccess || !privacySuccess) {
                throw new Error('Falha ao registrar consentimento');
            }

            // Record optional marketing consent if accepted
            if (marketingAccepted) {
                await recordConsent('marketing', {
                    source: 'onboarding',
                    platform: 'mobile',
                });
            }

            // Success - proceed to app
            onComplete();
        } catch (error: any) {
            console.error('Error recording consent:', error);
            Alert.alert(
                'Erro',
                'Não foi possível registrar seu consentimento. Por favor, tente novamente.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="shield-checkmark" size={48} color={theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>
                        Bem-vindo ao Vrumi!
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Para continuar, precisamos que você leia e aceite nossos termos e políticas.
                    </Text>
                </View>

                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
                    <View style={styles.infoRow}>
                        <Ionicons name="lock-closed" size={20} color={theme.primary} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            Seus dados estão protegidos de acordo com a LGPD
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="eye-off" size={20} color={theme.primary} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            Não compartilhamos suas informações com terceiros
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            Você pode revogar seu consentimento a qualquer momento
                        </Text>
                    </View>
                </View>

                {/* Required Consents */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Documentos Obrigatórios
                    </Text>

                    {/* Terms of Use */}
                    <TouchableOpacity
                        style={[styles.consentCard, { backgroundColor: theme.card }]}
                        onPress={() => setTermsAccepted(!termsAccepted)}
                        activeOpacity={0.7}
                    >
                        <Checkbox
                            value={termsAccepted}
                            onValueChange={setTermsAccepted}
                            color={termsAccepted ? theme.primary : undefined}
                            style={styles.checkbox}
                        />
                        <View style={styles.consentTextContainer}>
                            <Text style={[styles.consentTitle, { color: theme.text }]}>
                                Termos de Uso
                            </Text>
                            <Text style={[styles.consentDescription, { color: theme.textSecondary }]}>
                                Li e aceito os Termos de Uso do Vrumi Connect
                            </Text>
                            <TouchableOpacity onPress={handleOpenTerms} style={styles.linkButton}>
                                <Text style={[styles.linkText, { color: theme.primary }]}>
                                    Ler documento completo
                                </Text>
                                <Ionicons name="open-outline" size={14} color={theme.primary} />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>

                    {/* Privacy Policy */}
                    <TouchableOpacity
                        style={[styles.consentCard, { backgroundColor: theme.card }]}
                        onPress={() => setPrivacyAccepted(!privacyAccepted)}
                        activeOpacity={0.7}
                    >
                        <Checkbox
                            value={privacyAccepted}
                            onValueChange={setPrivacyAccepted}
                            color={privacyAccepted ? theme.primary : undefined}
                            style={styles.checkbox}
                        />
                        <View style={styles.consentTextContainer}>
                            <Text style={[styles.consentTitle, { color: theme.text }]}>
                                Política de Privacidade
                            </Text>
                            <Text style={[styles.consentDescription, { color: theme.textSecondary }]}>
                                Li e aceito a Política de Privacidade
                            </Text>
                            <TouchableOpacity onPress={handleOpenPrivacy} style={styles.linkButton}>
                                <Text style={[styles.linkText, { color: theme.primary }]}>
                                    Ler documento completo
                                </Text>
                                <Ionicons name="open-outline" size={14} color={theme.primary} />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Optional Consents */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Preferências Opcionais
                    </Text>

                    {/* Marketing */}
                    <TouchableOpacity
                        style={[styles.consentCard, { backgroundColor: theme.card }]}
                        onPress={() => setMarketingAccepted(!marketingAccepted)}
                        activeOpacity={0.7}
                    >
                        <Checkbox
                            value={marketingAccepted}
                            onValueChange={setMarketingAccepted}
                            color={marketingAccepted ? theme.primary : undefined}
                            style={styles.checkbox}
                        />
                        <View style={styles.consentTextContainer}>
                            <Text style={[styles.consentTitle, { color: theme.text }]}>
                                Comunicações de Marketing
                            </Text>
                            <Text style={[styles.consentDescription, { color: theme.textSecondary }]}>
                                Aceito receber novidades, promoções e dicas por email e notificações
                            </Text>
                            <Text style={[styles.optionalBadge, { color: theme.textMuted }]}>
                                Opcional
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* LGPD Notice */}
                <View style={[styles.lgpdNotice, { backgroundColor: theme.card }]}>
                    <Ionicons name="information-circle" size={20} color={theme.primary} />
                    <Text style={[styles.lgpdText, { color: theme.textSecondary }]}>
                        De acordo com a LGPD, você tem direito a acessar, corrigir, excluir ou
                        exportar seus dados a qualquer momento através das configurações de privacidade.
                    </Text>
                </View>
            </ScrollView>

            {/* Accept Button */}
            <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.cardBorder }]}>
                <TouchableOpacity
                    style={[
                        styles.acceptButton,
                        { backgroundColor: canProceed ? theme.primary : theme.cardBorder },
                    ]}
                    onPress={handleAccept}
                    disabled={!canProceed || loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.acceptButtonText}>
                                Aceitar e Continuar
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>

                {!canProceed && (
                    <Text style={[styles.footerHint, { color: theme.textMuted }]}>
                        Você precisa aceitar os documentos obrigatórios para continuar
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 120,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    infoCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    consentCard: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 12,
    },
    checkbox: {
        marginTop: 2,
    },
    consentTextContainer: {
        flex: 1,
    },
    consentTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    consentDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '500',
    },
    optionalBadge: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 4,
    },
    lgpdNotice: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginTop: 8,
    },
    lgpdText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 32,
        borderTopWidth: 1,
        gap: 12,
    },
    acceptButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footerHint: {
        fontSize: 13,
        textAlign: 'center',
    },
});
