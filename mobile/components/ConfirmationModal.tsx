import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    type?: 'warning' | 'danger' | 'success' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    options?: { label: string; value: string; icon?: keyof typeof Ionicons.glyphMap }[];
    onSelectOption?: (value: string) => void;
    loading?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const typeColors = {
    warning: { bg: '#fef3c7', icon: '#d97706', iconName: 'warning' as const },
    danger: { bg: '#fee2e2', icon: '#dc2626', iconName: 'alert-circle' as const },
    success: { bg: '#dcfce7', icon: '#16a34a', iconName: 'checkmark-circle' as const },
    info: { bg: '#dbeafe', icon: '#2563eb', iconName: 'information-circle' as const },
};

export default function ConfirmationModal({
    visible,
    onClose,
    title,
    message,
    icon,
    iconColor,
    type = 'warning',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    options,
    onSelectOption,
    loading = false,
}: ConfirmationModalProps) {
    const { theme, isDark } = useTheme();
    const typeStyle = typeColors[type];

    const handleConfirm = () => {
        onConfirm?.();
        onClose();
    };

    const handleCancel = () => {
        onCancel?.();
        onClose();
    };

    const handleSelectOption = (value: string) => {
        onSelectOption?.(value);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.container, { backgroundColor: theme.card }]}>
                            {/* Icon Header */}
                            <View style={[styles.iconContainer, { backgroundColor: typeStyle.bg }]}>
                                <Ionicons
                                    name={icon || typeStyle.iconName}
                                    size={32}
                                    color={iconColor || typeStyle.icon}
                                />
                            </View>

                            {/* Title */}
                            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

                            {/* Message */}
                            {message && (
                                <Text style={[styles.message, { color: theme.textSecondary }]}>
                                    {message}
                                </Text>
                            )}

                            {/* Options List (for selection modals) */}
                            {options && options.length > 0 && (
                                <View style={styles.optionsContainer}>
                                    {options.map((option, index) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.optionButton,
                                                {
                                                    backgroundColor: theme.background,
                                                    borderColor: theme.cardBorder,
                                                },
                                                index < options.length - 1 && styles.optionButtonSpacing
                                            ]}
                                            onPress={() => handleSelectOption(option.value)}
                                            activeOpacity={0.7}
                                        >
                                            {option.icon && (
                                                <Ionicons name={option.icon} size={20} color={theme.primary} style={styles.optionIcon} />
                                            )}
                                            <Text style={[styles.optionText, { color: theme.text }]}>
                                                {option.label}
                                            </Text>
                                            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Action Buttons (for confirmation modals) */}
                            {!options && (
                                <View style={styles.buttonsContainer}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton, { borderColor: theme.cardBorder }]}
                                        onPress={handleCancel}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                                            {cancelText}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.button,
                                            styles.confirmButton,
                                            { backgroundColor: type === 'danger' ? '#dc2626' : theme.primary }
                                        ]}
                                        onPress={handleConfirm}
                                        activeOpacity={0.8}
                                        disabled={loading}
                                    >
                                        <Text style={styles.confirmButtonText}>
                                            {loading ? 'Aguarde...' : confirmText}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Close button for options modal */}
                            {options && (
                                <TouchableOpacity
                                    style={[styles.closeButton, { borderColor: theme.cardBorder }]}
                                    onPress={onClose}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>
                                        {cancelText}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: SCREEN_WIDTH - 48,
        maxWidth: 360,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    optionsContainer: {
        width: '100%',
        marginBottom: 16,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    optionButtonSpacing: {
        marginBottom: 10,
    },
    optionIcon: {
        marginRight: 12,
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    buttonsContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: '#10b981',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    closeButton: {
        width: '100%',
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    closeButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
