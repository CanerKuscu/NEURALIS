/**
 * Premium Upgrade Screen
 * Shows subscription options and benefits
 */

import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    X,
    Crown,
    Check,
    Zap,
    Infinity,
    Brain,
    Sparkles,
    Shield,
    Star,
    Gift,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { useSubscription } from '../src/providers/SubscriptionProvider';
import { useToast } from '../src/context/ToastContext';
import { freeTrialService, TRIAL_BENEFITS } from '../src/services/FreeTrialService';
import i18n from '../src/i18n';
import { CustomModal, useModal } from '../src/components/CustomModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
    bg: '#0F1419',
    card: '#1C2526',
    gold: '#FFD700',
    goldDark: '#B8860B',
    accent: '#58CC02',
    purple: '#9B59B6',
    blue: '#1CB0F6',
    text: '#FFFFFF',
    textSecondary: '#8B9A9B',
};

// Premium features list
const PREMIUM_FEATURES = [
    {
        icon: Brain,
        title: i18n.t('premium_screen.unlimited_lessons'),
        description: i18n.t('premium_screen.unlimited_lessons_desc'),
        color: '#CE82FF',
    },
    {
        icon: Infinity,
        title: i18n.t('premium_screen.unlimited_energy'),
        description: i18n.t('premium_screen.unlimited_energy_desc'),
        color: '#FF6B6B',
    },
    {
        icon: Sparkles,
        title: 'Sesli Gölge (Voice Shadow)',
        description: 'YZ ile sesli konuşma pratiği yap',
        color: '#4FC3F7',
    },
    {
        icon: Shield,
        title: i18n.t('premium_screen.ad_free'),
        description: 'Odaklan, kesinti yok',
        color: '#81C784',
    },
    {
        icon: Star,
        title: 'Özel Tilki Kozmetikleri',
        description: 'Efsanevi gözlük, pelerin ve auralar',
        color: '#FFB74D',
    },
    {
        icon: Gift,
        title: 'Nöral Düello PvP',
        description: i18n.t('premium_screen.compete_friends'),
        color: '#F06292',
    },
];

// Pricing plans - $3.99/month for both Android and iOS
const PLANS = [
    {
        id: 'monthly',
        name: i18n.t('premium_screen.monthly_premium'),
        price: '$3.99',
        period: '/ay',
        popular: true,
        savings: null,
        platforms: ['android', 'ios'] as const,
    },
];

