import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface PushNotificationState {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
    error: string | null;
}

export function usePushNotifications(userId: string | undefined) {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const [error, setError] = useState<string | null>(null);

    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        if (!userId) return;

        // Register for push notifications
        registerForPushNotificationsAsync()
            .then(token => {
                if (token) {
                    setExpoPushToken(token);
                    saveTokenToDatabase(userId, token);
                }
            })
            .catch(err => setError(err.message));

        // Listen for incoming notifications (foreground)
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        // Listen for user interaction with notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            handleNotificationNavigation(data);
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [userId]);

    return { expoPushToken, notification, error };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permissions denied');
        return null;
    }

    // Get Expo Push Token
    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

        if (!projectId) {
            // Fallback for development
            const token = await Notifications.getExpoPushTokenAsync();
            return token.data;
        }

        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        return token.data;
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
}

async function saveTokenToDatabase(userId: string, token: string) {
    try {
        const platform = Platform.OS as 'ios' | 'android' | 'web';

        // Upsert token (insert or update if exists)
        const { error } = await (supabase as any)
            .from('push_tokens')
            .upsert({
                user_id: userId,
                token: token,
                platform: platform,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,token',
            });

        if (error) {
            console.error('Error saving push token:', error);
        } else {
            console.log('Push token saved successfully');
        }
    } catch (error) {
        console.error('Error in saveTokenToDatabase:', error);
    }
}

function handleNotificationNavigation(data: any) {
    // Navigate based on notification data
    if (data?.type === 'booking_confirmed' && data?.bookingId) {
        router.push('/(tabs)/aulas');
    } else if (data?.type === 'lesson_reminder' && data?.bookingId) {
        router.push('/(tabs)/aulas');
    } else if (data?.type === 'rate_instructor' && data?.bookingId) {
        router.push(`/connect/instrutor/${data.instructorId}`);
    }
}

// Utility function to remove token on logout
export async function removeTokenFromDatabase(userId: string, token: string) {
    try {
        const { error } = await (supabase as any)
            .from('push_tokens')
            .delete()
            .eq('user_id', userId)
            .eq('token', token);

        if (error) {
            console.error('Error removing push token:', error);
        }
    } catch (error) {
        console.error('Error in removeTokenFromDatabase:', error);
    }
}
