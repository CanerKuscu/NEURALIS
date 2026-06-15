/**
 * NEURALIS - Subscription Provider (Mock Implementation)
 * Monetization & Entitlements for Neuralis Pro
 * 
 * Features Unlocked:
 * - Infinite Energy (removes 5-unit cap)
 * - AI Shadow Tutor Access
 * - Exclusive Shadow Fox Skins
 * 
 * Note: This is a mock implementation that checks subscription status from Supabase.
 * Replace with RevenueCat when ready for production.
 */

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// Mock types to replace react-native-purchases
export interface PurchasesPackage {
    identifier: string;
    packageType: string;
    product: {
        title: string;
        description: string;
        priceString: string;
        price: number;
    };
}

export interface CustomerInfo {
    entitlements: {
        active: Record<string, { expirationDate: string | null; willRenew: boolean }>;
    };
}

export interface PurchasesOffering {
    identifier: string;
    availablePackages: PurchasesPackage[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const REVENUECAT_CONFIG = {
    // Entitlement identifiers
    ENTITLEMENTS: {
        PRO: 'neuralis_pro',
        ELITE: 'neuralis_elite',
    },

    // Product identifiers
    PRODUCTS: {
        MONTHLY: 'neuralis_pro_monthly',
        YEARLY: 'neuralis_pro_yearly',
        LIFETIME: 'neuralis_pro_lifetime',
    },
} as const;

// Pricing tiers - $3.99/month for both Android and iOS
const PRICING = {
    monthly: { price: '$3.99', period: 'month', savings: null },
} as const;

// Pro features unlocked
const PRO_FEATURES = {
    infiniteEnergy: true,
    aiShadowTutor: true,
    exclusiveSkins: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customDeadlines: true,
    noAds: true,
    earlyAccess: true,
} as const;

// Free tier limits
const FREE_LIMITS = {
    maxEnergy: 5,
    energyRegenMinutes: 30,
    aiTutorQuestionsPerDay: 3,
    skinsAvailable: ['default'],
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface SubscriptionState {
    isInitialized: boolean;
    isLoading: boolean;
    isPro: boolean;
    isElite: boolean;
    tier: SubscriptionTier;
    customerInfo: CustomerInfo | null;
    offerings: PurchasesOffering | null;
    expirationDate: Date | null;
    willRenew: boolean;
    error: string | null;
}

export interface SubscriptionActions {
    purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
    restorePurchases: () => Promise<boolean>;
    checkEntitlements: () => Promise<void>;
    getAvailablePackages: () => PurchasesPackage[];
    getProFeatures: () => typeof PRO_FEATURES;
    getFreeLimits: () => typeof FREE_LIMITS;
}

interface SubscriptionContextType extends SubscriptionState, SubscriptionActions { }

interface SubscriptionProviderProps {
    children: ReactNode;
    userId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
    children,
    userId,
}) => {
    const [state, setState] = useState<SubscriptionState>({
        isInitialized: false,
        isLoading: true,
        isPro: false,
        isElite: false,
        tier: 'free',
        customerInfo: null,
        offerings: null,
        expirationDate: null,
        willRenew: false,
        error: null,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Initialize RevenueCat
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const init = async () => {
            try {
                const rcAppleKey = process.env.EXPO_PUBLIC_RC_APPLE_KEY;
                const rcGoogleKey = process.env.EXPO_PUBLIC_RC_GOOGLE_KEY;

                if (Platform.OS === 'android' && rcGoogleKey) {
                    Purchases.configure({ apiKey: rcGoogleKey });
                } else if (Platform.OS === 'ios' && rcAppleKey) {
                    Purchases.configure({ apiKey: rcAppleKey });
                } else {
                    // console.warn('[RevenueCat] No API key found for', Platform.OS, '— running in mock mode');
                    setState(prev => ({ ...prev, isInitialized: true, isLoading: false }));
                    return;
                }

                // Check Subscription
                const info = await Purchases.getCustomerInfo();
                const isPro = info.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENTS.PRO] !== undefined;
                const isElite = info.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENTS.ELITE] !== undefined;

                setState(prev => ({
                    ...prev,
                    isInitialized: true,
                    isLoading: false,
                    isPro,
                    isElite,
                    tier: isElite ? 'elite' : isPro ? 'pro' : 'free',
                    customerInfo: info as unknown as CustomerInfo,
                }));
            } catch (e) {
                console.warn('RevenueCat init failed (likely no keys)', e);
                setState(prev => ({ ...prev, isInitialized: true, isLoading: false }));
            }
        };
        init();
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Check Entitlements
    // ─────────────────────────────────────────────────────────────────────────

    const checkEntitlements = async (info?: CustomerInfo) => {
        try {
            const rcAppleKey = process.env.EXPO_PUBLIC_RC_APPLE_KEY;
            const rcGoogleKey = process.env.EXPO_PUBLIC_RC_GOOGLE_KEY;
            if (!rcAppleKey && !rcGoogleKey) return; // No keys, skip

            const customerInfo = info || (await Purchases.getCustomerInfo()) as unknown as CustomerInfo;
            const isPro = customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENTS.PRO] !== undefined;
            const isElite = customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENTS.ELITE] !== undefined;
            setState(prev => ({ ...prev, isPro, isElite, tier: isElite ? 'elite' : isPro ? 'pro' : 'free', customerInfo }));
        } catch (e) {
            console.warn('[RevenueCat] checkEntitlements failed:', e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Purchase
    // ─────────────────────────────────────────────────────────────────────────

    const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
            // const { customerInfo } = await Purchases.purchasePackage(pkg);
            // checkEntitlements(customerInfo);

            if (__DEV__) {
                // Mock success in development only — never ships to production
                setTimeout(() => {
                    setState(prev => ({ ...prev, isPro: true, isLoading: false }));
                    console.log('[DEV] Mock purchase successful — Pro activated.');
                }, 1000);
            } else {
                const { customerInfo } = await Purchases.purchasePackage(pkg as any);
                const isPro = (customerInfo as any).entitlements?.active?.[REVENUECAT_CONFIG.ENTITLEMENTS.PRO] !== undefined;
                setState(prev => ({ ...prev, isPro, isLoading: false, customerInfo: customerInfo as unknown as CustomerInfo }));
            }

            return true;
        } catch (e: unknown) {
            const error = e as { userCancelled?: boolean; message?: string };
            if (!error.userCancelled) {
                console.warn('Purchase failed:', error.message);
            }
            setState(prev => ({ ...prev, isLoading: false }));
            return false;
        }
    }, []);

