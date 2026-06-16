/**
 * Type declarations for react-native-purchases
 * RevenueCat SDK types
 */

declare module 'react-native-purchases' {
  export interface PurchasesPackage {
    identifier: string;
    packageType: string;
    product: PurchasesStoreProduct;
    offeringIdentifier: string;
  }

  export interface PurchasesStoreProduct {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
    introPrice: PurchasesIntroPrice | null;
    discounts: PurchasesStoreProductDiscount[];
    subscriptionPeriod: string | null;
  }

  export interface PurchasesIntroPrice {
    price: number;
    priceString: string;
    cycles: number;
    period: string;
    periodUnit: string;
    periodNumberOfUnits: number;
  }

  export interface PurchasesStoreProductDiscount {
    identifier: string;
    price: number;
    priceString: string;
    cycles: number;
    period: string;
    periodUnit: string;
    periodNumberOfUnits: number;
  }

  export interface CustomerInfo {
    entitlements: {
      all: Record<string, EntitlementInfo>;
      active: Record<string, EntitlementInfo>;
    };
    activeSubscriptions: string[];
    allPurchasedProductIdentifiers: string[];
    latestExpirationDate: string | null;
    firstSeen: string;
    originalAppUserId: string;
    requestDate: string;
    originalApplicationVersion: string | null;
    originalPurchaseDate: string | null;
    managementURL: string | null;
  }

  export interface EntitlementInfo {
    identifier: string;
    isActive: boolean;
    willRenew: boolean;
    periodType: string;
    latestPurchaseDate: string;
    latestPurchaseDateMillis: number;
    originalPurchaseDate: string;
    originalPurchaseDateMillis: number;
    expirationDate: string | null;
    expirationDateMillis: number | null;
    store: string;
    productIdentifier: string;
    isSandbox: boolean;
    unsubscribeDetectedAt: string | null;
    billingIssueDetectedAt: string | null;
    ownershipType: string;
  }

  export interface PurchasesOffering {
    identifier: string;
    serverDescription: string;
    metadata: Record<string, unknown>;
    availablePackages: PurchasesPackage[];
    lifetime: PurchasesPackage | null;
    annual: PurchasesPackage | null;
    sixMonth: PurchasesPackage | null;
    threeMonth: PurchasesPackage | null;
    twoMonth: PurchasesPackage | null;
    monthly: PurchasesPackage | null;
    weekly: PurchasesPackage | null;
  }

  export interface PurchasesOfferings {
    all: Record<string, PurchasesOffering>;
    current: PurchasesOffering | null;
  }

  export interface LogInResult {
    customerInfo: CustomerInfo;
    created: boolean;
  }

  export interface PurchaseResult {
    productIdentifier: string;
    customerInfo: CustomerInfo;
  }

  export enum LOG_LEVEL {
    VERBOSE = 'VERBOSE',
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
  }

  export enum PURCHASES_ERROR_CODE {
    UNKNOWN_ERROR = 0,
    PURCHASE_CANCELLED_ERROR = 1,
    STORE_PROBLEM_ERROR = 2,
    PURCHASE_NOT_ALLOWED_ERROR = 3,
    PURCHASE_INVALID_ERROR = 4,
    PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR = 5,
    PRODUCT_ALREADY_PURCHASED_ERROR = 6,
    RECEIPT_ALREADY_IN_USE_ERROR = 7,
    INVALID_RECEIPT_ERROR = 8,
    MISSING_RECEIPT_FILE_ERROR = 9,
    NETWORK_ERROR = 10,
    INVALID_CREDENTIALS_ERROR = 11,
    UNEXPECTED_BACKEND_RESPONSE_ERROR = 12,
    RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR = 13,
    INVALID_APP_USER_ID_ERROR = 14,
    OPERATION_ALREADY_IN_PROGRESS_ERROR = 15,
    UNKNOWN_BACKEND_ERROR = 16,
    INVALID_APPLE_SUBSCRIPTION_KEY_ERROR = 17,
    INELIGIBLE_ERROR = 18,
    INSUFFICIENT_PERMISSIONS_ERROR = 19,
    PAYMENT_PENDING_ERROR = 20,
    INVALID_SUBSCRIBER_ATTRIBUTES_ERROR = 21,
    LOG_OUT_WITH_ANONYMOUS_USER_ERROR = 22,
    CONFIGURATION_ERROR = 23,
    UNSUPPORTED_ERROR = 24,
  }

  export interface ConfigureParams {
    apiKey: string;
    appUserID?: string | null;
    observerMode?: boolean;
    userDefaultsSuiteName?: string;
    usesStoreKit2IfAvailable?: boolean;
    useAmazon?: boolean;
  }

  interface CustomerInfoUpdateListener {
    remove: () => void;
  }

  const Purchases: {
    configure: (params: ConfigureParams) => Promise<void>;
    setLogLevel: (level: LOG_LEVEL) => void;
    logIn: (appUserID: string) => Promise<LogInResult>;
    logOut: () => Promise<CustomerInfo>;
    getCustomerInfo: () => Promise<CustomerInfo>;
    getOfferings: () => Promise<PurchasesOfferings>;
    purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<PurchaseResult>;
    restorePurchases: () => Promise<CustomerInfo>;
    addCustomerInfoUpdateListener: (
      listener: (customerInfo: CustomerInfo) => void,
    ) => CustomerInfoUpdateListener;
    isConfigured: () => boolean;
    getAppUserID: () => Promise<string>;
    setAttributes: (attributes: Record<string, string | null>) => Promise<void>;
    setEmail: (email: string | null) => Promise<void>;
    setPhoneNumber: (phoneNumber: string | null) => Promise<void>;
    setDisplayName: (displayName: string | null) => Promise<void>;
    collectDeviceIdentifiers: () => Promise<void>;
  };

  export default Purchases;
}
