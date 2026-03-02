import { create } from 'zustand';
import {
  subscriptionService,
  SUBSCRIPTION_PLANS,
  type SubscriptionStatus,
  type SubscriptionEntitlements,
} from '@/lib/subscription';

interface SubscriptionState {
  status: SubscriptionStatus | null;
  entitlements: SubscriptionEntitlements;
  isLoading: boolean;
  error: string | null;
  showPaywall: boolean;

  // Actions
  initialize: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  subscribeMonthly: () => Promise<{ success: boolean; error?: string }>;
  subscribeYearly: () => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  openPaywall: () => void;
  closePaywall: () => void;
  canAccessFeature: (feature: keyof SubscriptionEntitlements) => Promise<boolean>;
}

const defaultStatus: SubscriptionStatus = {
  tier: 'free',
  isActive: false,
  expirationDate: null,
  willRenew: false,
  trialEndDate: null,
  isInTrial: false,
};

const defaultEntitlements: SubscriptionEntitlements = {
  aiCoach: false,
  advancedAnalytics: false,
  unlimitedPrograms: false,
  cloudSync: false,
  exportData: false,
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: defaultStatus,
  entitlements: defaultEntitlements,
  isLoading: false,
  error: null,
  showPaywall: false,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      await subscriptionService.initialize();
      const status = await subscriptionService.getSubscriptionStatus();
      const entitlements = subscriptionService.getEntitlements(status);
      set({ status, entitlements, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize subscription:', error);
      set({
        isLoading: false,
        error: 'Failed to load subscription status',
        status: defaultStatus,
        entitlements: defaultEntitlements,
      });
    }
  },

  refreshStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await subscriptionService.getSubscriptionStatus();
      const entitlements = subscriptionService.getEntitlements(status);
      set({ status, entitlements, isLoading: false });
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
      set({ isLoading: false, error: 'Failed to refresh subscription' });
    }
  },

  subscribeMonthly: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await subscriptionService.subscribeMonthly();
      if (result.success) {
        await get().refreshStatus();
      } else {
        set({ isLoading: false, error: result.error || undefined });
      }
      return result;
    } catch (error) {
      const errorMsg = 'Subscription failed';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  subscribeYearly: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await subscriptionService.subscribeYearly();
      if (result.success) {
        await get().refreshStatus();
      } else {
        set({ isLoading: false, error: result.error || undefined });
      }
      return result;
    } catch (error) {
      const errorMsg = 'Subscription failed';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  restorePurchases: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await subscriptionService.restorePurchases();
      if (result.success) {
        await get().refreshStatus();
      } else {
        set({ isLoading: false, error: result.error || undefined });
      }
      return result;
    } catch (error) {
      const errorMsg = 'Restore failed';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  openPaywall: () => set({ showPaywall: true }),
  closePaywall: () => set({ showPaywall: false }),

  canAccessFeature: async (feature) => {
    const { entitlements } = get();
    return entitlements[feature];
  },
}));

// Hook for checking feature access with automatic subscription check
export function useFeatureAccess(requiredFeature: keyof SubscriptionEntitlements) {
  const { entitlements, isLoading } = useSubscriptionStore();
  return {
    canAccess: entitlements[requiredFeature],
    isLoading,
  };
}

// Hook for requiring premium features
export function usePremiumFeature(feature: keyof SubscriptionEntitlements) {
  const { entitlements, showPaywall, openPaywall, closePaywall } = useSubscriptionStore();
  const canAccess = entitlements[feature];

  return {
    canAccess,
    showPaywall: showPaywall && !canAccess,
    requestAccess: () => {
      if (!canAccess) {
        openPaywall();
      }
    },
    closePaywall,
  };
}
