import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { subscriptionService, SUBSCRIPTION_PLANS, type SubscriptionStatus } from '@/lib/subscription';

const FEATURES = [
  {
    icon: '🎯',
    title: 'AI Coach',
    description: 'Personalized training recommendations powered by advanced AI',
  },
  {
    icon: '📊',
    title: 'Advanced Analytics',
    description: 'Deep insights into your training progress and patterns',
  },
  {
    icon: '💾',
    title: 'Cloud Sync',
    description: 'Sync your progress across all devices automatically',
  },
  {
    icon: '📈',
    title: 'Unlimited Programs',
    description: 'Create and manage unlimited training programs',
  },
  {
    icon: '📤',
    title: 'Data Export',
    description: 'Export your training data in multiple formats',
  },
  {
    icon: '⭐',
    title: 'Priority Support',
    description: 'Get faster responses from our support team',
  },
];

interface PaywallScreenProps {
  visible: boolean;
  onClose?: () => void;
  onSubscribe?: () => void;
}

export function PaywallScreen({ visible, onClose, onSubscribe }: PaywallScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await subscriptionService.initialize();
      const status = await subscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (err) {
      setError('Failed to load subscription options');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setIsPurchasing(true);
    setError(null);

    try {
      const result =
        plan === 'monthly'
          ? await subscriptionService.subscribeMonthly()
          : await subscriptionService.subscribeYearly();

      if (result.success) {
        onSubscribe?.();
      } else if (result.error !== 'cancelled') {
        setError(result.error || 'Purchase failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await subscriptionService.restorePurchases();
      if (result.success) {
        onSubscribe?.();
      } else {
        setError(result.error || 'No subscriptions found');
      }
    } catch (err) {
      setError('Failed to restore purchases');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscriptions = () => {
    // Would open platform-specific subscription management
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Blurred Background */}
        <View style={styles.backgroundContainer}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1a2e' }]} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          {/* Close Button */}
          {onClose && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.closeButtonContainer}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <FontAwesome name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </Animated.View>
          )}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
              <Text style={styles.crownIcon}>👑</Text>
              <Text style={styles.title}>Unlock Premium</Text>
              <Text style={styles.subtitle}>
                Transform your training with AI-powered insights and advanced features
              </Text>
            </Animated.View>

            {/* Features */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <Text style={styles.featuresTitle}>Premium Features</Text>
              {FEATURES.map((feature, index) => (
                <Animated.View
                  key={feature.title}
                  entering={FadeInDown.delay(300 + index * 50).duration(400)}
                  style={styles.featureItem}
                >
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>

            {/* Pricing */}
            <Animated.View
              entering={FadeInDown.delay(600).duration(600)}
              style={styles.pricingSection}
            >
              <Text style={styles.pricingTitle}>Choose Your Plan</Text>

              {isLoading ? (
                <ActivityIndicator color={Colors.accent} size="large" />
              ) : (
                <>
                  {/* Monthly Plan */}
                  <TouchableOpacity
                    style={styles.planCard}
                    onPress={() => handleSubscribe('monthly')}
                    disabled={isPurchasing}
                  >
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>Monthly</Text>
                      <Text style={styles.planPrice}>{SUBSCRIPTION_PLANS.MONTHLY.priceString}</Text>
                    </View>
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>Flexible</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Yearly Plan */}
                  <TouchableOpacity
                    style={[styles.planCard, styles.planCardPreferred]}
                    onPress={() => handleSubscribe('yearly')}
                    disabled={isPurchasing}
                  >
                    <View style={styles.preferredBadge}>
                      <Text style={styles.preferredBadgeText}>BEST VALUE</Text>
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>Yearly</Text>
                      <Text style={styles.planPrice}>{SUBSCRIPTION_PLANS.YEARLY.priceString}</Text>
                    </View>
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsBadgeText}>
                        {SUBSCRIPTION_PLANS.YEARLY.savings}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Trial Notice */}
                  <Text style={styles.trialNotice}>
                    Start with a 7-day free trial, cancel anytime
                  </Text>
                </>
              )}

              {/* Error Message */}
              {error && (
                <Animated.View entering={FadeIn} style={styles.errorContainer}>
                  <FontAwesome name="exclamation-circle" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              {/* Subscribe Button */}
              <TouchableOpacity
                style={[styles.subscribeButton, isPurchasing && styles.subscribeButtonDisabled]}
                onPress={() => handleSubscribe('yearly')}
                disabled={isPurchasing || isLoading}
              >
                {isPurchasing ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <>
                    <Text style={styles.subscribeButtonText}>Start Free Trial</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Restore & Manage */}
              <View style={styles.secondaryButtons}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleRestore}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleManageSubscriptions}
                >
                  <Text style={styles.secondaryButtonText}>Manage Subscription</Text>
                </TouchableOpacity>
              </View>

              {/* Terms */}
              <Text style={styles.termsText}>
                By subscribing, you agree to our Terms of Service and Privacy Policy. Subscriptions
                auto-renew unless cancelled.
              </Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
  },
  crownIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  pricingSection: {
    marginTop: 32,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  planCardPreferred: {
    backgroundColor: `${Colors.accent}20`,
    borderColor: Colors.accent,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  planBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  preferredBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  preferredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  savingsBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  trialNotice: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.error}20`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 8,
  },
  subscribeButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  secondaryButton: {
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});
