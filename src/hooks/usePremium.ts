import { useCallback } from 'react';
import useNeuralisStore from '../store/useNeuralisStore';

// Lightweight premium hook: reads user profile's `subscription` field and exposes helpers.
export default function usePremium() {
    const user = useNeuralisStore((s) => s.user);

    // Check subscription field from UserProfile (types/index.ts)
    const isPremium = user?.subscription === 'premium' || user?.subscription === 'shadow_elite';

    const isAdFree = isPremium; // future: map different tiers
    const hasInfiniteLives = isPremium; // premium grants infinite lives

    const purchase = useCallback(async (productId?: string) => {
        // TODO: integrate with purchases SDK (react-native-purchases / RevenueCat)
        // For now return a simulated success and caller should update profile via backend
        return { success: true, productId };
    }, []);

    const restore = useCallback(async () => {
        // TODO: restore purchases via SDK
        return { success: true };
    }, []);

    return {
        isPremium,
        isAdFree,
        hasInfiniteLives,
        purchase,
        restore,
    };
}
