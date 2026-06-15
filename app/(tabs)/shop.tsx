/**
 * Shop Screen - Premium Gold & Gem Theme
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gem, Heart, Shield, Zap, TrendingUp, Check, X, Crown, Shirt, Palette, Sparkles } from 'lucide-react-native';
import { supabase } from '../../src/config/supabase';
import { COLORS } from '../../src/constants/theme';
import Animated, { FadeInDown, FadeInUp, Layout, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import i18n from '../../src/i18n';
import { useTheme } from '../../src/context/ThemeContext';
import { CustomModal, useModal } from '../../src/components/CustomModal';

interface ShopItem {
    id: string;
    nameKey: string;
    descKey: string;
    price: number;
    icon: any;
    color: string;
    gradient: [string, string];
}

const ITEMS: ShopItem[] = [
    { id: 'freeze', nameKey: 'shop.streak_freeze', descKey: 'shop.streak_freeze_desc', price: 200, icon: Shield, color: '#3498DB', gradient: ['#3498DB', '#2980B9'] },
    { id: 'refill', nameKey: 'shop.heart_refill', descKey: 'shop.heart_refill_desc', price: 350, icon: Heart, color: '#FF4B4B', gradient: ['#FF4B4B', '#C0392B'] },
    { id: 'boost', nameKey: 'shop.xp_boost', descKey: 'shop.xp_boost_desc', price: 150, icon: Zap, color: '#F1C40F', gradient: ['#F1C40F', '#F39C12'] },
    { id: 'wager', nameKey: 'shop.wager', descKey: 'shop.wager_desc', price: 50, icon: TrendingUp, color: '#9B59B6', gradient: ['#9B59B6', '#8E44AD'] },
];

export default function ShopScreen() {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const [gems, setGems] = useState(0);
    const [inventory, setInventory] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [purchaseModal, setPurchaseModal] = useState<{ visible: boolean, item?: ShopItem | null }>({ visible: false, item: null });
    const modal = useModal();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data } = await supabase
                .from('profiles')
                .select('gems, streak_freeze, heart_refill, wager_active')
                .eq('id', session.user.id)
                .single();

            if (data) {
                setGems(data.gems || 0);
                setInventory(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePurchasePress = (item: ShopItem) => {
        if (gems < item.price) {
            modal.error(i18n.t('shop.not_enough_gems'), i18n.t('shop.earn_more'));
            return;
        }

        if (item.id === 'wager' && inventory.wager_active) {
            modal.error(i18n.t('common.error'), i18n.t('shop.wager_active_exists'));
            return;
        }

        modal.confirm(
            i18n.t('common.confirm'),
            i18n.t('shop.confirm_purchase', { item: i18n.t(item.nameKey), price: item.price }),
            () => processTransaction(item),
            i18n.t('common.confirm'),
            i18n.t('common.cancel'),
        );
    };

    const processTransaction = async (item: ShopItem) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        let updateData: any = { gems: gems - item.price };

        if (item.id === 'freeze') {
            updateData.streak_freeze = (inventory.streak_freeze || 0) + 1;
        } else if (item.id === 'refill') {
            updateData.current_lives = 5;
        } else if (item.id === 'wager') {
            updateData.wager_active = true;
            updateData.wager_start_date = new Date().toISOString();
        } else if (item.id === 'boost') {
            const endTime = new Date();
            endTime.setMinutes(endTime.getMinutes() + 15);
            updateData.xp_boost_end_time = endTime.toISOString();
        }

        const { error } = await supabase.from('profiles').update(updateData).eq('id', session.user.id);

        if (!error) {
            setGems(prev => prev - item.price);
            setInventory((prev: any) => ({ ...prev, ...updateData }));
            setPurchaseModal({ visible: true, item });
            setTimeout(() => setPurchaseModal({ visible: false, item: null }), 2500);
        } else {
            modal.error(i18n.t('common.error'), i18n.t('shop.transaction_failed'));
        }
    };

    // Premium Gem Packs
    const GEM_PACKS = [
        { id: 'handful', nameKey: 'shop.gem_pack_handful', amount: 500, price: '$0.99', color: '#27AE60', icon: '💎' },
        { id: 'sack', nameKey: 'shop.gem_pack_sack', amount: 1200, price: '$4.99', color: '#8E44AD', icon: '💰' },
        { id: 'chest', nameKey: 'shop.gem_pack_chest', amount: 3000, price: '$9.99', color: '#E67E22', icon: '👑' },
    ];

    const handleBuyGems = (pack: any) => {
        modal.confirm(
            i18n.t('shop.confirm_purchase_title'),
            i18n.t('shop.confirm_buy_gems', { amount: pack.amount, price: pack.price }),
            async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const newGems = gems + pack.amount;
                    await supabase.from('profiles').update({ gems: newGems }).eq('id', session.user.id);
                    setGems(newGems);
                    modal.success(i18n.t('shop.success'), i18n.t('shop.purchase_success', { amount: pack.amount }));
                }
            },
            i18n.t('shop.buy'),
            i18n.t('common.cancel'),
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.background.secondary, borderBottomColor: theme.border.light }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{i18n.t('shop.title')}</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.text.secondary }]}>{i18n.t('shop.subtitle')}</Text>
                </View>
                <Animated.View layout={Layout.springify()} style={styles.gemPill}>
                    <Gem size={20} color="#FFF" fill="#FFF" />
                    <Text style={styles.gemText}>{gems}</Text>
                </Animated.View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
                <Animated.ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* VIP Banner */}
                    <TouchableOpacity activeOpacity={0.9} style={styles.vipBanner}>
                        <LinearGradient colors={['#F2994A', '#F2C94C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.vipGradient}>
                            <View>
                                <Text style={styles.vipTitle}>{i18n.t('shop.currency_store')}</Text>
                                <Text style={styles.vipDesc}>{i18n.t('shop.currency_store_desc')}</Text>
                            </View>
                            <Crown size={32} color="#FFF" fill="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Power-ups Section */}
                    <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{i18n.t('shop.powerups')}</Text>
                    {ITEMS.map((item, index) => (
                        <Animated.View
                            key={item.id}
                            entering={FadeInDown.delay(index * 100).springify()}
                            style={styles.cardContainer}
                        >
                            <TouchableOpacity activeOpacity={0.9} onPress={() => handlePurchasePress(item)}>
                                <View style={[styles.cardShadow, { backgroundColor: item.color, opacity: 0.3 }]} />
                                <View style={[styles.cardContent, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
                                    <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                                        <item.icon size={28} color="#FFF" />
                                    </View>
                                    <View style={styles.textContainer}>
                                        <Text style={[styles.itemName, { color: theme.text.primary }]}>{i18n.t(item.nameKey)}</Text>
                                        <Text style={[styles.itemDesc, { color: theme.text.secondary }]}>{i18n.t(item.descKey)}</Text>
                                    </View>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.priceText}>{item.price}</Text>
                                        <Gem size={14} color="#F39C12" fill="#F39C12" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}

                    {/* Gem Store Section */}
                    <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{i18n.t('shop.gem_store')}</Text>
                    <View style={styles.packContainer}>
                        {GEM_PACKS.map((pack) => (
                            <TouchableOpacity
                                key={pack.id}
                                style={styles.packCard}
                                onPress={() => handleBuyGems(pack)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.packShadow, { backgroundColor: pack.color }]} />
                                <View style={[styles.packContent, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
                                    <Text style={{ fontSize: 32 }}>{pack.icon}</Text>
                                    <Text style={[styles.packAmount, { color: theme.text.primary }]}>{pack.amount}</Text>
                                    <Text style={[styles.packPrice, { color: theme.text.secondary }]}>{pack.price}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Cosmetics Section */}
                    <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{i18n.t('shop.cosmetics')}</Text>
                    {[
                        { id: 'aura_fire', nameKey: 'shop.cosmetic_fire_aura', descKey: 'shop.cosmetic_fire_aura_desc', price: 500, icon: Sparkles, color: '#FF6B6B', gradient: ['#FF6B6B', '#E74C3C'] as [string, string] },
                        { id: 'hat_wizard', nameKey: 'shop.cosmetic_wizard_hat', descKey: 'shop.cosmetic_wizard_hat_desc', price: 300, icon: Crown, color: '#9B59B6', gradient: ['#9B59B6', '#8E44AD'] as [string, string] },
                        { id: 'theme_neon', nameKey: 'shop.cosmetic_neon_theme', descKey: 'shop.cosmetic_neon_theme_desc', price: 800, icon: Palette, color: '#00CEC9', gradient: ['#00CEC9', '#0984E3'] as [string, string] },
                        { id: 'outfit_gold', nameKey: 'shop.cosmetic_gold_cape', descKey: 'shop.cosmetic_gold_cape_desc', price: 1200, icon: Shirt, color: '#F1C40F', gradient: ['#F1C40F', '#F39C12'] as [string, string] },
                    ].map((cosmetic, index) => (
                        <Animated.View
                            key={cosmetic.id}
                            entering={FadeInDown.delay(index * 80).springify()}
                            style={styles.cardContainer}
                        >
                            <TouchableOpacity activeOpacity={0.9} onPress={() => {
                                if (gems < cosmetic.price) {
                                    modal.error(i18n.t('fox.not_enough_gems'), i18n.t('shop.earn_more'));
                                    return;
                                }
                                modal.confirm(
                                    i18n.t('fox.purchase'),
                                    `${i18n.t(cosmetic.nameKey)} - ${cosmetic.price} gem?`,
                                    async () => {
                                        const { data: { session } } = await supabase.auth.getSession();
                                        if (session) {
                                            const newGems = gems - cosmetic.price;
                                            await supabase.from('profiles').update({ gems: newGems }).eq('id', session.user.id);
                                            setGems(newGems);
                                            setPurchaseModal({ visible: true, item: { id: cosmetic.id, nameKey: cosmetic.nameKey, descKey: cosmetic.descKey, price: cosmetic.price, icon: cosmetic.icon, color: cosmetic.color, gradient: cosmetic.gradient } });
                                            setTimeout(() => setPurchaseModal({ visible: false, item: null }), 2500);
                                        }
                                    },
                                    i18n.t('fox.purchase'),
                                    i18n.t('common.cancel'),
                                );
                            }}>
                                <View style={[styles.cardShadow, { backgroundColor: cosmetic.color, opacity: 0.3 }]} />
                                <View style={[styles.cardContent, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
                                    <LinearGradient colors={cosmetic.gradient} style={styles.iconContainer}>
                                        <cosmetic.icon size={28} color="#FFF" />
                                    </LinearGradient>
                                    <View style={styles.textContainer}>
                                        <Text style={[styles.itemName, { color: theme.text.primary }]}>{i18n.t(cosmetic.nameKey)}</Text>
                                        <Text style={[styles.itemDesc, { color: theme.text.secondary }]}>{i18n.t(cosmetic.descKey)}</Text>
                                    </View>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.priceText}>{cosmetic.price}</Text>
                                        <Gem size={14} color="#F39C12" fill="#F39C12" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </Animated.ScrollView>
            )}

            {/* Success Modal Overlay */}
            <Modal transparent visible={purchaseModal.visible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <Animated.View entering={ZoomIn.springify()} exiting={ZoomOut} style={styles.modalCard}>
                        <LinearGradient colors={[COLORS.primary, '#27AE60']} style={styles.modalGradient}>
                            <View style={styles.checkCircle}>
                                <Check size={48} color="#FFF" strokeWidth={3} />
                            </View>
                            <Text style={styles.modalTitle}>{i18n.t('shop.success')}!</Text>
                            <Text style={styles.modalText}>
                                {purchaseModal.item ? i18n.t('shop.item_added', { item: i18n.t(purchaseModal.item.nameKey) }) : ''}
                            </Text>
                        </LinearGradient>
                    </Animated.View>
                </View>
            </Modal>

            {/* Custom Modal */}
            <CustomModal {...modal.modalProps} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    headerSubtitle: { fontSize: 13, fontWeight: '500' },

    gemPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#2ECC71', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16
    },
    gemText: { fontSize: 16, fontWeight: '800', color: '#FFF' },

    vipBanner: { marginBottom: 24, borderRadius: 20, elevation: 4, shadowColor: '#F2994A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    vipGradient: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    vipTitle: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
    vipDesc: { fontSize: 18, fontWeight: '800', color: '#FFF' },

    sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 12, marginTop: 8 },

    cardContainer: { marginBottom: 16 },
    cardShadow: { position: 'absolute', bottom: -4, width: '100%', height: '100%', borderRadius: 20, top: 4 },
    cardContent: {
        flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16,
        borderRadius: 20, borderWidth: 1,
        elevation: 2 // Gentle lift
    },
    iconContainer: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    textContainer: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '700' },
    itemDesc: { fontSize: 12 },

    priceContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FFF9C4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12
    },
    priceText: { fontSize: 14, fontWeight: '800', color: '#F39C12' },

    packContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    packCard: { width: '30%', height: 140 },
    packShadow: { position: 'absolute', bottom: 0, width: '100%', height: '100%', borderRadius: 20, top: 6, opacity: 0.2 },
    packContent: {
        flex: 1, borderRadius: 20, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6
    },
    packAmount: { fontSize: 16, fontWeight: '800' },
    packPrice: { fontSize: 13, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    modalCard: { width: '80%', borderRadius: 32, overflow: 'hidden', elevation: 10 },
    modalGradient: { padding: 40, alignItems: 'center', gap: 20 },
    checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
    modalTitle: { fontSize: 32, fontWeight: '900', color: '#FFF' },
    modalText: { fontSize: 18, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
});
