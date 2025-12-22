import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface DocumentStatus {
    cnh_document_url: string | null;
    vehicle_document_url: string | null;
    credential_document_url: string | null;
    background_check_url: string | null;
    documents_status: 'pending' | 'submitted' | 'verified' | 'rejected';
}

export default function DocumentUploadScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<'cnh' | 'vehicle' | 'credential' | 'background' | null>(null);
    const [status, setStatus] = useState<DocumentStatus | null>(null);
    const [instructorId, setInstructorId] = useState<string | null>(null);

    useEffect(() => {
        fetchDocumentStatus();
    }, []);

    const fetchDocumentStatus = async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await (supabase as any)
                .from('instructors')
                .select('id, cnh_document_url, vehicle_document_url, credential_document_url, background_check_url, documents_status')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            setInstructorId(data.id);
            setStatus({
                cnh_document_url: data.cnh_document_url || null,
                vehicle_document_url: data.vehicle_document_url || null,
                credential_document_url: data.credential_document_url || null,
                background_check_url: data.background_check_url || null,
                documents_status: data.documents_status || 'pending',
            });
        } catch (error) {
            console.error('Error fetching document status:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickAndUploadDocument = async (type: 'cnh' | 'vehicle' | 'credential' | 'background') => {
        if (!user?.id || !instructorId) return;

        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permissão Negada', 'Precisamos de acesso à galeria para fazer upload.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (result.canceled || !result.assets[0]) return;

            setUploading(type);

            const uri = result.assets[0].uri;
            const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

            // Read file as base64 and convert to ArrayBuffer for React Native
            const response = await fetch(uri);
            const arrayBuffer = await response.arrayBuffer();

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('instructor-documents')
                .upload(fileName, arrayBuffer, {
                    contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('instructor-documents')
                .getPublicUrl(fileName);

            // Update instructor record
            let updateField = 'cnh_document_url';
            if (type === 'vehicle') updateField = 'vehicle_document_url';
            if (type === 'credential') updateField = 'credential_document_url';
            if (type === 'background') updateField = 'background_check_url';

            const { error: updateError } = await (supabase as any)
                .from('instructors')
                .update({
                    [updateField]: urlData.publicUrl,
                    documents_status: 'submitted',
                })
                .eq('id', instructorId);

            if (updateError) throw updateError;

            // Refresh status
            fetchDocumentStatus();
            Alert.alert('Sucesso!', 'Documento enviado para análise.');

        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Erro', error.message || 'Não foi possível fazer o upload.');
        } finally {
            setUploading(null);
        }
    };

    const getStatusConfig = () => {
        switch (status?.documents_status) {
            case 'verified':
                return { color: '#10b981', icon: 'checkmark-circle', label: 'Verificado' };
            case 'submitted':
                return { color: '#f59e0b', icon: 'time', label: 'Em Análise' };
            case 'rejected':
                return { color: '#ef4444', icon: 'close-circle', label: 'Rejeitado' };
            default:
                return { color: '#6b7280', icon: 'alert-circle', label: 'Pendente' };
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const statusConfig = getStatusConfig();

    const renderDocumentCard = (
        type: 'cnh' | 'vehicle' | 'credential' | 'background',
        title: string,
        icon: any,
        currentUrl: string | null,
        description?: string
    ) => (
        <View style={[styles.documentCard, { backgroundColor: theme.card }]}>
            <View style={styles.documentHeader}>
                <Ionicons name={icon} size={24} color={theme.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.documentTitle, { color: theme.text }]}>{title}</Text>
                    {description && (
                        <Text style={[styles.documentDescription, { color: theme.textSecondary }]}>
                            {description}
                        </Text>
                    )}
                </View>
            </View>

            {currentUrl ? (
                <View style={styles.documentPreview}>
                    <Image source={{ uri: currentUrl }} style={styles.documentImage} />
                    <View style={styles.documentOverlay}>
                        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                        <Text style={styles.documentOverlayText}>Enviado</Text>
                    </View>
                </View>
            ) : (
                <TouchableOpacity
                    style={[styles.uploadButton, { borderColor: theme.primary }]}
                    onPress={() => pickAndUploadDocument(type)}
                    disabled={uploading !== null}
                >
                    {uploading === type ? (
                        <ActivityIndicator color={theme.primary} />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={32} color={theme.primary} />
                            <Text style={[styles.uploadText, { color: theme.primary }]}>
                                Fazer Upload
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Verificação de Documentos</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: theme.card }]}>
                    <View style={[styles.statusIcon, { backgroundColor: statusConfig.color + '20' }]}>
                        <Ionicons name={statusConfig.icon as any} size={32} color={statusConfig.color} />
                    </View>
                    <Text style={[styles.statusLabel, { color: theme.text }]}>
                        Status: {statusConfig.label}
                    </Text>
                    {status?.documents_status === 'verified' && (
                        <Text style={[styles.statusDescription, { color: theme.textMuted }]}>
                            Seus documentos foram verificados! Você agora tem o selo de instrutor verificado.
                        </Text>
                    )}
                </View>

                {/* Info */}
                <View style={[styles.infoCard, { backgroundColor: theme.primaryLight }]}>
                    <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
                    <Text style={[styles.infoText, { color: theme.primary }]}>
                        Para sua segurança e dos alunos, exigimos documentação completa.
                        Dados verificados aumentam sua credibilidade.
                    </Text>
                </View>

                {renderDocumentCard(
                    'cnh',
                    'CNH com EAR',
                    'card-outline',
                    status?.cnh_document_url || null,
                    'Carteira de Motorista com observação "Exerce Atividade Remunerada".'
                )}

                {renderDocumentCard(
                    'vehicle',
                    'Documento do Veículo (CRLV)',
                    'car-outline',
                    status?.vehicle_document_url || null,
                    'Certificado de Registro e Licenciamento de Veículo atualizado.'
                )}

                {renderDocumentCard(
                    'credential',
                    'Certificado de Instrutor (CFC)',
                    'school-outline',
                    status?.credential_document_url || null,
                    'Credencial de Instrutor de Trânsito emitida pelo DETRAN.'
                )}

                {renderDocumentCard(
                    'background',
                    'Antecedentes Criminais',
                    'shield-checkmark-outline',
                    status?.background_check_url || null,
                    'Atestado de Antecedentes Criminais (Federal ou Estadual) recente.'
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    statusCard: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
    },
    statusIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    statusDescription: {
        fontSize: 14,
        textAlign: 'center',
    },
    documentCard: {
        padding: 20,
        borderRadius: 16,
    },
    documentHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 16,
    },
    documentTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    documentDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
    uploadButton: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        gap: 8,
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '600',
    },
    documentPreview: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
    },
    documentImage: {
        width: '100%',
        height: 150,
        borderRadius: 12,
    },
    documentOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
    },
    documentOverlayText: {
        color: '#fff',
        fontWeight: '600',
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        gap: 10,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
