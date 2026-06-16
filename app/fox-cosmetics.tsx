/**
 * Tilki Kozmetik Mağazası - Fox Cosmetics Shop
 * Shadow Fox maskotunu kozmetik eşyalarla giydir
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Crown, Gem, Check, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { useSubscription } from '../src/providers/SubscriptionProvider';
import { supabase } from '../src/config/supabase';
import type {
  FoxCosmetic,
  FoxOutfit,
  OwnedCosmetic,
  CosmeticCategory,
} from '../src/services/FoxCosmeticService';
import {
  foxCosmeticService,
  getCosmeticsByCategory,
  getCosmeticById,
  getRarityColor,
  getRarityLabel,
} from '../src/services/FoxCosmeticService';
import i18n from '../src/i18n';
import { CustomModal, useModal } from '../src/components/CustomModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES: { id: CosmeticCategory; name: string; icon: string }[] = [
  { id: 'glasses', name: i18n.t('fox.glasses'), icon: '🥽' },
  { id: 'hat', name: i18n.t('fox.hat'), icon: '🎩' },
  { id: 'cape', name: 'Pelerin', icon: '🦇' },
  { id: 'collar', name: 'Tasma', icon: '⚡' },
  { id: 'aura', name: 'Aura', icon: '✨' },
  { id: 'pattern', name: 'Desen', icon: '🎨' },
];

export default function FoxCosmeticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const { isPro } = useSubscription();
  const modal = useModal();

  const [selectedCategory, setSelectedCategory] = useState<CosmeticCategory>('glasses');
  const [ownedCosmetics, setOwnedCosmetics] = useState<OwnedCosmetic[]>([]);
  const [activeOutfit, setActiveOutfit] = useState<FoxOutfit>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [gems, setGems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const uid = session.user.id;
      setUserId(uid);

      // Load gems
      const { data: profile } = await supabase
        .from('profiles')
        .select('gems')
        .eq('id', uid)
        .single();
      setGems(profile?.gems || 0);

      // Load owned cosmetics & outfit
      const owned = await foxCosmeticService.getOwnedCosmetics(uid);
      const outfit = await foxCosmeticService.getActiveOutfit(uid);
      setOwnedCosmetics(owned);
      setActiveOutfit(outfit);

      // Unlock premium cosmetics if premium
      if (isPro) {
        await foxCosmeticService.unlockPremiumCosmetics(uid);
        const updatedOwned = await foxCosmeticService.getOwnedCosmetics(uid);
        setOwnedCosmetics(updatedOwned);
      }
    } catch (e) {
      console.error('FoxCosmetics: load error', e);
    } finally {
      setLoading(false);
    }
  };

  const isOwned = (cosmeticId: string): boolean => {
    return ownedCosmetics.some((o) => o.cosmeticId === cosmeticId);
  };

  const isEquipped = (cosmeticId: string): boolean => {
    return Object.values(activeOutfit).includes(cosmeticId);
  };

  const handlePurchase = async (cosmetic: FoxCosmetic) => {
    if (!userId) return;

    if (cosmetic.isPremium && !isPro) {
      modal.premium(
        i18n.t('premium_screen.premium_required'),
        `${cosmetic.nameTr} sadece Premium üyelere özel!\n\nPremium ile tüm efsanevi eşyalar otomatik açılır.`,
        () => router.push('/premium'),
      );
      return;
    }

    if (gems < cosmetic.gemCost) {
      modal.error(
        i18n.t('fox.not_enough_gems'),
        `Bu eşya ${cosmetic.gemCost} gem gerektiriyor.\nMevcut: ${gems} gem`,
      );
      return;
    }

    modal.confirm(
      i18n.t('fox.purchase'),
      `${cosmetic.nameTr} satın almak istiyor musun?\n💎 ${cosmetic.gemCost} gem`,
      async () => {
        const result = await foxCosmeticService.purchaseCosmetic(userId, cosmetic.id, gems);
        if (result.success) {
          setGems(result.remainingGems);
          const owned = await foxCosmeticService.getOwnedCosmetics(userId);
          setOwnedCosmetics(owned);
          modal.success(i18n.t('fox.success'), result.message);
        } else {
          modal.error(i18n.t('common.error'), result.message);
        }
      },
      i18n.t('fox.purchase'),
      i18n.t('common.cancel'),
    );
  };

  const handleEquip = async (cosmetic: FoxCosmetic) => {
    if (!userId) return;

    if (isEquipped(cosmetic.id)) {
      // Unequip
      const outfit = await foxCosmeticService.unequipCosmetic(userId, cosmetic.category);
      setActiveOutfit(outfit);
    } else {
      // Equip
      const outfit = await foxCosmeticService.equipCosmetic(userId, cosmetic.id);
      setActiveOutfit(outfit);
    }
  };

  const categoryCosmetics = getCosmeticsByCategory(selectedCategory);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background.primary, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background.primary, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Tilki Kozmetik</Text>
        <View style={styles.gemBadge}>
          <Gem size={18} color="#FFD700" />
          <Text style={styles.gemText}>{gems}</Text>
        </View>
      </View>

      {/* Fox Preview */}
      <Animated.View entering={ZoomIn} style={styles.foxPreview}>
        <LinearGradient colors={['#1A1A2E', '#16213E']} style={styles.foxPreviewGradient}>
          <Image
            source={require('../assets/fox/fox-happy.png')}
            resizeMode="contain"
            style={styles.foxImage}
          />

          {/* Equipped items displayed */}
          <View style={styles.equippedRow}>
            {Object.entries(activeOutfit).map(([slot, cosmeticId]) => {
              if (!cosmeticId) return null;
              const cosmetic = getCosmeticById(cosmeticId as string);
              if (!cosmetic) return null;
              return (
                <View key={slot} style={[styles.equippedItem, { borderColor: cosmetic.color }]}>
                  <Text style={styles.equippedIcon}>{cosmetic.icon}</Text>
                </View>
              );
            })}
            {Object.keys(activeOutfit).length === 0 && (
              <Text style={styles.noOutfitText}>Henüz eşya kuşanılmadı</Text>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryTab,
              { backgroundColor: theme.background.secondary },
              selectedCategory === cat.id && styles.categoryTabSelected,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryName,
                { color: selectedCategory === cat.id ? '#FFF' : theme.text.primary },
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cosmetics Grid */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {categoryCosmetics.map((cosmetic, idx) => {
          const owned = isOwned(cosmetic.id);
          const equipped = isEquipped(cosmetic.id);
          const rarityColor = getRarityColor(cosmetic.rarity);

          return (
            <Animated.View
              key={cosmetic.id}
              entering={FadeInDown.delay(idx * 80)}
              style={styles.cosmeticCardWrapper}
            >
              <TouchableOpacity
                style={[
                  styles.cosmeticCard,
                  { backgroundColor: theme.background.secondary },
                  equipped && { borderColor: cosmetic.color, borderWidth: 2 },
                ]}
                onPress={() => (owned ? handleEquip(cosmetic) : handlePurchase(cosmetic))}
                activeOpacity={0.8}
              >
                {/* Rarity Badge */}
                <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                  <Text style={styles.rarityText}>{getRarityLabel(cosmetic.rarity)}</Text>
                </View>

                {/* Icon */}
                <View
                  style={[
                    styles.cosmeticIconContainer,
                    cosmetic.glowColor
                      ? { shadowColor: cosmetic.color, shadowRadius: 12, shadowOpacity: 0.6 }
                      : {},
                  ]}
                >
                  <Text style={styles.cosmeticIcon}>{cosmetic.icon}</Text>
                </View>

                {/* Name */}
                <Text style={[styles.cosmeticName, { color: theme.text.primary }]}>
                  {cosmetic.nameTr}
                </Text>
                <Text
                  style={[styles.cosmeticDesc, { color: theme.text.secondary }]}
                  numberOfLines={1}
                >
                  {cosmetic.descriptionTr}
                </Text>

                {/* Action */}
                {owned ? (
                  <View style={[styles.actionBtn, equipped ? styles.equippedBtn : styles.equipBtn]}>
                    {equipped ? (
                      <>
                        <Check size={14} color="#FFF" />
                        <Text style={styles.actionBtnText}>Kuşanıldı</Text>
                      </>
                    ) : (
                      <Text style={styles.actionBtnText}>Kuşan</Text>
                    )}
                  </View>
                ) : cosmetic.isPremium ? (
                  <View style={[styles.actionBtn, styles.premiumBtn]}>
                    <Crown size={14} color="#FFD700" />
                    <Text style={[styles.actionBtnText, { color: '#FFD700' }]}>Premium</Text>
                  </View>
                ) : (
                  <View style={[styles.actionBtn, styles.buyBtn]}>
                    <Gem size={14} color="#FFD700" />
                    <Text style={styles.actionBtnText}>{cosmetic.gemCost}</Text>
                  </View>
                )}

                {/* Lock overlay for premium items */}
                {cosmetic.isPremium && !isPro && !owned && (
                  <View style={styles.lockOverlay}>
                    <Lock size={24} color="#FFD700" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
      <CustomModal {...modal.modalProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  gemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gemText: { fontSize: 16, fontWeight: '800', color: '#FFD700' },

  // Fox Preview
  foxPreview: { marginHorizontal: 20, marginBottom: 16, borderRadius: 24, overflow: 'hidden' },
  foxPreviewGradient: {
    padding: 24,
    alignItems: 'center',
    minHeight: 200,
  },
  foxImage: { width: 120, height: 120, marginBottom: 8 },
  equippedRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  equippedItem: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  equippedIcon: { fontSize: 20 },
  noOutfitText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontStyle: 'italic' },

  // Category Tabs
  categoryTabs: {
    maxHeight: 52,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryTabSelected: { backgroundColor: '#6C5CE7' },
  categoryIcon: { fontSize: 18 },
  categoryName: { fontSize: 13, fontWeight: '700' },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  cosmeticCardWrapper: { width: (SCREEN_WIDTH - 44) / 2 },
  cosmeticCard: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  cosmeticIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  cosmeticIcon: { fontSize: 32 },
  cosmeticName: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  cosmeticDesc: { fontSize: 11, textAlign: 'center', marginBottom: 10 },

  // Action buttons
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  equipBtn: { backgroundColor: '#3498DB' },
  equippedBtn: { backgroundColor: '#2ECC71' },
  buyBtn: { backgroundColor: 'rgba(255, 215, 0, 0.2)' },
  premiumBtn: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  // Lock
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