export default function PremiumScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useTheme();
    const { isPro, purchasePackage, getAvailablePackages, isLoading } = useSubscription();
    const { showToast } = useToast();
    const modal = useModal();

    const [selectedPlan, setSelectedPlan] = useState('monthly');
    const [purchasing, setPurchasing] = useState(false);
    const [trialActive, setTrialActive] = useState(false);
    const [trialDaysLeft, setTrialDaysLeft] = useState(0);

    React.useEffect(() => {
        checkTrial();
    }, []);

    const checkTrial = async () => {
        const status = await freeTrialService.getTrialStatus();
        setTrialActive(status.isTrialActive);
        setTrialDaysLeft(status.daysRemaining);
    };

    const startFreeTrial = async () => {
        try {
            const result = await freeTrialService.startTrial();
            if (result.isTrialActive) {
                showToast(i18n.t('premium_screen.trial_started'), { type: 'success' });
                setTrialActive(true);
                setTrialDaysLeft(7);
            }
        } catch (err: any) {
            showToast(err?.message || 'Deneme zaten kullanıldı', { type: 'error' });
        }
    };

    const handlePurchase = async () => {
        setPurchasing(true);
        try {
            const packages = getAvailablePackages();
            const selectedPackage = packages.find(p => p.identifier.includes(selectedPlan));

            if (selectedPackage) {
                const success = await purchasePackage(selectedPackage);
                if (success) {
                    showToast('Welcome to Premium! 🎉', { type: 'success' });
                    router.back();
                }
            } else {
                // Mock purchase for development
                modal.info(
                    'Development Mode',
                    'In-app purchases are not configured yet. This is a demo.',
                    () => router.back()
                );
            }
        } catch (error) {
            showToast('Purchase failed. Please try again.', { type: 'error' });
        } finally {
            setPurchasing(false);
        }
    };

    if (isPro) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                        <X size={28} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.alreadyPremium}>
                    <Crown size={80} color={COLORS.gold} />
                    <Text style={styles.alreadyTitle}>You're Premium!</Text>
                    <Text style={styles.alreadySubtitle}>
                        You already have access to all premium features.
                    </Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>Continue Learning</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <X size={28} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Free Trial Banner */}
                {!trialActive && !isPro && (
                    <Animated.View entering={FadeInDown.delay(50)}>
                        <TouchableOpacity onPress={startFreeTrial} activeOpacity={0.9} style={{ marginBottom: 24 }}>
                            <LinearGradient
                                colors={['#667EEA', '#764BA2']}
                                style={{
                                    borderRadius: 20, padding: 24, alignItems: 'center',
                                    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
                                }}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Gift size={36} color="#FFF" />
                                <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFF', marginTop: 12 }}>7 Gün Ücretsiz Dene!</Text>
                                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center' }}>
                                    Tüm premium özelliklere erişim. Kredi kartı gerektirmez.
                                </Text>
                                <View style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>{i18n.t('premium_screen.start_free')}</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {trialActive && (
                    <Animated.View entering={FadeInDown.delay(50)} style={{ marginBottom: 24 }}>
                        <View style={{ backgroundColor: '#2ECC7130', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2ECC71' }}>
                            <Gift size={24} color="#2ECC71" />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Ücretsiz Deneme Aktif</Text>
                                <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>{trialDaysLeft} gün kaldı</Text>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* Hero Section */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.heroSection}>
                    <LinearGradient
                        colors={[COLORS.gold, COLORS.goldDark]}
                        style={styles.crownBg}
                    >
                        <Crown size={48} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.heroTitle}>Upgrade to Premium</Text>
                    <Text style={styles.heroSubtitle}>
                        Unlock your full learning potential
                    </Text>
                </Animated.View>

                {/* Features */}
                <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>What you'll get</Text>
                    {PREMIUM_FEATURES.map((feature, index) => (
                        <Animated.View
                            key={feature.title}
                            entering={FadeInDown.delay(200 + index * 50)}
                            style={styles.featureItem}
                        >
                            <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                                <feature.icon size={24} color={feature.color} />
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDesc}>{feature.description}</Text>
                            </View>
                            <Check size={20} color={COLORS.accent} />
                        </Animated.View>
                    ))}
                </View>

                {/* Pricing Plans */}
                <View style={styles.plansSection}>
                    <Text style={styles.sectionTitle}>Choose your plan</Text>
                    {PLANS.map((plan, index) => (
                        <Animated.View
                            key={plan.id}
                            entering={FadeInUp.delay(400 + index * 100)}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.planCard,
                                    selectedPlan === plan.id && styles.planCardSelected,
                                    plan.popular && styles.planCardPopular,
                                ]}
                                onPress={() => setSelectedPlan(plan.id)}
                                activeOpacity={0.8}
                            >
                                {plan.popular && (
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularText}>MOST POPULAR</Text>
                                    </View>
                                )}
                                <View style={styles.planHeader}>
                                    <View style={[
                                        styles.radioOuter,
                                        selectedPlan === plan.id && styles.radioOuterSelected
                                    ]}>
                                        {selectedPlan === plan.id && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={styles.planName}>{plan.name}</Text>
                                    {plan.savings && (
                                        <View style={styles.savingsBadge}>
                                            <Text style={styles.savingsText}>{plan.savings}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.planPricing}>
                                    <Text style={styles.planPrice}>{plan.price}</Text>
                                    <Text style={styles.planPeriod}>{plan.period}</Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* CTA Button */}
                <Animated.View entering={ZoomIn.delay(700)}>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={handlePurchase}
                        disabled={purchasing || isLoading}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[COLORS.gold, COLORS.goldDark]}
                            style={styles.ctaGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Crown size={24} color="#FFF" />
                            <Text style={styles.ctaText}>
                                {purchasing ? 'Processing...' : 'Start Premium'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Terms */}
                <Text style={styles.terms}>
                    Cancel anytime. Subscription auto-renews unless cancelled at least 24 hours before the end of the current period.
                </Text>

                <View style={{ height: insets.bottom + 20 }} />
            </ScrollView>
            <CustomModal {...modal.modalProps} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },

    // Hero
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    crownBg: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },

    // Features
    featuresSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },

    // Plans
    plansSection: {
        marginBottom: 24,
    },
    planCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
    },
    planCardSelected: {
        borderColor: COLORS.gold,
    },
    planCardPopular: {
        borderColor: COLORS.gold,
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.gold,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderBottomLeftRadius: 12,
    },
    popularText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#000',
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioOuterSelected: {
        borderColor: COLORS.gold,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.gold,
    },
    planName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        flex: 1,
    },
    savingsBadge: {
        backgroundColor: 'rgba(88,204,2,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    savingsText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.accent,
    },
    planPricing: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginLeft: 36,
    },
    planPrice: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
    },
    planPeriod: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },

    // CTA
    ctaButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    ctaText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
    },

    // Terms
    terms: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },

    // Already Premium
    alreadyPremium: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    alreadyTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.gold,
        marginTop: 24,
        marginBottom: 12,
    },
    alreadySubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    backBtn: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
    },
    backBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});
