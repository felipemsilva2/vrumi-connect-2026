import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Dimensions,
    Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ScanScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [scanAnimation] = useState(new Animated.Value(0));

    useEffect(() => {
        const getPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        getPermissions();
    }, []);

    useEffect(() => {
        // Scanning line animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnimation, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanAnimation, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
        if (scanned || processing) return;

        try {
            const parsedData = JSON.parse(data);

            if (!parsedData.bookingId || !parsedData.action) {
                return;
            }

            if (parsedData.bookingId !== id) {
                Alert.alert(
                    'QR Code Incorreto',
                    'Este código não pertence a esta aula. Confirme com o instrutor.',
                    [{ text: 'OK', onPress: () => setScanned(false) }]
                );
                setScanned(true);
                return;
            }

            setProcessing(true);
            setScanned(true);

            const { error } = await supabase
                .from('bookings')
                .update({ status: 'completed' })
                .eq('id', id);

            if (error) throw error;

            Alert.alert(
                '✅ Check-in Concluído!',
                'Sua presença foi confirmada e a aula foi finalizada com sucesso.',
                [{ text: 'Ver Minhas Aulas', onPress: () => router.push('/(tabs)/aulas') }]
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível processar o código. Tente novamente.');
            setScanned(true);
        } finally {
            setProcessing(false);
        }
    };

    if (hasPermission === null) {
        return <View style={styles.container} />;
    }

    if (hasPermission === false) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <View style={styles.permissionIcon}>
                        <Ionicons name="camera-outline" size={48} color="#9ca3af" />
                    </View>
                    <Text style={styles.permissionTitle}>Câmera Necessária</Text>
                    <Text style={styles.permissionText}>
                        Precisamos de acesso à câmera para escanear o QR Code do instrutor
                    </Text>
                    <TouchableOpacity style={styles.permissionBtn} onPress={() => router.back()}>
                        <Text style={styles.permissionBtnText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const scanLinePosition = scanAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 100],
    });

    return (
        <View style={styles.container}>
            {/* Camera */}
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
                {/* Top Section */}
                <SafeAreaView style={styles.topSection}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <View style={styles.roleBadge}>
                            <Ionicons name="school" size={14} color="#fff" />
                            <Text style={styles.roleBadgeText}>Aluno</Text>
                        </View>
                        <Text style={styles.headerTitle}>Escanear QR Code</Text>
                    </View>
                </SafeAreaView>

                {/* Center - Scan Frame */}
                <View style={styles.centerSection}>
                    <View style={styles.scanFrame}>
                        {/* Corner decorations */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />

                        {/* Animated scan line */}
                        <Animated.View
                            style={[
                                styles.scanLine,
                                { transform: [{ translateY: scanLinePosition }] }
                            ]}
                        />
                    </View>
                </View>

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                    <View style={styles.instructionCard}>
                        <View style={styles.instructionIcon}>
                            <Ionicons name="phone-portrait" size={24} color="#10b981" />
                        </View>
                        <View style={styles.instructionContent}>
                            <Text style={styles.instructionTitle}>
                                Aponte para o celular do instrutor
                            </Text>
                            <Text style={styles.instructionText}>
                                O QR Code será lido automaticamente
                            </Text>
                        </View>
                    </View>

                    {scanned && !processing && (
                        <TouchableOpacity
                            onPress={() => setScanned(false)}
                            style={styles.rescanBtn}
                        >
                            <Ionicons name="refresh" size={18} color="#fff" />
                            <Text style={styles.rescanText}>Escanear Novamente</Text>
                        </TouchableOpacity>
                    )}

                    {processing && (
                        <View style={styles.processingContainer}>
                            <Text style={styles.processingText}>Processando...</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const FRAME_SIZE = SCREEN_WIDTH * 0.7;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    // Permission Screen
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f9fafb',
    },
    permissionIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    permissionText: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    permissionBtn: {
        backgroundColor: '#10b981',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
    },
    permissionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // Overlay
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    // Top
    topSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerInfo: {
        alignItems: 'center',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 8,
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },
    // Center
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        position: 'relative',
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    corner: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderColor: '#10b981',
        borderWidth: 4,
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 16,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 16,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: 16,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: 16,
    },
    scanLine: {
        width: '100%',
        height: 2,
        backgroundColor: '#10b981',
        position: 'absolute',
        top: '50%',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    // Bottom
    bottomSection: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    instructionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        gap: 14,
    },
    instructionIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionContent: {
        flex: 1,
    },
    instructionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    instructionText: {
        fontSize: 13,
        color: '#6b7280',
    },
    rescanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#10b981',
        paddingVertical: 14,
        borderRadius: 14,
        marginTop: 12,
    },
    rescanText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    processingContainer: {
        alignItems: 'center',
        marginTop: 12,
    },
    processingText: {
        color: '#10b981',
        fontSize: 15,
        fontWeight: '600',
    },
});
