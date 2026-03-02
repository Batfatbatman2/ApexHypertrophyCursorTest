import { Platform } from 'react-native';
import Constants from 'expo-constants';

// RevenueCat API keys (replace with actual keys in production)
const REVENUE_CAT_API_KEYS = {
  ios: Constants.expoConfig?.extra?.appleApiKey || 'appl_XXXXXXXXXXXX',
  android: Constants.expoConfig?.extra?.androidApiKey || 'goog_XXXXXXXXXXXX',
};

export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    id: 'monthly_premium',
    price: 9.99,
    priceString: '$9.99/month',
    period: 'month',
  },
  YEARLY: {
    id: 'yearly_premium',
    price: 89.99,
    priceString: '$89.99/year',
    period: 'year',
    savings: 'Save 25%',
  },
  TRIAL: {
    id: '7day_trial',
    duration: 7,
    durationString: '7-day free trial',
  },
} as const;

export type SubscriptionTier = 'free' | 'premium_monthly' | 'premium_yearly';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expirationDate: Date | null;
  willRenew: boolean;
  trialEndDate: Date | null;
  isInTrial: boolean;
}

export interface SubscriptionEntitlements {
  aiCoach: boolean;
  advancedAnalytics: boolean;
  unlimitedPrograms: boolean;
  cloudSync: boolean;
  exportData: boolean;
}

// RevenueCat package types (would be from react-native-purchases)
interface PurchasesPackage {
  identifier: string;
  packageType: string;
  product: {
    priceString: string;
    productIdentifier: string;
  };
}

interface PurchasesOffering {
  availablePackages: PurchasesPackage[];
}

class SubscriptionService {
  private isInitialized = false;
  private offerings: PurchasesOffering | null = null;

  // Stub implementations - would use react-native-purchases in production
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const _apiKey = Platform.OS === 'ios' ? REVENUE_CAT_API_KEYS.ios : REVENUE_CAT_API_KEYS.android;

    // TODO: Initialize RevenueCat SDK
    // Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    // await Purchases.configure({ apiKey });

    this.isInitialized = true;
    console.log('Subscription service initialized (stub)');
  }

  async fetchOfferings(): Promise<PurchasesOffering | null> {
    // TODO: Return real offerings from RevenueCat
    // const offerings = await Purchases.getOfferings();
    return {
      availablePackages: [
        {
          identifier: 'monthly_premium',
          packageType: 'MONTHLY',
          product: {
            priceString: '$9.99/month',
            productIdentifier: 'monthly_premium',
          },
        },
        {
          identifier: 'yearly_premium',
          packageType: 'ANNUAL',
          product: {
            priceString: '$89.99/year',
            productIdentifier: 'yearly_premium',
          },
        },
      ],
    };
  }

  getMonthlyPackage(): PurchasesPackage | null {
    return (
      this.offerings?.availablePackages.find(
        (p: PurchasesPackage) => p.packageType === 'MONTHLY',
      ) ?? null
    );
  }

  getYearlyPackage(): PurchasesPackage | null {
    return (
      this.offerings?.availablePackages.find((p: PurchasesPackage) => p.packageType === 'ANNUAL') ??
      null
    );
  }

  async subscribe(_packageId: string): Promise<{ success: boolean; error?: string }> {
    // TODO: Implement actual purchase with RevenueCat
    // const { customerInfo } = await Purchases.purchasePackage(packageId);
    console.log('Purchase stub - would process payment');
    return { success: true };
  }

  async subscribeMonthly(): Promise<{ success: boolean; error?: string }> {
    const monthlyPackage = this.getMonthlyPackage();
    if (!monthlyPackage) {
      return { success: false, error: 'Monthly package not available' };
    }
    return this.subscribe(monthlyPackage.identifier);
  }

  async subscribeYearly(): Promise<{ success: boolean; error?: string }> {
    const yearlyPackage = this.getYearlyPackage();
    if (!yearlyPackage) {
      return { success: false, error: 'Yearly package not available' };
    }
    return this.subscribe(yearlyPackage.identifier);
  }

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    // TODO: Implement with RevenueCat
    // const { customerInfo } = await Purchases.restorePurchases();
    console.log('Restore purchases stub');
    return { success: false, error: 'No subscriptions found' };
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    // TODO: Return real status from RevenueCat
    // const customerInfo = await Purchases.getCustomerInfo();
    return {
      tier: 'free',
      isActive: false,
      expirationDate: null,
      willRenew: false,
      trialEndDate: null,
      isInTrial: false,
    };
  }

  getEntitlements(status: SubscriptionStatus): SubscriptionEntitlements {
    const isPremium = status.isActive;

    return {
      aiCoach: isPremium,
      advancedAnalytics: isPremium,
      unlimitedPrograms: isPremium,
      cloudSync: isPremium,
      exportData: isPremium,
    };
  }

  canAccessFeature(feature: keyof SubscriptionEntitlements): Promise<boolean> {
    return this.getSubscriptionStatus().then((status) => {
      const entitlements = this.getEntitlements(status);
      return entitlements[feature];
    });
  }

  async manageSubscriptions(): Promise<void> {
    // TODO: Open platform subscription management
    console.log('Manage subscriptions stub');
  }
}

export const subscriptionService = new SubscriptionService();
