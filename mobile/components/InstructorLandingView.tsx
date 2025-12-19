import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function InstructorLandingView() {
    const { theme, isDark } = useTheme();

    const benefits = [
        {
            icon: 'cash-outline',
            title: 'Renda Extra',
            description: 'Ganhe dinheiro ensinando motoristas com seu próprio carro.',
            color: '#10b981',
        },
        {
            icon: 'calendar-outline',
            title: 'Horário Flexível',
            description: 'Você define sua agenda e disponibilidade.',
            color: '#3b82f6',
        },
        {
            icon: 'shield-checkmark-outline',
            title: 'Segurança',
            description: 'Processo verificado e pagamento garantido.',
            color: '#8b5cf6',
        },
        {
            icon: 'people-outline',
            title: 'Novos Alunos',
            description: 'Conectamos você a milhares de alunos na sua região.',
            color: '#f59e0b',
        },
    ];

    const steps = [
        { num: 1, title: 'Cadastro', desc: 'Preencha seus dados e envie seus documentos.' },
        { num: 2, title: 'Verificação', desc: 'Aguarde a aprovação da nossa equipe.' },
        { num: 3, title: 'Configuração', desc: 'Defina seus horários e preços.' },
        { num: 4, title: 'Comece', desc: 'Receba alunos e comece a faturar!' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <LinearGradient
                        colors={['#7e22ce', '#6b21a8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroGradient}
                    >
                        <View style={styles.heroBadge}>
                            <Ionicons name="star" size={14} color="#fff" />
                            <Text style={styles.heroBadgeText}>Torne-se um Parceiro</Text>
                        </View>
                        <Text style={styles.heroTitle}>
                            Ensine, Dirija e Fature com a Vrumi
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            Transforme seu veículo em uma fonte de renda ensinando novos motoristas a perderem o medo de dirigir.
                        </Text>

                        <View style={styles.heroStats}>
                            <View style={styles.heroStatItem}>
                                <Text style={styles.heroStatValue}>R$ 3k+</Text>
                                <Text style={styles.heroStatLabel}>Renda Média</Text>
                            </View>
                            <View style={styles.heroStatDivider} />
                            <View style={styles.heroStatItem}>
                                <Text style={styles.heroStatValue}>Flexível</Text>
                                <Text style={styles.heroStatLabel}>Seus Horários</Text>
                            </View>
                            <View style={styles.heroStatDivider} />
                            <View style={styles.heroStatItem}>
                                <Text style={styles.heroStatValue}>Semanal</Text>
                                <Text style={styles.heroStatLabel}>Pagamentos</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Benefits Grid */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Por que ser um instrutor?</Text>
                <View style={styles.benefitsGrid}>
                    {benefits.map((item, index) => (
                        <View
                            key={index}
                            style={[styles.benefitCard, { backgroundColor: theme.card, shadowColor: '#000' }]}
                        >
                            <View style={[styles.benefitIcon, { backgroundColor: `${item.color}15` }]}>
                                <Ionicons name={item.icon as any} size={28} color={item.color} />
                            </View>
                            <Text style={[styles.benefitTitle, { color: theme.text }]}>{item.title}</Text>
                            <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                                {item.description}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* How it Works */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Como funciona</Text>
                <View style={[styles.stepsContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                    {steps.map((step, index) => (
                        <View key={index} style={styles.stepItem}>
                            <View style={styles.stepNumberContainer}>
                                <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.stepNumberText}>{step.num}</Text>
                                </View>
                                {index < steps.length - 1 && (
                                    <View style={[styles.stepLine, { backgroundColor: theme.cardBorder }]} />
                                )}
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                                <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{step.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom CTA */}
            <View style={[styles.bottomContainer, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => router.push('/connect/cadastro-instrutor')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#7e22ce', '#6b21a8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ctaGradient}
                    >
                        <Text style={styles.ctaText}>Quero ser Instrutor</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
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
        paddingBottom: 20,
    },
    heroContainer: {
        marginBottom: 24,
    },
    heroGradient: {
        padding: 24,
        paddingTop: 60, // Extra padding for status bar if needed
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 16,
        gap: 6,
    },
    heroBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 12,
        lineHeight: 36,
    },
    heroSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 24,
        lineHeight: 22,
    },
    heroStats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-between',
    },
    heroStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    heroStatValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    heroStatLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
    },
    heroStatDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginLeft: 20,
        marginBottom: 16,
    },
    benefitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 32,
    },
    benefitCard: {
        width: (width - 44) / 2,
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    benefitDesc: {
        fontSize: 12,
        lineHeight: 18,
    },
    stepsContainer: {
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    stepNumberContainer: {
        alignItems: 'center',
        marginRight: 16,
        width: 32,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    stepLine: {
        width: 2,
        height: 30,
        marginVertical: 4,
    },
    stepContent: {
        flex: 1,
        paddingBottom: 24,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        marginTop: 4,
    },
    stepDesc: {
        fontSize: 14,
    },
    bottomContainer: {
        padding: 20,
        borderTopWidth: 1,
        paddingBottom: 30,
    },
    ctaButton: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#7e22ce',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        gap: 8,
    },
    ctaText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
