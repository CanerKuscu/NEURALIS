/**
 * NEURALIS - Offline Support
 * 
 * Provides network state awareness and an offline action queue.
 * When the device is offline, mutations are queued and replayed
 * automatically once connectivity is restored.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK STATE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

let _isOnline = true;

/**
 * Lightweight connectivity check — pings a known fast endpoint.
 * Falls back to true on error (optimistic).
 */
async function checkConnectivity(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch('https://www.google.com/generate_204', {
            method: 'HEAD',
            signal: controller.signal,
        });
        clearTimeout(timeout);
        return response.ok || response.status === 204;
    } catch {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// OFFLINE QUEUE
// ═══════════════════════════════════════════════════════════════════════════

const QUEUE_STORAGE_KEY = '@neuralis_offline_queue';

export interface QueuedAction {
    id: string;
    type: string;
    payload: unknown;
    createdAt: number;
    retries: number;
}

type ActionHandler = (payload: unknown) => Promise<void>;
const actionHandlers = new Map<string, ActionHandler>();

/**
 * Register a handler for a specific action type.
 * When connectivity is restored, queued actions of this type
 * will be replayed through the handler.
 *
 * @example
 * registerOfflineHandler('RECORD_ERROR', async (payload) => {
 *     await neuralArchive.recordError(payload as any);
 * });
 */
export function registerOfflineHandler(type: string, handler: ActionHandler): void {
    actionHandlers.set(type, handler);
}

async function loadQueue(): Promise<QueuedAction[]> {
    try {
        const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

async function saveQueue(queue: QueuedAction[]): Promise<void> {
    try {
        await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch {
        // Best-effort persistence
    }
}

/**
 * Enqueue an action to be executed when online.
 * If currently online, executes immediately.
 */
export async function enqueueOfflineAction(type: string, payload: unknown): Promise<void> {
    if (_isOnline) {
        const handler = actionHandlers.get(type);
        if (handler) {
            try {
                await handler(payload);
                return;
            } catch {
                // Fall through to queue
            }
        }
    }

    const queue = await loadQueue();
    queue.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        payload,
        createdAt: Date.now(),
        retries: 0,
    });
    await saveQueue(queue);
}

/**
 * Process all queued actions. Called automatically when connectivity is restored.
 */
async function processQueue(): Promise<{ processed: number; failed: number }> {
    const queue = await loadQueue();
    if (queue.length === 0) return { processed: 0, failed: 0 };

    let processed = 0;
    const remaining: QueuedAction[] = [];

    for (const action of queue) {
        const handler = actionHandlers.get(action.type);
        if (!handler) {
            // No handler registered — keep in queue
            remaining.push(action);
            continue;
        }

        try {
            await handler(action.payload);
            processed++;
        } catch {
            action.retries++;
            if (action.retries < 5) {
                remaining.push(action);
            }
            // Drop after 5 retries
        }
    }

    await saveQueue(remaining);
    return { processed, failed: remaining.length };
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook providing network state and offline queue status.
 *
 * @example
 * const { isOnline, queueSize } = useOffline();
 * if (!isOnline) showBanner('You are offline. Changes will sync when connected.');
 */
export function useOffline() {
    const [isOnline, setIsOnline] = useState(_isOnline);
    const [queueSize, setQueueSize] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const refresh = useCallback(async () => {
        const online = await checkConnectivity();
        const wasOffline = !_isOnline;
        _isOnline = online;
        setIsOnline(online);

        // Auto-process queue when coming back online
        if (online && wasOffline) {
            const result = await processQueue();
            if (result.processed > 0) {
                console.log(`[Offline] Synced ${result.processed} queued actions`);
            }
        }

        const queue = await loadQueue();
        setQueueSize(queue.length);
    }, []);

    useEffect(() => {
        refresh();

        // Poll connectivity every 15 seconds
        intervalRef.current = setInterval(refresh, 15_000);

        // Also check on app foregrounding
        const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active') refresh();
        });

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            sub.remove();
        };
    }, [refresh]);

    return { isOnline, queueSize, refresh };
}

/**
 * Get current network state synchronously (cached).
 */
export function getIsOnline(): boolean {
    return _isOnline;
}
