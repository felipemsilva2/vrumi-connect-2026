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
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
    const { theme, isDark } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, signInWithGoogle } = useAuth();

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
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Preencha todos os campos');
            return;
        }

        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);

        if (error) {
            Alert.alert('Erro', error.message);
        } else {
            router.replace('/(tabs)');
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        setLoading(false);

        if (error) {
            if (error.message !== 'Login cancelado') {
                Alert.alert('Erro', error.message);
            }
        } else {
            router.replace('/(tabs)');
        }
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

                        {/* Form Section */}
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
                            <TouchableOpacity style={styles.forgotPassword}>
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
                                    disabled={true}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="logo-apple" size={24} color={theme.text} />
                                    <Text style={[styles.socialButtonText, { color: theme.text }]}>
                                        Apple
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

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
});
