import { QueryClient } from "@tanstack/react-query";
import { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";

/**
 * Creates an IndexedDB persister for TanStack Query
 */
export function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery"): Persister {
    return {
        persistClient: async (client: PersistedClient) => {
            await set(idbValidKey, client);
        },
        restoreClient: async () => {
            return await get<PersistedClient>(idbValidKey);
        },
        removeClient: async () => {
            await del(idbValidKey);
        },
    };
}

/**
 * Global QueryClient configuration
 * - gcTime: 7 days (keep unused data for a week)
 * - staleTime: 5 minutes (consider data fresh for 5 minutes)
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            networkMode: 'offlineFirst', // Enable offline access
        },
    },
});

export const persister = createIDBPersister();
