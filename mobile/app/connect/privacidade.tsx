import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Switch,
    Linking,
    Modal,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useConsent } from '../../hooks/useConsent';
import { supabase } from '../../src/lib/supabase';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function PrivacySettingsScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { consents, hasValidConsent, revokeConsent, getConsentHistory, recordConsent } = useConsent();
    const [loading, setLoading] = useState<string | null>(null);
    const [marketingEnabled, setMarketingEnabled] = useState(
        hasValidConsent('marketing')
    );

    const [dataModalVisible, setDataModalVisible] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [consentHistory, setConsentHistory] = useState<any[]>([]);
    const [comingSoonModal, setComingSoonModal] = useState({ visible: false, title: '' });
    const { signOut } = useAuth();

    // Helper to fetch all user data
    const fetchFullUserData = async () => {
        try {
            console.log('Fetching user data...');
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!user) throw new Error('Usuário não autenticado');

            // Fetch profile
            console.log('Fetching profile...');
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*, birth_date, gender, monthly_income')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError) {
                console.log('Profile error (ignoring):', profileError);
            }

            // Construct full data object
            return {
                auth: {
                    id: user.id,
                    email: user.email,
                    phone: user.phone,
                    created_at: user.created_at,
                    last_sign_in_at: user.last_sign_in_at,
                    app_metadata: user.app_metadata,
                    user_metadata: user.user_metadata,
                },
                profile: profile || { message: 'Perfil não encontrado' },
                exported_at: new Date().toISOString(),
            };
        } catch (e) {
            console.error('Error fetching data:', e);
            throw e;
        }
    };

    const handleExportPdf = async () => {
        if (!userData) return;
        setLoading('pdf');

        try {
            const html = `
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                        h1 { color: #2563eb; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                        h2 { margin-top: 30px; font-size: 18px; color: #555; background: #f9fafb; padding: 10px; border-radius: 6px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                        .label { font-weight: bold; color: #666; }
                        .value { text-align: right; }
                        .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                        pre { background: #f1f5f9; padding: 15px; borderRadius: 8px; overflow-x: auto; font-size: 12px; }
                    </style>
                  </head>
                  <body>
                    <h1>Relatório de Dados Pessoais - Vrumi</h1>
                    <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                    
                    <h2>Identificação</h2>
                    <div class="row"><span class="label">ID:</span> <span class="value">${userData.auth.id}</span></div>
                    <div class="row"><span class="label">Email:</span> <span class="value">${userData.auth.email}</span></div>
                    ${userData.auth.phone ? `<div class="row"><span class="label">Telefone:</span> <span class="value">${userData.auth.phone}</span></div>` : ''}
                    ${userData.profile.birth_date ? `<div class="row"><span class="label">Nascimento:</span> <span class="value">${new Date(userData.profile.birth_date).toLocaleDateString('pt-BR')}</span></div>` : ''}
                    ${userData.profile.gender ? `<div class="row"><span class="label">Sexo:</span> <span class="value">${userData.profile.gender}</span></div>` : ''}
                    ${userData.profile.monthly_income ? `<div class="row"><span class="label">Renda Mensal:</span> <span class="value">R$ ${userData.profile.monthly_income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>` : ''}
                    
                    
                    <h2>Atividade</h2>
                    <div class="row"><span class="label">Criado em:</span> <span class="value">${new Date(userData.auth.created_at).toLocaleString('pt-BR')}</span></div>
                    <div class="row"><span class="label">Último Acesso:</span> <span class="value">${userData.auth.last_sign_in_at ? new Date(userData.auth.last_sign_in_at).toLocaleString('pt-BR') : 'N/A'}</span></div>
                    
                    <h2>Perfil Completo (JSON)</h2>
                    <pre>${JSON.stringify(userData.profile, null, 2)}</pre>
                    
                    <div class="footer">
                        Este documento contém dados pessoais sensíveis.<br>
                        Vrumi Connect © ${new Date().getFullYear()}
                    </div>
                  </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });

            // Renomear para algo mais amigável se possível, ou apenas compartilhar
            const fs = FileSystem as any;
            const newUri = fs.documentDirectory + `vrumi-relatorio-${new Date().getTime()}.pdf`;
            await fs.moveAsync({ from: uri, to: newUri });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Salvar Relatório PDF' });
            } else {
                Alert.alert('PDF Gerado', 'Arquivo salvo em: ' + newUri);
            }

        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao gerar PDF');
        } finally {
            setLoading(null);
        }
    };

    const handleJsonExport = async () => {
        // ... (preserving existing handleJsonExport logic which was refactored earlier) ...
        setLoading('export');
        try {
            const data = await fetchFullUserData();
            const jsonString = JSON.stringify(data, null, 2);

            const fileName = `vrumi-dados-${new Date().getTime()}.json`;
            const fs = FileSystem as any;
            const fileUri = (fs.documentDirectory || fs.cacheDirectory) + fileName;

            await fs.writeAsStringAsync(fileUri, jsonString, {
                encoding: 'utf8'
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Exportar meus dados Vrumi'
                });
            } else {
                Alert.alert('Sucesso', 'Arquivo salvo em: ' + fileUri);
            }

        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível exportar dados');
        } finally {
            setLoading(null);
        }
    };

    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            const session = await supabase.auth.getSession();
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.data.session?.access_token}`,
                    },
                }
            );

            if (response.ok) {
                setShowDeleteModal(false);
                await signOut();
                router.replace('/(auth)/login');
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao excluir conta');
            }
        } catch (error: any) {
            setShowDeleteModal(false);
            Alert.alert('Erro', error.message || 'Não foi possível excluir sua conta.');
        } finally {
            setDeletingAccount(false);
        }
    };

    const handleRequestDataAccess = async () => {
        setLoading('access');
        try {
            const data = await fetchFullUserData();
            setUserData(data);
            setDataModalVisible(true);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível carregar seus dados');
        } finally {
            setLoading(null);
        }
    };

    const handleMarketingToggle = async (value: boolean) => {
        setLoading('marketing');
        try {
            if (value) {
                // Re-enable marketing consent
                await recordConsent('marketing', {
                    source: 'privacy_settings',
                    platform: 'mobile',
                });
                setMarketingEnabled(true);
                Alert.alert('Ativado', 'Você voltará a receber comunicações de marketing.');
            } else {
                // Revoke marketing consent
                await revokeConsent('marketing');
                setMarketingEnabled(false);
                Alert.alert(
                    'Desativado',
                    'Você não receberá mais comunicações de marketing.'
                );
            }
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível alterar preferência');
        } finally {
            setLoading(null);
        }
    };

    const handleViewConsentHistory = () => {
        const history = getConsentHistory();
        setConsentHistory(history);
        setHistoryModalVisible(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Modal
                visible={dataModalVisible}
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setDataModalVisible(false)}
            >
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <View style={styles.exportOptions}>
                            <TouchableOpacity onPress={handleExportPdf} style={styles.pdfButton}>
                                <Ionicons name="document-text" size={18} color={theme.primary} />
                                <Text style={[styles.pdfButtonText, { color: theme.primary }]}>PDF</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleJsonExport} style={[styles.pdfButton, { marginLeft: 8 }]}>
                                <Ionicons name="code-working" size={18} color={theme.primary} />
                                <Text style={[styles.pdfButtonText, { color: theme.primary }]}>JSON</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => setDataModalVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {userData ? (
                            <>
                                <View style={[styles.dataSection, { backgroundColor: theme.card }]}>
                                    <Text style={[styles.dataSectionTitle, { color: theme.primary }]}>Identificação</Text>
                                    <View style={[styles.dataRow, { borderBottomColor: theme.cardBorder }]}>
                                        <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>ID do Usuário</Text>
                                        <Text style={[styles.dataValue, { color: theme.text }]} selectable>{userData.auth.id}</Text>
                                    </View>
                                    <View style={[styles.dataRow, { borderBottomColor: theme.cardBorder }]}>
                                        <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Email</Text>
                                        <Text style={[styles.dataValue, { color: theme.text }]} selectable>{userData.auth.email}</Text>
                                    </View>
                                    {userData.auth.phone && (
                                        <View style={[styles.dataRow, { borderBottomColor: theme.cardBorder }]}>
                                            <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Telefone</Text>
                                            <Text style={[styles.dataValue, { color: theme.text }]} selectable>{userData.auth.phone}</Text>
                                        </View>
                                    )}
                                    {userData.profile.birth_date && (
                                        <View style={[styles.dataRow, { borderBottomColor: theme.cardBorder }]}>
                                            <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Data de Nascimento</Text>
                                            <Text style={[styles.dataValue, { color: theme.text }]}>
                                                {new Date(userData.profile.birth_date).toLocaleDateString('pt-BR')}
                                            </Text>
                                        </View>
                                    )}
                                    {userData.profile.gender && (
                                        <View style={[styles.dataRow, { borderBottomColor: theme.cardBorder }]}>
                                            <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Sexo</Text>
                                            <Text style={[styles.dataValue, { color: theme.text }]}>{userData.profile.gender}</Text>
                                        </View>
                                    )}
                                    {userData.profile.monthly_income && (
                                        <View style={[styles.dataRow, { borderBottomColor: theme.cardBorder }]}>
                                            <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Renda Mensal</Text>
                                            <Text style={[styles.dataValue, { color: theme.text }]}>
                                                R$ {userData.profile.monthly_income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={[styles.dataSection, { backgroundColor: theme.card }]}>
                                    <Text style={[styles.dataSectionTitle, { color: theme.primary }]}>Atividade</Text>
                                    <View style={[styles.dataRow, { borderBottomColor: theme.cardBorder }]}>
                                        <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Conta Criada em</Text>
                                        <Text style={[styles.dataValue, { color: theme.text }]}>
                                            {new Date(userData.auth.created_at).toLocaleDateString('pt-BR')} às {new Date(userData.auth.created_at).toLocaleTimeString('pt-BR')}
                                        </Text>
                                    </View>
                                    <View style={[styles.dataRow, { borderBottomColor: theme.cardBorder }]}>
                                        <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Último Acesso</Text>
                                        <Text style={[styles.dataValue, { color: theme.text }]}>
                                            {userData.auth.last_sign_in_at ? new Date(userData.auth.last_sign_in_at).toLocaleDateString('pt-BR') : 'N/A'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.dataSection, { backgroundColor: theme.card }]}>
                                    <Text style={[styles.dataSectionTitle, { color: theme.primary }]}>Perfil & Metadados</Text>
                                    <View style={styles.jsonContainer}>
                                        <Text style={[styles.jsonText, { color: theme.textSecondary }]}>
                                            {JSON.stringify(userData.profile, null, 2)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.infoNotice, { backgroundColor: theme.card, marginTop: 10 }]}>
                                    <Ionicons name="lock-closed" size={20} color={theme.primary} />
                                    <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                        Estes são os dados brutos armazenados em nossos servidores seguros. Você pode solicitar a exportação completa para um arquivo JSON na tela anterior.
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Consent History Modal */}
            <Modal
                visible={historyModalVisible}
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setHistoryModalVisible(false)}
            >
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Histórico de Consentimentos</Text>
                        <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {consentHistory.length > 0 ? (
                            consentHistory.map((item, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.historyItem,
                                        {
                                            backgroundColor: theme.card,
                                            borderColor: item.revokedAt ? '#fee2e2' : theme.cardBorder,
                                            borderLeftColor: item.revokedAt ? '#ef4444' : theme.primary,
                                        }
                                    ]}
                                >
                                    <View style={styles.historyHeader}>
                                        <View style={styles.historyTypeContainer}>
                                            <Ionicons
                                                name={item.consentType === 'marketing' ? 'mail' : 'shield-checkmark'}
                                                size={16}
                                                color={theme.primary}
                                            />
                                            <Text style={[styles.historyType, { color: theme.text }]}>
                                                {item.consentType === 'marketing' ? 'Marketing' : 'Privacidade'}
                                            </Text>
                                        </View>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: item.revokedAt ? '#fee2e2' : '#dcfce7' }
                                        ]}>
                                            <Text style={[
                                                styles.statusBadgeText,
                                                { color: item.revokedAt ? '#dc2626' : '#16a34a' }
                                            ]}>
                                                {item.revokedAt ? 'Revogado' : 'Ativo'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.historyDetails}>
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Versão:</Text>
                                            <Text style={[styles.detailValue, { color: theme.text }]}>{item.version}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Aceito em:</Text>
                                            <Text style={[styles.detailValue, { color: theme.text }]}>
                                                {new Date(item.acceptedAt).toLocaleString('pt-BR')}
                                            </Text>
                                        </View>
                                        {item.revokedAt && (
                                            <View style={styles.detailRow}>
                                                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Revogado em:</Text>
                                                <Text style={[styles.detailValue, { color: '#dc2626' }]}>
                                                    {new Date(item.revokedAt).toLocaleString('pt-BR')}
                                                </Text>
                                            </View>
                                        )}
                                        {item.source && (
                                            <View style={styles.detailRow}>
                                                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Origem:</Text>
                                                <Text style={[styles.detailValue, { color: theme.text }]}>{item.source}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="time-outline" size={64} color={theme.textMuted} />
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                    Nenhum histórico de consentimento encontrado.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Privacidade e Dados</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* LGPD Rights Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Seus Direitos (LGPD)</Text>
                    <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                        De acordo com a Lei Geral de Proteção de Dados, você tem os seguintes direitos:
                    </Text>

                    {/* Manage My Data */}
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.card }]}
                        onPress={() => setComingSoonModal({ visible: true, title: 'Gerenciar Meus Dados' })}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                            <Ionicons name="person-circle" size={24} color="#3b82f6" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={[styles.actionTitle, { color: theme.text }]}>Gerenciar Meus Dados</Text>
                            <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                                Visualize, baixe em PDF ou exporte em JSON seus dados pessoais
                            </Text>
                        </View>
                        {loading === 'access' ? (
                            <ActivityIndicator color={theme.primary} />
                        ) : (
                            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                        )}
                    </TouchableOpacity>

                    {/* Edit Profile */}
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.card }]}
                        onPress={() => setComingSoonModal({ visible: true, title: 'Corrigir Dados' })}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="create" size={24} color="#d97706" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={[styles.actionTitle, { color: theme.text }]}>Corrigir Dados</Text>
                            <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                                Atualize suas informações pessoais
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </TouchableOpacity>

                    {/* Delete Account */}
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.card }]}
                        onPress={handleDeleteAccount}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]}>
                            <Ionicons name="trash" size={24} color="#dc2626" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={[styles.actionTitle, { color: '#dc2626' }]}>Excluir Conta</Text>
                            <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                                Remova permanentemente todos os seus dados e conta
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Consent Management */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Gerenciar Consentimentos</Text>

                    {/* Marketing Consent */}
                    <View style={[styles.consentCard, { backgroundColor: theme.card }]}>
                        <View style={styles.consentHeader}>
                            <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                                <Ionicons name="mail" size={24} color="#9333ea" />
                            </View>
                            <View style={styles.consentContent}>
                                <Text style={[styles.actionTitle, { color: theme.text }]}>
                                    Comunicações de Marketing
                                </Text>
                                <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                                    Novidades, promoções e dicas
                                </Text>
                            </View>
                            <Switch
                                value={marketingEnabled}
                                onValueChange={handleMarketingToggle}
                                disabled={loading === 'marketing'}
                                trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                                thumbColor={marketingEnabled ? '#16a34a' : '#f4f3f4'}
                            />
                        </View>
                    </View>

                    {/* View History */}
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.card }]}
                        onPress={() => setComingSoonModal({ visible: true, title: 'Histórico de Consentimentos' })}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#e0e7ff' }]}>
                            <Ionicons name="time" size={24} color="#6366f1" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={[styles.actionTitle, { color: theme.text }]}>
                                Histórico de Consentimentos
                            </Text>
                            <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                                Veja todos os consentimentos que você forneceu
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Legal Documents */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Documentos Legais</Text>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.card }]}
                        onPress={() => {
                            // Open privacy policy internally
                            router.push('/connect/politica-texto');
                        }}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                            <Ionicons name="shield-checkmark" size={24} color="#9333ea" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={[styles.actionTitle, { color: theme.text }]}>
                                Política de Privacidade
                            </Text>
                            <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                                Versão {consents.find((c) => c.consentType === 'privacy')?.version || '1.0'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.card }]}
                        onPress={() => {
                            // Open terms of use internally
                            router.push('/connect/termos');
                        }}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="document-text" size={24} color="#d97706" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={[styles.actionTitle, { color: theme.text }]}>Termos de Uso</Text>
                            <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                                Versão {consents.find((c) => c.consentType === 'terms')?.version || '1.0'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Info Notice */}
                <View style={[styles.infoNotice, { backgroundColor: theme.card }]}>
                    <Ionicons name="information-circle" size={20} color={theme.primary} />
                    <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                        Solicitações de acesso e portabilidade serão atendidas em até 15 dias úteis, conforme
                        estabelecido pela LGPD.
                    </Text>
                </View>
            </ScrollView>

            <ConfirmationModal
                visible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Excluir Conta"
                message="Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão permanentemente removidos."
                icon="trash-outline"
                type="danger"
                confirmText="Excluir Conta"
                cancelText="Cancelar"
                onConfirm={confirmDeleteAccount}
                onCancel={() => setShowDeleteModal(false)}
                loading={deletingAccount}
            />

            <ConfirmationModal
                visible={comingSoonModal.visible}
                onClose={() => setComingSoonModal({ visible: false, title: '' })}
                title={comingSoonModal.title}
                message="Esta funcionalidade está em desenvolvimento e será ativada em breve em uma próxima atualização do Vrumi Connect. Fique atento!"
                icon="time"
                type="info"
                confirmText="Entendido"
                onConfirm={() => setComingSoonModal({ visible: false, title: '' })}
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    sectionDescription: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 20,
        opacity: 0.8,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 20,
        marginBottom: 16,
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    actionIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 13,
        lineHeight: 18,
        opacity: 0.7,
    },
    consentCard: {
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    consentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    consentContent: {
        flex: 1,
    },
    infoNotice: {
        flexDirection: 'row',
        borderRadius: 18,
        padding: 18,
        gap: 14,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.1)',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        padding: 20,
        paddingBottom: 40,
    },
    jsonText: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 12,
        lineHeight: 18,
    },
    dataSection: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
    },
    dataSectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        opacity: 0.6,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    dataLabel: {
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.7,
    },
    dataValue: {
        fontSize: 14,
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    jsonContainer: {
        marginTop: 12,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 14,
    },
    pdfButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderRadius: 12,
        gap: 6,
    },
    pdfButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
    exportOptions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    historyItem: {
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderLeftWidth: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    historyTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    historyType: {
        fontSize: 16,
        fontWeight: '800',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    historyDetails: {
        gap: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 13,
        opacity: 0.6,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    emptyContainer: {
        paddingVertical: 100,
        alignItems: 'center',
        gap: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        opacity: 0.6,
    },
});
