import React, { useRef, useEffect, useMemo } from 'react';
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
import { useInstructorStatus } from '../hooks/useInstructorStatus';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabConfig {
    name: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconActive: keyof typeof Ionicons.glyphMap;
}

const BASE_TABS: TabConfig[] = [
    { name: 'index', label: 'Início', icon: 'home-outline', iconActive: 'home' },
    { name: 'buscar', label: 'Buscar', icon: 'search-outline', iconActive: 'search' },
    { name: 'aulas', label: 'Aulas', icon: 'calendar-outline', iconActive: 'calendar' },
    { name: 'perfil', label: 'Perfil', icon: 'person-outline', iconActive: 'person' },
];

const INSTRUCTOR_TAB: TabConfig = {
    name: 'instrutor',
    label: 'Instrutor',
    icon: 'car-outline',
    iconActive: 'car',
};

export default function ModernTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { theme, isDark } = useTheme();
    const { isInstructor } = useInstructorStatus();

    // Dynamically build tabs array
    const TABS = useMemo(() => {
        if (isInstructor) {
            // Insert instructor tab before perfil
            return [
                ...BASE_TABS.slice(0, 3),
                INSTRUCTOR_TAB,
                BASE_TABS[3],
            ];
        }
        return BASE_TABS;
    }, [isInstructor]);

    const TAB_WIDTH = SCREEN_WIDTH / TABS.length;

    // Animated values for each tab - always create for max tabs (5)
    const animations = useRef([...Array(5)].map(() => ({
        scale: new Animated.Value(1),
        translateY: new Animated.Value(0),
        opacity: new Animated.Value(0.6),
    }))).current;

    // Indicator position animation
    const indicatorPosition = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Find actual index in our TABS array
        const currentRouteName = state.routes[state.index]?.name;
        const tabIndex = TABS.findIndex(t => t.name === currentRouteName);

        if (tabIndex === -1) return;

        // Animate all tabs
        TABS.forEach((_, index) => {
            const isActive = index === tabIndex;
            const anim = animations[index];

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
            toValue: tabIndex * TAB_WIDTH,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
        }).start();
    }, [state.index, TABS, TAB_WIDTH]);

    const handlePress = (routeName: string, index: number) => {
        const route = state.routes.find(r => r.name === routeName);
        if (!route) {
            navigation.navigate(routeName);
            return;
        }

        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
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

    // Get current active tab index
    const currentRouteName = state.routes[state.index]?.name;
    const activeTabIndex = TABS.findIndex(t => t.name === currentRouteName);

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
                        width: TAB_WIDTH - 24,
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
                        width: TAB_WIDTH - 16,
                        transform: [{ translateX: indicatorPosition }],
                    },
                ]}
            />

            {TABS.map((tab, index) => {
                const isActive = index === activeTabIndex;
                const anim = animations[index];

                return (
                    <TouchableOpacity
                        key={tab.name}
                        style={[styles.tab, { width: TAB_WIDTH }]}
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
                                size={22}
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
                                numberOfLines={1}
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
        marginLeft: 12,
        height: 3,
        borderRadius: 2,
    },
    activeBackground: {
        position: 'absolute',
        top: 8,
        marginLeft: 8,
        height: 48,
        borderRadius: 16,
    },
    tab: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 8,
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        marginTop: 4,
    },
});
