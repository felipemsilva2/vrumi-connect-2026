import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabConfig {
    name: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconActive: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
    { name: 'index', label: 'Início', icon: 'home-outline', iconActive: 'home' },
    { name: 'buscar', label: 'Buscar', icon: 'search-outline', iconActive: 'search' },
    { name: 'aulas', label: 'Aulas', icon: 'calendar-outline', iconActive: 'calendar' },
    { name: 'perfil', label: 'Perfil', icon: 'person-outline', iconActive: 'person' },
];

const TAB_WIDTH = SCREEN_WIDTH / TABS.length;

export default function ModernTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { theme, isDark } = useTheme();

    // Animated values for each tab
    const animations = useRef(TABS.map(() => ({
        scale: new Animated.Value(1),
        translateY: new Animated.Value(0),
        opacity: new Animated.Value(0.6),
    }))).current;

    // Indicator position animation
    const indicatorPosition = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate all tabs
        animations.forEach((anim, index) => {
            const isActive = index === state.index;

            Animated.parallel([
                Animated.spring(anim.scale, {
                    toValue: isActive ? 1.1 : 1,
                    friction: 5,
                    tension: 100,
                    useNativeDriver: true,
                }),
                Animated.spring(anim.translateY, {
                    toValue: isActive ? -4 : 0,
                    friction: 5,
                    tension: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(anim.opacity, {
                    toValue: isActive ? 1 : 0.6,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        });

        // Animate indicator
        Animated.spring(indicatorPosition, {
            toValue: state.index * TAB_WIDTH,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
        }).start();
    }, [state.index]);

    const handlePress = (routeName: string, index: number) => {
        const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[index].key,
            canPreventDefault: true,
        });

        if (!event.defaultPrevented) {
            navigation.navigate(routeName);
        }

        // Bounce animation
        Animated.sequence([
            Animated.timing(animations[index].translateY, {
                toValue: -10,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(animations[index].translateY, {
                toValue: -4,
                friction: 3,
                tension: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <View style={[styles.container, {
            backgroundColor: isDark ? theme.card : '#ffffff',
            borderTopColor: theme.cardBorder,
        }]}>
            {/* Animated Indicator Line */}
            <Animated.View
                style={[
                    styles.indicator,
                    {
                        backgroundColor: theme.primary,
                        transform: [{ translateX: indicatorPosition }],
                    },
                ]}
            />

            {/* Active Background */}
            <Animated.View
                style={[
                    styles.activeBackground,
                    {
                        backgroundColor: theme.primary + '15',
                        transform: [{ translateX: indicatorPosition }],
                    },
                ]}
            />

            {TABS.map((tab, index) => {
                const isActive = index === state.index;
                const anim = animations[index];

                return (
                    <TouchableOpacity
                        key={tab.name}
                        style={styles.tab}
                        onPress={() => handlePress(tab.name, index)}
                        activeOpacity={0.7}
                    >
                        <Animated.View
                            style={[
                                styles.tabContent,
                                {
                                    transform: [
                                        { scale: anim.scale },
                                        { translateY: anim.translateY },
                                    ],
                                    opacity: anim.opacity,
                                },
                            ]}
                        >
                            <Ionicons
                                name={isActive ? tab.iconActive : tab.icon}
                                size={24}
                                color={isActive ? theme.primary : theme.textMuted}
                            />
                            <Text
                                style={[
                                    styles.label,
                                    {
                                        color: isActive ? theme.primary : theme.textMuted,
                                        fontWeight: isActive ? '700' : '500',
                                    },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 80,
        paddingBottom: 16,
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 12,
        position: 'relative',
    },
    indicator: {
        position: 'absolute',
        top: 0,
        width: TAB_WIDTH - 24,
        marginLeft: 12,
        height: 3,
        borderRadius: 2,
    },
    activeBackground: {
        position: 'absolute',
        top: 8,
        width: TAB_WIDTH - 16,
        marginLeft: 8,
        height: 48,
        borderRadius: 16,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 8,
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 11,
        marginTop: 4,
    },
});
