import React, { memo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../contexts/ThemeContext';

interface ServiceItemProps {
    id: string;
    icon: string;
    label: string;
    color: string;
    theme: Theme;
    onPress: (id: string) => void;
}

const ServiceItem = ({ id, icon, label, color, theme, onPress }: ServiceItemProps) => {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress(id)}
            accessibilityLabel={label}
            accessibilityRole="button"
            activeOpacity={0.7}
        >
            <View style={[
                styles.iconContainer,
                { backgroundColor: theme.isDark ? theme.card : `${color}15` }
            ]}>
                <Ionicons name={icon as any} size={26} color={color} />
            </View>
            <Text
                style={[styles.label, { color: theme.textSecondary }]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: 80,
        marginRight: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        width: '100%',
    },
});

export default memo(ServiceItem);