    const restorePurchases = useCallback(async (): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
            const rcAppleKey = process.env.EXPO_PUBLIC_RC_APPLE_KEY;
            const rcGoogleKey = process.env.EXPO_PUBLIC_RC_GOOGLE_KEY;
            if (rcAppleKey || rcGoogleKey) {
                const info = await Purchases.restorePurchases();
                const isPro = (info as any).entitlements?.active?.[REVENUECAT_CONFIG.ENTITLEMENTS.PRO] !== undefined;
                setState(prev => ({ ...prev, isPro, isLoading: false, customerInfo: info as unknown as CustomerInfo }));
            } else {
                setState(prev => ({ ...prev, isLoading: false }));
            }
            return true;
        } catch (e) {
            setState(prev => ({ ...prev, isLoading: false }));
            return false;
        }
    }, []);

    const getAvailablePackages = useCallback((): PurchasesPackage[] => {
        // Return mock packages if offerings are null (dev mode)
        return state.offerings?.availablePackages || [
            {
                identifier: 'monthly',
                packageType: 'MONTHLY',
                product: { title: 'Monthly', description: 'Pro access', price: 9.99, priceString: '$9.99' }
            },
            {
                identifier: 'yearly',
                packageType: 'ANNUAL',
                product: { title: 'Yearly', description: 'Best value', price: 79.99, priceString: '$79.99' }
            }
        ] as any;
    }, [state.offerings]);

    // ... rest of context ...

    return (
        <SubscriptionContext.Provider value={{
            ...state,
            purchasePackage,
            restorePurchases,
            checkEntitlements: async () => { },
            getAvailablePackages,
            getProFeatures: () => PRO_FEATURES,
            getFreeLimits: () => FREE_LIMITS
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export const useSubscription = (): SubscriptionContextType => {
    const context = useContext(SubscriptionContext);

    if (!context) {
        throw new Error(
            'useSubscription must be used within a SubscriptionProvider'
        );
    }

    return context;
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if user has access to a specific feature
 */
export const useHasFeature = (feature: keyof typeof PRO_FEATURES): boolean => {
    const { isPro, isElite } = useSubscription();

    if (isPro || isElite) {
        return PRO_FEATURES[feature];
    }

    return false;
};

/**
 * Get energy cap based on subscription
 */
export const useEnergyCap = (): number => {
    const { isPro, isElite } = useSubscription();

    if (isPro || isElite) {
        return 999; // Infinite
    }

    return FREE_LIMITS.maxEnergy;
};

/**
 * Check if user can use AI Tutor
 */
export const useCanUseAITutor = (questionsUsedToday: number): boolean => {
    const { isPro, isElite } = useSubscription();

    if (isPro || isElite) {
        return true;
    }

    return questionsUsedToday < FREE_LIMITS.aiTutorQuestionsPerDay;
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
    REVENUECAT_CONFIG,
    PRICING,
    PRO_FEATURES,
    FREE_LIMITS,
};

export default SubscriptionProvider;
