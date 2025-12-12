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
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn } = useAuth();

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
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

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <Image
                            source={require('../../assets/logo-vrumi.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                            Entre para continuar estudando para sua CNH
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
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
                                    autoComplete="email"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.text }]}>Senha</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={theme.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeButton}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color={theme.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>Esqueceu a senha?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Entrar</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Register Link */}
                    <View style={styles.registerSection}>
                        <Text style={[styles.registerText, { color: theme.textSecondary }]}>Não tem uma conta? </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text style={[styles.registerLink, { color: theme.primary }]}>Cadastre-se</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </Animated.View>
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
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoImage: {
        width: 180,
        height: 60,
        marginBottom: 16,
    },
    welcomeSubtitle: {
        fontSize: 15,
        textAlign: 'center',
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
    eyeButton: {
        padding: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    registerSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerText: {
        fontSize: 14,
    },
    registerLink: {
        fontSize: 14,
        fontWeight: '600',
    },
});
