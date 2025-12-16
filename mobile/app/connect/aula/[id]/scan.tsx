import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { supabase } from '../../../../src/lib/supabase';

export default function ScanScreen() {
    const { id } = useLocalSearchParams<{ id: string }>(); // Booking ID
    const { theme } = useTheme();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const getPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        getPermissions();
    }, []);

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || processing) return;

        try {
            const parsedData = JSON.parse(data);

            // Validate JSON structure
            if (!parsedData.bookingId || !parsedData.action) {
                return; // Not our QR code
            }

            // Validate match
            if (parsedData.bookingId !== id) {
                Alert.alert('Erro', 'Este QR Code não pertence a esta aula.');
                setScanned(true); // Stop scanning momentarily
                return;
            }

            setProcessing(true);
            setScanned(true);

            // Execute Completion
            const { error } = await supabase
                .from('bookings')
                .update({
                    status: 'completed'
                    // removed completed_at because it might not exist in schema yet, relying on updated_at or trigger
                })
                .eq('id', id);

            if (error) throw error;

            Alert.alert(
                'Sucesso!',
                'Presença confirmada! Aula concluída.',
                [{ text: 'OK', onPress: () => router.push('/connect/minhas-aulas') }]
            );

        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Código inválido ou erro ao processar.');
            setScanned(true); // Stop scanning
        } finally {
            setProcessing(false);
        }
    };

    if (hasPermission === null) {
        return <View style={styles.container} />;
    }
    if (hasPermission === false) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: theme.text }}>Sem acesso à câmera</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Escanear Código</Text>
            </View>

            <View style={styles.cameraContainer}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                />
                <View style={styles.overlay}>
                    <View style={styles.scanFrame} />
                    <Text style={styles.instruction}>Aponte para o celular do instrutor</Text>
                </View>
            </View>

            {scanned && !processing && (
                <TouchableOpacity onPress={() => setScanned(false)} style={styles.rescanButton}>
                    <Text style={styles.rescanText}>Escanear Novamente</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    closeButton: {
        padding: 8,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    cameraContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scanFrame: {
        width: 280,
        height: 280,
        borderWidth: 2,
        borderColor: '#10b981', // Emerald 500
        backgroundColor: 'transparent',
        borderRadius: 20,
    },
    instruction: {
        color: '#fff',
        marginTop: 20,
        fontSize: 16,
        fontWeight: '500',
    },
    rescanButton: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: '#10b981',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 25,
    },
    rescanText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
