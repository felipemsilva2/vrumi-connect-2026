import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { VEHICLE_MODELS, VehicleModel } from '../data/vehicleModels';

interface VehiclePickerProps {
    selectedModelId: string | null;
    onSelect: (model: VehicleModel) => void;
    placeholder?: string;
}

export default function VehiclePicker({ selectedModelId, onSelect, placeholder = 'Selecione o modelo' }: VehiclePickerProps) {
    const { theme, isDark } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedModel = VEHICLE_MODELS.find(v => v.id === selectedModelId);

    const filteredModels = VEHICLE_MODELS.filter(model => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            model.displayName.toLowerCase().includes(query) ||
            model.brand.toLowerCase().includes(query) ||
            model.model.toLowerCase().includes(query)
        );
    });

    // Group by brand
    const groupedModels = filteredModels.reduce((acc, model) => {
        if (!acc[model.brand]) {
            acc[model.brand] = [];
        }
        acc[model.brand].push(model);
        return acc;
    }, {} as Record<string, VehicleModel[]>);

    const handleSelect = (model: VehicleModel) => {
        onSelect(model);
        setModalVisible(false);
        setSearchQuery('');
    };

    const renderBrandSection = ({ item }: { item: [string, VehicleModel[]] }) => {
        const [brand, models] = item;
        return (
            <View style={styles.brandSection}>
                <Text style={[styles.brandTitle, { color: theme.textSecondary }]}>{brand}</Text>
                {models.map(model => (
                    <TouchableOpacity
                        key={model.id}
                        style={[
                            styles.modelItem,
                            { backgroundColor: selectedModelId === model.id ? theme.primaryLight : 'transparent' }
                        ]}
                        onPress={() => handleSelect(model)}
                    >
                        <View style={[styles.carIconCircle, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                            <Ionicons name="car-sport" size={20} color={theme.primary} />
                        </View>
                        <Text style={[styles.modelName, { color: theme.text }]}>{model.model}</Text>
                        {selectedModelId === model.id && (
                            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.picker, { backgroundColor: theme.card, borderColor: theme.inputBorder }]}
                onPress={() => setModalVisible(true)}
            >
                <View style={[styles.pickerIconCircle, { backgroundColor: isDark ? '#374151' : '#f0fdf4' }]}>
                    <Ionicons name="car-sport" size={20} color={theme.primary} />
                </View>
                <Text style={[
                    styles.pickerText,
                    { color: selectedModel ? theme.text : theme.textMuted }
                ]}>
                    {selectedModel ? selectedModel.displayName : placeholder}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Selecione o Modelo</Text>
                            <TouchableOpacity
                                style={[styles.closeButton, { backgroundColor: theme.card }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Ionicons name="close" size={22} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.inputBorder }]}>
                            <Ionicons name="search" size={18} color={theme.textMuted} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.text }]}
                                placeholder="Buscar modelo..."
                                placeholderTextColor={theme.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Models List */}
                        <FlatList
                            data={Object.entries(groupedModels)}
                            keyExtractor={([brand]) => brand}
                            renderItem={renderBrandSection}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
        gap: 12,
    },
    pickerIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingBottom: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    brandSection: {
        marginBottom: 16,
    },
    brandTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    modelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 4,
        gap: 12,
    },
    carIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modelName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
});
