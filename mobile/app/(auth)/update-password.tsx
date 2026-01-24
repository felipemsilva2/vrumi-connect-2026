import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function UpdatePasswordScreen() {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'warning' | 'danger' | 'success';
        onConfirm?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'warning',
    });

    const showModal = (title: string, message: string, type: 'warning' | 'danger' | 'success', onConfirm?: () => void) => {
        setModalConfig({ visible: true, title, message, type, onConfirm });
    };

    const handleUpdatePassword = async () => {
        if (!password || !confirmPassword) {
            showModal('Erro', 'Preencha todos os campos', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            showModal('Erro', 'As senhas não coincidem', 'warning');
            return;
        }

        if (password.length < 6) {
            showModal('Erro', 'A senha deve ter pelo menos 6 caracteres', 'warning');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            showModal(
                'Sucesso',
                'Sua senha foi atualizada com sucesso!',
                'success',
                () => router.replace('/(auth)/login')
            );
        } catch (error: any) {
            showModal('Erro', error.message || 'Erro ao atualizar senha', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Nova Senha</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="key-outline" size={48} color={theme.primary} />
                        </View>
                    </View>

                    <Text style={[styles.description, { color: theme.textSecondary }]}>
                        Digite sua nova senha abaixo.
                    </Text>

                    <View style={styles.inputContainer}>
                        <View style={[
                            styles.inputWrapper,
                            {
                                backgroundColor: isDark ? theme.card : '#f8fafc',
                                borderColor: theme.inputBorder
                            }
                        ]}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={22}
                                color={theme.textMuted}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Nova senha"
                                placeholderTextColor={theme.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={22}
                                    color={theme.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={[
                            styles.inputWrapper,
                            {
                                backgroundColor: isDark ? theme.card : '#f8fafc',
                                borderColor: theme.inputBorder
                            }
                        ]}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={22}
                                color={theme.textMuted}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Confirme a nova senha"
                                placeholderTextColor={theme.textMuted}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.buttonDisabled, { backgroundColor: theme.primary }]}
                        onPress={handleUpdatePassword}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Atualizar Senha</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>

                <ConfirmationModal
                    visible={modalConfig.visible}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    confirmText="OK"
                    onConfirm={() => {
                        modalConfig.onConfirm?.();
                        setModalConfig(prev => ({ ...prev, visible: false }));
                    }}
                    onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        height: 50,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1.5,
        paddingHorizontal: 18,
        height: 60,
    },
    inputIcon: {
        marginRight: 14,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    eyeButton: {
        padding: 6,
    },
    submitButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
