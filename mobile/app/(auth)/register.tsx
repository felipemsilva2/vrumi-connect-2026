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
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
    const { theme } = useTheme();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signUp } = useAuth();

    const handleRegister = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Erro', 'Preencha todos os campos');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);
        const { error } = await signUp(email, password, fullName);
        setLoading(false);

        if (error) {
            Alert.alert('Erro', error.message);
        } else {
            Alert.alert(
                'Sucesso!',
                'Conta criada com sucesso. Verifique seu email.',
                [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
            );
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
                    </View>

                    {/* Login Link */}
                    <View style={styles.loginSection}>
                        <Text style={[styles.loginText, { color: theme.textSecondary }]}>Já tem uma conta? </Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={[styles.loginLink, { color: theme.primary }]}>Entrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
    },
    loginLink: {
        fontSize: 14,
        fontWeight: '600',
    },
});
