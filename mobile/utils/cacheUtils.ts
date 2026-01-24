import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_TTL = 1000 * 60 * 30; // 30 minutes

interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

/**
 * Saves data to local storage with a TTL.
 */
export async function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            ttl,
        };
        await AsyncStorage.setItem(`@vrumi_cache_${key}`, JSON.stringify(item));
    } catch (error) {
        console.error(`[Cache] Error setting key ${key}:`, error);
    }
}

/**
 * Retrieves data from local storage.
 * returns null if not found or expired.
 */
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const json = await AsyncStorage.getItem(`@vrumi_cache_${key}`);
        if (!json) return null;

        const item: CacheItem<T> = JSON.parse(json);
        const isExpired = Date.now() - item.timestamp > item.ttl;

        if (isExpired) {
            await AsyncStorage.removeItem(`@vrumi_cache_${key}`);
            return null;
        }

        return item.data;
    } catch (error) {
        console.error(`[Cache] Error getting key ${key}:`, error);
        return null;
    }
}

/**
 * Force clear a specific cache key.
 */
export async function clearCache(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(`@vrumi_cache_${key}`);
    } catch (error) {
        console.error(`[Cache] Error clearing key ${key}:`, error);
    }
}
