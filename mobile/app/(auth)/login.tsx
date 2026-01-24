import { useState, useEffect, useRef } from 'react';
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
    Animated,
    Image,
    Dimensions,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';
import BiometricSetupModal from '../../components/BiometricSetupModal';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationModal from '../../components/ConfirmationModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
    const { theme, isDark } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showBiometricButton, setShowBiometricButton] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [usePasswordLogin, setUsePasswordLogin] = useState(false);
    const { signIn, signInWithGoogle, signInWithApple, signInWithBiometric, session } = useAuth();
    const {
        isBiometricSupported,
        isBiometricEnrolled,
        biometricType,
        authenticate,
        hasCredentials,
        getCredentials,
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

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Check if biometric credentials exist
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        if (isBiometricSupported && isBiometricEnrolled) {
            const hasCreds = await hasCredentials();
            setShowBiometricButton(hasCreds);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showModal('Erro', 'Preencha todos os campos', 'warning');
            return;
        }

        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);

        if (error) {
            showModal('Erro', error.message, 'danger');
        } else {
            // Check if should show biometric setup modal
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

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        setLoading(false);

        if (error) {
            if (error.message !== 'Login cancelado') {
                showModal('Erro', error.message, 'danger');
            }
        } else {
            // Check if should show biometric setup modal
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
            // Check if should show biometric setup modal
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

    const handleBiometricLogin = async () => {
        setLoading(true);
        const authResult = await authenticate();

        if (authResult.success) {
            const credentials = await getCredentials();
            if (credentials) {
                const { error } = await signInWithBiometric(credentials.refreshToken);
                setLoading(false);

                if (error) {
                    showModal('Erro', 'Não foi possível fazer login com biometria', 'danger');
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                setLoading(false);
                showModal('Erro', 'Credenciais não encontradas', 'danger');
            }
        } else {
            setLoading(false);
            if (authResult.error && authResult.error !== 'Cancelado') {
                showModal('Erro', authResult.error, 'danger');
            }
        }
    };

    const handleEnableBiometric = async () => {
        const authResult = await authenticate();

        if (authResult.success && session) {
            try {
                await saveCredentials(session.user.id, session.refresh_token);
                setShowSetupModal(false);
                router.replace('/(tabs)');
            } catch (error) {
                showModal('Erro', 'Não foi possível ativar biometria', 'danger');
            }
        } else {
            setShowSetupModal(false);
            router.replace('/(tabs)');
        }
    };

    const handleDismissSetupModal = () => {
        setShowSetupModal(false);
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        {/* Hero Section - Logo & Welcome */}
                        <View style={styles.heroSection}>
                            <Image
                                source={require('../../assets/logo-vrumi.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                                Bem-vindo de volta!
                            </Text>
                            <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                                Entre para continuar sua jornada rumo à CNH
                            </Text>
                        </View>

                        {/* Biometric Login Button */}
                        {showBiometricButton && !usePasswordLogin && (
                            <View style={styles.biometricSection}>
                                <TouchableOpacity
                                    style={[styles.biometricButton, { backgroundColor: theme.primary }]}
                                    onPress={handleBiometricLogin}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons
                                                name={biometricType === 'face' ? 'scan-outline' : 'finger-print-outline'}
                                                size={24}
                                                color="#fff"
                                            />
                                            <Text style={styles.biometricButtonText}>
                                                Entrar com {biometricType === 'face' ? 'Face ID' : 'Touch ID'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.usePasswordButton}
                                    onPress={() => setUsePasswordLogin(true)}
                                >
                                    <Text style={[styles.usePasswordText, { color: theme.textMuted }]}>
                                        Usar senha
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Form Section */}
                        {(!showBiometricButton || usePasswordLogin) && (
                            <View style={styles.formSection}>
                                {/* Email Input */}
                                <View style={styles.inputContainer}>
                                    <View style={[
                                        styles.inputWrapper,
                                        {
                                            backgroundColor: isDark ? theme.card : '#f8fafc',
                                            borderColor: theme.inputBorder
                                        }
                                    ]}>
                                        <Ionicons
                                            name="mail-outline"
                                            size={22}
                                            color={theme.textMuted}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            placeholder="Digite seu email"
                                            placeholderTextColor={theme.textMuted}
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
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
                                            placeholder="Digite sua senha"
                                            placeholderTextColor={theme.textMuted}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            autoComplete="password"
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeButton}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Ionicons
                                                name={showPassword ? "eye-outline" : "eye-off-outline"}
                                                size={22}
                                                color={theme.textMuted}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Forgot Password */}
                                <TouchableOpacity
                                    style={styles.forgotPassword}
                                    onPress={() => router.push('/(auth)/reset-password')}
                                >
                                    <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                                        Esqueceu a senha?
                                    </Text>
                                </TouchableOpacity>

                                {/* Login Button */}
                                <TouchableOpacity
                                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Text style={styles.loginButtonText}>Entrar</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* Divider */}
                                <View style={styles.dividerContainer}>
                                    <View style={[styles.dividerLine, { backgroundColor: theme.inputBorder }]} />
                                    <Text style={[styles.dividerText, { color: theme.textMuted }]}>
                                        ou continue com
                                    </Text>
                                    <View style={[styles.dividerLine, { backgroundColor: theme.inputBorder }]} />
                                </View>

                                {/* Social Login Buttons */}
                                <View style={styles.socialButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.socialButton,
                                            {
                                                backgroundColor: isDark ? theme.card : '#fff',
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
                                                backgroundColor: isDark ? theme.card : '#fff',
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
                        )}

                        {/* Footer - Register Link */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                                Não tem uma conta?{' '}
                            </Text>
                            <Link href="/(auth)/register" asChild>
                                <TouchableOpacity>
                                    <Text style={[styles.footerLink, { color: theme.primary }]}>
                                        Criar conta
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </Animated.View>

                    {/* Biometric Setup Modal */}
                    <BiometricSetupModal
                        visible={showSetupModal}
                        biometricType={biometricType}
                        onEnable={handleEnableBiometric}
                        onDismiss={handleDismissSetupModal}
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
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        minHeight: SCREEN_HEIGHT * 0.85,
    },
    content: {
        flex: 1,
        paddingHorizontal: 28,
        justifyContent: 'center',
    },
    // Hero Section
    heroSection: {
        alignItems: 'center',
        marginBottom: 40,
        paddingTop: 20,
    },
    logo: {
        width: 280,
        height: 100,
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    welcomeSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    // Form Section
    formSection: {
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 16,
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
        marginTop: 4,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#10b981',
        borderRadius: 16,
        height: 58,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
    // Divider
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 28,
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
    // Social Buttons
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
    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 15,
    },
    footerLink: {
        fontSize: 15,
        fontWeight: '700',
    },
    // Biometric Section
    biometricSection: {
        marginBottom: 32,
        gap: 16,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 58,
        borderRadius: 16,
        gap: 10,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    biometricButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
    usePasswordButton: {
        alignSelf: 'center',
        paddingVertical: 8,
    },
    usePasswordText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
