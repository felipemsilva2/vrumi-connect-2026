import React, { useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { useInstructorStatus } from '../hooks/useInstructorStatus';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LAST_TAB_KEY = 'vrumi_last_tab';

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
    { name: 'mensagens', label: 'Mensagens', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
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
    const insets = useSafeAreaInsets();

    // Calculate bottom padding - use safe area insets on Android with navigation bar
    const bottomPadding = Math.max(insets.bottom, 16);

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
            Haptics.selectionAsync();
            AsyncStorage.setItem(LAST_TAB_KEY, routeName).catch(() => { });
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
        <BlurView
            intensity={Platform.OS === 'ios' ? 85 : 0}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.container, {
                backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
                paddingBottom: bottomPadding,
                height: 64 + bottomPadding,
            }]}
        >
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
                        accessibilityLabel={tab.label}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isActive }}
                        accessibilityHint={`Navegar para ${tab.label}`}
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
        </BlurView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 12,
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
