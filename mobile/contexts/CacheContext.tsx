import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Types
interface Flashcard {
    id: string;
    front: string;
    back: string;
    category: string;
    difficulty?: number;
    next_review?: string;
    ease_factor?: number;
    repetitions?: number;
}

interface CachedData {
    flashcards: Flashcard[];
    lastSync: string;
    version: number;
}

interface CacheContextType {
    // Flashcards
    cachedFlashcards: Flashcard[];
    isOffline: boolean;
    isSyncing: boolean;
    lastSyncTime: Date | null;

    // Actions
    cacheFlashcards: (flashcards: Flashcard[]) => Promise<void>;
    getCachedFlashcards: () => Promise<Flashcard[]>;
    updateCachedFlashcard: (flashcard: Flashcard) => Promise<void>;
    clearCache: () => Promise<void>;
    syncWithServer: () => Promise<void>;
}

const CACHE_KEY = 'vrumi_flashcards_cache';
const CACHE_VERSION = 1;

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export function CacheProvider({ children }: { children: React.ReactNode }) {
    const [cachedFlashcards, setCachedFlashcards] = useState<Flashcard[]>([]);
    const [isOffline, setIsOffline] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    // Monitor network status
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const offline = !state.isConnected || !state.isInternetReachable;
            setIsOffline(offline);

            // Auto-sync when coming back online
            if (!offline && isOffline) {
                console.log('Back online, syncing...');
                // Could trigger sync here
            }
        });

        // Initial check
        NetInfo.fetch().then(state => {
            setIsOffline(!state.isConnected || !state.isInternetReachable);
        });

        // Load cached data on mount
        loadCachedData();

        return () => unsubscribe();
    }, []);

    const loadCachedData = async () => {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) {
                const data: CachedData = JSON.parse(cached);
                if (data.version === CACHE_VERSION) {
                    setCachedFlashcards(data.flashcards);
                    setLastSyncTime(new Date(data.lastSync));
                    console.log(`Loaded ${data.flashcards.length} cached flashcards`);
                }
            }
        } catch (error) {
            console.error('Error loading cached data:', error);
        }
    };

    const cacheFlashcards = useCallback(async (flashcards: Flashcard[]) => {
        try {
            const data: CachedData = {
                flashcards,
                lastSync: new Date().toISOString(),
                version: CACHE_VERSION,
            };
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
            setCachedFlashcards(flashcards);
            setLastSyncTime(new Date());
            console.log(`Cached ${flashcards.length} flashcards`);
        } catch (error) {
            console.error('Error caching flashcards:', error);
        }
    }, []);

    const getCachedFlashcards = useCallback(async (): Promise<Flashcard[]> => {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) {
                const data: CachedData = JSON.parse(cached);
                return data.flashcards;
            }
            return [];
        } catch (error) {
            console.error('Error getting cached flashcards:', error);
            return [];
        }
    }, []);

    const updateCachedFlashcard = useCallback(async (updatedFlashcard: Flashcard) => {
        try {
            const newFlashcards = cachedFlashcards.map(fc =>
                fc.id === updatedFlashcard.id ? updatedFlashcard : fc
            );
            await cacheFlashcards(newFlashcards);
        } catch (error) {
            console.error('Error updating cached flashcard:', error);
        }
    }, [cachedFlashcards, cacheFlashcards]);

    const clearCache = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(CACHE_KEY);
            setCachedFlashcards([]);
            setLastSyncTime(null);
            console.log('Cache cleared');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }, []);

    const syncWithServer = useCallback(async () => {
        if (isOffline) {
            console.log('Cannot sync while offline');
            return;
        }

        setIsSyncing(true);
        try {
            // This would typically call your Supabase API to sync
            // For now, we just update the sync time
            setLastSyncTime(new Date());
            console.log('Sync completed');
        } catch (error) {
            console.error('Error syncing with server:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isOffline]);

    return (
        <CacheContext.Provider
            value={{
                cachedFlashcards,
                isOffline,
                isSyncing,
                lastSyncTime,
                cacheFlashcards,
                getCachedFlashcards,
                updateCachedFlashcard,
                clearCache,
                syncWithServer,
            }}
        >
            {children}
        </CacheContext.Provider>
    );
}

export function useCache() {
    const context = useContext(CacheContext);
    if (!context) {
        throw new Error('useCache must be used within a CacheProvider');
    }
    return context;
}

// Utility hook for offline-aware data fetching
export function useOfflineFirst<T>(
    fetchFn: () => Promise<T>,
    cacheKey: string,
    dependencies: any[] = []
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { isOffline } = useCache();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Try to get cached data first
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setData(JSON.parse(cached));
                }

                // If online, fetch fresh data
                if (!isOffline) {
                    const freshData = await fetchFn();
                    setData(freshData);
                    await AsyncStorage.setItem(cacheKey, JSON.stringify(freshData));
                }
            } catch (err) {
                setError(err as Error);
                console.error('Error in useOfflineFirst:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isOffline, cacheKey, ...dependencies]);

    return { data, loading, error, isOffline };
}
