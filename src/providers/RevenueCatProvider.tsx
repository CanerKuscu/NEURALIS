import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { PurchasesPackage, CustomerInfo, PurchasesOffering } from 'react-native-purchases';

// RevenueCat API keys — loaded from environment variables, never hardcoded
const API_KEYS = {
    apple: process.env.EXPO_PUBLIC_RC_APPLE_KEY ?? '',
    google: process.env.EXPO_PUBLIC_RC_GOOGLE_KEY ?? '',
} as const;

interface RevenueCatContextType {
    currentOffering: PurchasesOffering | null;
    customerInfo: CustomerInfo | null;
    isPremium: boolean;
    purchasePackage: (pack: PurchasesPackage) => Promise<boolean>;
    restorePurchases: () => Promise<CustomerInfo | null>;
    loading: boolean;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            if (Platform.OS === 'android') {
                // Purchases.configure({ apiKey: API_KEYS.google });
            } else {
                // Purchases.configure({ apiKey: API_KEYS.apple });
            }

            // Mock check for now since we don't have real keys
            // In real app:
            /*
            try {
                const info = await Purchases.getCustomerInfo();
                setCustomerInfo(info);
                checkEntitlements(info);

                const offerings = await Purchases.getOfferings();
                if (offerings.current !== null) {
                    setCurrentOffering(offerings.current);
                }
            } catch (e) {
                console.log('Error initializing RevenueCat', e);
            }
            */
            setLoading(false);
        };

        init();
    }, []);

    const checkEntitlements = (info: CustomerInfo) => {
        if (info.entitlements.active['pro']) {
            setIsPremium(true);
        } else {
            setIsPremium(false);
        }
    };

    const purchasePackage = async (pack: PurchasesPackage) => {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            setCustomerInfo(customerInfo);
            checkEntitlements(customerInfo);
            return true;
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error(e);
            }
            return false;
        }
    };

    const restorePurchases = async () => {
        try {
            const info = await Purchases.restorePurchases();
            setCustomerInfo(info);
            checkEntitlements(info);
            return info;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    return (
        <RevenueCatContext.Provider value={{
            currentOffering,
            customerInfo,
            isPremium, // For now false until real keys
            purchasePackage,
            restorePurchases,
            loading
        }}>
            {children}
        </RevenueCatContext.Provider>
    );
};

export const useRevenueCat = () => {
    const context = useContext(RevenueCatContext);
    if (!context) {
        throw new Error('useRevenueCat must be used within a RevenueCatProvider');
    }
    return context;
};
