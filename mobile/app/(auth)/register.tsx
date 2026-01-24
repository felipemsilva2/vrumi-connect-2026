import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';
import BiometricSetupModal from '../../components/BiometricSetupModal';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function RegisterScreen() {
    const { theme } = useTheme();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const { signUp, signInWithGoogle, signInWithApple } = useAuth();
    const {
        isBiometricSupported,
        isBiometricEnrolled,
        biometricType,
        hasCredentials,
        saveCredentials,
    } = useBiometricAuth();

    // Unified Modal State
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'warning' | 'danger' | 'success' | 'info';
        onConfirm?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'warning',
    });

    const showModal = (title: string, message: string, type: 'warning' | 'danger' | 'success' | 'info' = 'warning', onConfirm?: () => void) => {
        setModalConfig({ visible: true, title, message, type, onConfirm });
    };

    const handleRegister = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
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
        const { error } = await signUp(email, password, fullName);
        setLoading(false);

        if (error) {
            showModal('Erro', error.message, 'danger');
        } else {
            showModal(
                'Sucesso!',
                'Conta criada com sucesso. Verifique seu email.',
                'success',
                () => router.replace('/(auth)/login')
            );
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        setLoading(false);

        if (error) {
            if (error.message !== 'Login cancelado') {
                showModal('Erro', error.message, 'danger');
            }
        } else {
            if (isBiometricSupported && isBiometricEnrolled) {
                const hasCreds = await hasCredentials();
                if (!hasCreds) {
                    setShowSetupModal(true);
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                router.replace('/(tabs)');
            }
        }
    };

    const handleAppleLogin = async () => {
        setLoading(true);
        const { error } = await signInWithApple();
        setLoading(false);

        if (error) {
            if (error.message !== 'Login cancelado') {
                showModal('Erro', error.message, 'danger');
            }
        } else {
            if (isBiometricSupported && isBiometricEnrolled) {
                const hasCreds = await hasCredentials();
                if (!hasCreds) {
                    setShowSetupModal(true);
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                router.replace('/(tabs)');
            }
        }
    };

    const handleEnableBiometric = async () => {
        try {
            setShowSetupModal(false);
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error enabling biometric:', error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: theme.card }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {/* Title Section */}
                    <View style={styles.titleSection}>
                        <Text style={[styles.title, { color: theme.text }]}>Criar Conta</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            Junte-se ao Vrumi e comece sua jornada{'\n'}rumo à CNH!
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.text }]}>Nome Completo</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                                <Ionicons name="person-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="Seu nome"
                                    placeholderTextColor={theme.textMuted}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                                <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="seu@email.com"
                                    placeholderTextColor={theme.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.text }]}>Senha</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="Mínimo 6 caracteres"
                                    placeholderTextColor={theme.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color={theme.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.text }]}>Confirmar Senha</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="Repita a senha"
                                    placeholderTextColor={theme.textMuted}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.registerButton, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.registerButtonText}>Criar Conta</Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={[styles.dividerLine, { backgroundColor: theme.inputBorder }]} />
                            <Text style={[styles.dividerText, { color: theme.textMuted }]}>
                                ou cadastre-se com
                            </Text>
                            <View style={[styles.dividerLine, { backgroundColor: theme.inputBorder }]} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.socialButton,
                                    {
                                        backgroundColor: theme.card,
                                        borderColor: theme.inputBorder
                                    }
                                ]}
                                onPress={handleGoogleLogin}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="logo-google" size={24} color="#ea4335" />
                                <Text style={[styles.socialButtonText, { color: theme.text }]}>
                                    Google
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.socialButton,
                                    {
                                        backgroundColor: theme.card,
                                        borderColor: theme.inputBorder
                                    }
                                ]}
                                onPress={handleAppleLogin}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="logo-apple" size={24} color={theme.text} />
                                <Text style={[styles.socialButtonText, { color: theme.text }]}>
                                    Apple
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Login Link */}
                    <View style={styles.loginSection}>
                        <Text style={[styles.loginText, { color: theme.textSecondary }]}>Já tem uma conta? </Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={[styles.loginLink, { color: theme.primary }]}>Entrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <BiometricSetupModal
                    visible={showSetupModal}
                    biometricType={biometricType}
                    onEnable={handleEnableBiometric}
                    onDismiss={() => {
                        setShowSetupModal(false);
                        router.replace('/(tabs)');
                    }}
                />

                <ConfirmationModal
                    visible={modalConfig.visible}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    confirmText="Entendido"
                    onConfirm={() => {
                        modalConfig.onConfirm?.();
                        setModalConfig(prev => ({ ...prev, visible: false }));
                    }}
                    onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    titleSection: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
    },
    formContainer: {
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    registerButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: '500',
    },
    socialButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 14,
        borderWidth: 1.5,
        gap: 10,
    },
    socialButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    loginText: {
        fontSize: 16,
    },
    loginLink: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
