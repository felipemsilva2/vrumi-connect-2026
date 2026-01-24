import React, { memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    Platform,
    Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Instructor {
    id: string;
    full_name: string;
    photo_url: string | null;
}

interface InstructorContextMenuProps {
    visible: boolean;
    instructor: Instructor | null;
    theme: Theme;
    onClose: () => void;
    onViewProfile: (id: string) => void;
    onShare: (id: string) => void;
    onFavorite: (id: string) => void;
}

const InstructorContextMenu = ({
    visible,
    instructor,
    theme,
    onClose,
    onViewProfile,
    onShare,
    onFavorite,
}: InstructorContextMenuProps) => {
    if (!instructor) return null;

    const handleAction = (action: () => void) => {
        Haptics.selectionAsync();
        action();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                style={styles.overlay}
                onPress={onClose}
            >
                <BlurView
                    intensity={Platform.OS === 'ios' ? 30 : 100}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />

                <View style={styles.centeredContainer}>
                    {/* Preview Card */}
                    <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        {instructor.photo_url ? (
                            <Image source={{ uri: instructor.photo_url }} style={styles.previewImage} />
                        ) : (
                            <View style={[styles.previewPlaceholder, { backgroundColor: theme.primarySoft }]}>
                                <Ionicons name="person" size={40} color={theme.primary} />
                            </View>
                        )}
                        <View style={styles.previewInfo}>
                            <Text style={[styles.previewName, { color: theme.text, fontSize: theme.typography.sizes.bodyLarge, fontWeight: theme.typography.weights.extraBold }]}>
                                {instructor.full_name}
                            </Text>
                            <Text style={[styles.previewSubtitle, { color: theme.textMuted, fontSize: theme.typography.sizes.caption, fontWeight: theme.typography.weights.semibold }]}>
                                Instrutor Parceiro Verificado
                            </Text>
                        </View>
                    </View>

                    {/* Actions Menu */}
                    <View style={[styles.menuContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.cardBorder }]}
                            onPress={() => handleAction(() => onViewProfile(instructor.id))}
                        >
                            <Text style={[styles.menuText, { color: theme.text, fontSize: theme.typography.sizes.body, fontWeight: theme.typography.weights.semibold }]}>Visualizar Perfil</Text>
                            <Ionicons name="eye-outline" size={20} color={theme.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.cardBorder }]}
                            onPress={() => handleAction(() => onFavorite(instructor.id))}
                        >
                            <Text style={[styles.menuText, { color: theme.text, fontSize: theme.typography.sizes.body, fontWeight: theme.typography.weights.semibold }]}>Favoritar</Text>
                            <Ionicons name="heart-outline" size={20} color={theme.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleAction(() => onShare(instructor.id))}
                        >
                            <Text style={[styles.menuText, { color: theme.text, fontSize: theme.typography.sizes.body, fontWeight: theme.typography.weights.semibold }]}>Compartilhar</Text>
                            <Ionicons name="share-outline" size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Close Action */}
                    <TouchableOpacity
                        style={[styles.closeButton, { backgroundColor: theme.card }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.closeText, { color: theme.error, fontSize: theme.typography.sizes.body, fontWeight: theme.typography.weights.bold }]}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredContainer: {
        width: '80%',
        alignItems: 'center',
        gap: 12,
    },
    previewCard: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    previewImage: {
        width: '100%',
        height: 180,
    },
    previewPlaceholder: {
        width: '100%',
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewInfo: {
        padding: 16,
    },
    previewName: {
        marginBottom: 2,
    },
    previewSubtitle: {
        opacity: 0.8,
    },
    menuContainer: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    menuText: {
        flex: 1,
    },
    closeButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 8,
    },
    closeText: {},
});

export default memo(InstructorContextMenu);
