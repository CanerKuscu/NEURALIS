/**
 * AVATAR CREATOR - Premium Duolingo Style
 *
 * Professional avatar editor with smooth animations,
 * beautiful UI, and extensive customization options
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Pressable,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Shuffle, Check, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../src/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../src/context/ToastContext';
import { AvatarView } from '../src/components/avatar/AvatarView';
import type {
  AvatarConfig,
  HairType,
  EyeType,
  MouthType,
  ShirtType,
  GlassesType,
  HatType,
  FacialHairType,
} from '../src/types/avatar';
import {
  DEFAULT_AVATAR_CONFIG,
  SKIN_COLORS,
  HAIR_COLORS,
  EYE_COLORS,
  SHIRT_COLORS,
  BG_COLORS,
  GLASSES_COLORS,
  HAT_COLORS,
} from '../src/types/avatar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = Math.min(SCREEN_WIDTH * 0.5, 220);

// ============================================================================
// THEME COLORS
// ============================================================================
const COLORS = {
  bg: '#0F1419',
  card: '#1C2526',
  cardLight: '#2A3439',
  accent: '#58CC02',
  accentDark: '#4CAD02',
  secondary: '#1CB0F6',
  purple: '#CE82FF',
  gold: '#FFC800',
  orange: '#FF9600',
  pink: '#FF6B9D',
  text: '#FFFFFF',
  textSecondary: '#8B9A9B',
  textMuted: '#5A6A6C',
  border: '#3C4D56',
  success: '#58CC02',
};

// ============================================================================
// OPTIONS CONFIGURATION
// ============================================================================
const OPTIONS = {
  skinColor: SKIN_COLORS,
  hairType: ['none', 'short', 'medium', 'long', 'curly', 'afro', 'bun', 'ponytail'] as HairType[],
  hairColor: HAIR_COLORS,
  eyeType: ['normal', 'happy', 'wink', 'surprised', 'sleepy'] as EyeType[],
  eyeColor: EYE_COLORS,
  mouthType: ['smile', 'grin', 'neutral', 'open', 'smirk'] as MouthType[],
  glassesType: ['none', 'round', 'square', 'aviator', 'cat-eye'] as GlassesType[],
  glassesColor: GLASSES_COLORS,
  hatType: ['none', 'cap', 'beanie', 'fedora', 'crown'] as HatType[],
  hatColor: HAT_COLORS,
  facialHairType: ['none', 'stubble', 'mustache', 'beard', 'goatee'] as FacialHairType[],
  shirtType: ['tshirt', 'hoodie', 'sweater', 'tank'] as ShirtType[],
  shirtColor: SHIRT_COLORS,
  bgColor: BG_COLORS,
};

// Category configuration with icons and colors
const CATEGORIES = [
  {
    key: 'face',
    label: 'Face',
    icon: '😊',
    color: '#FFB74D',
    subCategories: ['skinColor', 'eyeType', 'eyeColor', 'mouthType'],
  },
  {
    key: 'hair',
    label: 'Hair',
    icon: '💇',
    color: '#BA68C8',
    subCategories: ['hairType', 'hairColor'],
  },
  {
    key: 'accessories',
    label: 'Style',
    icon: '✨',
    color: '#4FC3F7',
    subCategories: ['glassesType', 'glassesColor', 'hatType', 'hatColor', 'facialHairType'],
  },
  {
    key: 'outfit',
    label: 'Outfit',
    icon: '👕',
    color: '#81C784',
    subCategories: ['shirtType', 'shirtColor'],
  },
  { key: 'background', label: 'Theme', icon: '🎨', color: '#F06292', subCategories: ['bgColor'] },
];

const SUB_CATEGORY_LABELS: Record<string, string> = {
  skinColor: 'Skin Tone',
  eyeType: 'Eye Style',
  eyeColor: 'Eye Color',
  mouthType: 'Expression',
  hairType: 'Hairstyle',
  hairColor: 'Hair Color',
  glassesType: 'Glasses',
  glassesColor: 'Frame Color',
  hatType: 'Headwear',
  hatColor: 'Hat Color',
  facialHairType: 'Facial Hair',
  shirtType: 'Top Style',
  shirtColor: 'Top Color',
  bgColor: 'Background',
};

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Color Swatch Component
const ColorSwatch = ({
  color,
  isSelected,
  onPress,
  size = 52,
  delay = 0,
}: {
  color: string;
  isSelected: boolean;
  onPress: () => void;
  size?: number;
  delay?: number;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
  };

  return (
    <Animated.View entering={ZoomIn.delay(delay).springify()}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.colorSwatch,
          animatedStyle,
          { width: size, height: size, borderRadius: size / 2 },
          isSelected && styles.colorSwatchSelected,
        ]}
      >
        <View
          style={[
            styles.colorSwatchInner,
            {
              backgroundColor: color,
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
            },
          ]}
        />
        {isSelected && (
          <View style={styles.checkMark}>
            <Check size={16} color="#FFF" strokeWidth={3} />
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
};

// Option Card Component
const OptionCard = ({
  config,
  optionKey,
  value,
  isSelected,
  onPress,
  delay = 0,
}: {
  config: AvatarConfig;
  optionKey: string;
  value: string;
  isSelected: boolean;
  onPress: () => void;
  delay?: number;
}) => {
  const scale = useSharedValue(1);
  const previewConfig = { ...config, [optionKey]: value };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.optionCard, animatedStyle, isSelected && styles.optionCardSelected]}
      >
        <View style={styles.optionAvatarContainer}>
          <AvatarView config={previewConfig} size={72} />
        </View>
        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
          {value === 'none' ? 'None' : value.charAt(0).toUpperCase() + value.slice(1)}
        </Text>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Check size={12} color="#FFF" strokeWidth={3} />
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AvatarEditor() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  // State
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeSubCategory, setActiveSubCategory] = useState(0);
  const [saving, setSaving] = useState(false);

  // Animation values
  const avatarScale = useSharedValue(1);
  const avatarRotation = useSharedValue(0);
  const floatY = useSharedValue(0);

  // Load saved config
  useEffect(() => {
    loadConfig();
    // Float animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const loadConfig = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_config')
          .eq('id', session.user.id)
          .maybeSingle();
        if (data?.avatar_config) {
          setConfig({ ...DEFAULT_AVATAR_CONFIG, ...data.avatar_config });
          return;
        }
      }
      const stored = await AsyncStorage.getItem('avatar_config');
      if (stored) {
        setConfig({ ...DEFAULT_AVATAR_CONFIG, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.log('Error loading avatar config', e);
    }
  };

  // Update config with animation
  const updateConfig = useCallback((key: keyof AvatarConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    avatarScale.value = withSequence(
      withSpring(1.1, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  }, []);

  // Randomize with celebration
  const randomizeAvatar = useCallback(() => {
    const randomFromArray = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    setConfig({
      skinColor: randomFromArray(SKIN_COLORS),
      hairType: randomFromArray(OPTIONS.hairType),
      hairColor: randomFromArray(HAIR_COLORS),
      eyeType: randomFromArray(OPTIONS.eyeType),
      eyeColor: randomFromArray(EYE_COLORS),
      mouthType: randomFromArray(OPTIONS.mouthType),
      shirtType: randomFromArray(OPTIONS.shirtType),
      shirtColor: randomFromArray(SHIRT_COLORS),
      bgColor: randomFromArray(BG_COLORS),
      glassesType: randomFromArray(OPTIONS.glassesType),
      glassesColor: randomFromArray(GLASSES_COLORS),
      hatType: randomFromArray(OPTIONS.hatType),
      hatColor: randomFromArray(HAT_COLORS),
      facialHairType: randomFromArray(OPTIONS.facialHairType),
      facialHairColor: randomFromArray(HAIR_COLORS),
      accessoryType: 'none',
    });

    // Spin animation
    avatarRotation.value = withSequence(
      withTiming(360, { duration: 500, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 0 }),
    );
    avatarScale.value = withSequence(
      withSpring(1.2, { damping: 6, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );
  }, []);

  // Save avatar
  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await AsyncStorage.setItem('avatar_config', JSON.stringify(config));

      if (session?.user) {
        await supabase
          .from('profiles')
          .update({
            avatar_config: config,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.user.id);
      }

      showToast('Avatar saved! 🎉', { type: 'success' });
      router.back();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save avatar', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Animated styles
  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: avatarScale.value },
      { rotate: `${avatarRotation.value}deg` },
    ],
  }));

  // Current category and options
  const currentCategory = CATEGORIES[activeCategory];
  const currentSubCategoryKey = currentCategory.subCategories[activeSubCategory];
  const currentOptions = OPTIONS[currentSubCategoryKey as keyof typeof OPTIONS] || [];
  const isColorPicker =
    currentSubCategoryKey.includes('Color') || currentSubCategoryKey === 'bgColor';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <X size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Sparkles size={20} color={COLORS.gold} />
          <Text style={styles.headerTitle}>Create Avatar</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.headerBtn, styles.saveBtn]}
        >
          {saving ? (
            <Text style={styles.saveBtnText}>...</Text>
          ) : (
            <Check size={28} color={COLORS.accent} />
          )}
        </TouchableOpacity>
      </View>

      {/* Avatar Preview Area */}
      <View style={styles.previewSection}>
        <LinearGradient
          colors={[config.bgColor || '#9B59B6', adjustColor(config.bgColor || '#9B59B6', -40)]}
          style={styles.previewGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative elements */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.decorCircle3} />

          {/* Avatar */}
          <Animated.View style={[styles.avatarWrapper, avatarAnimatedStyle]}>
            <AvatarView config={config} size={AVATAR_SIZE} showBackground={false} />
          </Animated.View>
        </LinearGradient>
      </View>

      {/* Action Bar - Randomize Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.randomizeBtn} onPress={randomizeAvatar} activeOpacity={0.8}>
          <Shuffle size={20} color={COLORS.text} />
          <Text style={styles.randomizeBtnText}>Randomize</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat, index) => (
            <Animated.View key={cat.key} entering={FadeInUp.delay(index * 50)}>
              <TouchableOpacity
                style={[
                  styles.categoryTab,
                  activeCategory === index && { backgroundColor: cat.color },
                ]}
                onPress={() => {
                  setActiveCategory(index);
                  setActiveSubCategory(0);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    activeCategory === index && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Sub-category Pills */}
      {currentCategory.subCategories.length > 1 && (
        <View style={styles.subCategorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subCategoryScroll}
          >
            {currentCategory.subCategories.map((subKey, index) => (
              <TouchableOpacity
                key={subKey}
                style={[
                  styles.subCategoryPill,
                  activeSubCategory === index && styles.subCategoryPillActive,
                ]}
                onPress={() => setActiveSubCategory(index)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subCategoryText,
                    activeSubCategory === index && styles.subCategoryTextActive,
                  ]}
                >
                  {SUB_CATEGORY_LABELS[subKey]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Current Selection Label */}
      <View style={styles.selectionHeader}>
        <Text style={styles.selectionLabel}>{SUB_CATEGORY_LABELS[currentSubCategoryKey]}</Text>
        <Text style={styles.selectionCount}>{currentOptions.length} options</Text>
      </View>

      {/* Options Grid */}
      <View style={styles.optionsSection}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.optionsContent}
        >
          {isColorPicker ? (
            // Color Grid
            <View style={styles.colorGrid}>
              {currentOptions.map((color, index) => (
                <ColorSwatch
                  key={color as string}
                  color={color as string}
                  isSelected={config[currentSubCategoryKey as keyof AvatarConfig] === color}
                  onPress={() =>
                    updateConfig(currentSubCategoryKey as keyof AvatarConfig, color as string)
                  }
                  delay={index * 30}
                />
              ))}
            </View>
          ) : (
            // Option Cards Grid
            <View style={styles.optionsGrid}>
              {currentOptions.map((option, index) => (
                <OptionCard
                  key={option as string}
                  config={config}
                  optionKey={currentSubCategoryKey}
                  value={option as string}
                  isSelected={config[currentSubCategoryKey as keyof AvatarConfig] === option}
                  onPress={() =>
                    updateConfig(currentSubCategoryKey as keyof AvatarConfig, option as string)
                  }
                  delay={index * 50}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Bottom Safe Area */}
      <View style={{ height: insets.bottom + 10 }} />
    </View>
  );
}

// Helper function
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  saveBtn: {
    backgroundColor: 'rgba(88,204,2,0.15)',
  },
  saveBtnText: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '700',
  },

  // Preview Section
  previewSection: {
    height: SCREEN_HEIGHT * 0.3,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 32,
    overflow: 'hidden',
  },
  previewGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle3: {
    position: 'absolute',
    top: 30,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatarWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  randomizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  randomizeBtnText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },

  // Category Section
  categorySection: {
    paddingVertical: 10,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  categoryLabelActive: {
    color: COLORS.text,
  },

  // Sub-category
  subCategorySection: {
    paddingVertical: 6,
  },
  subCategoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  subCategoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subCategoryPillActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  subCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  subCategoryTextActive: {
    color: COLORS.text,
  },

  // Selection Header
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  selectionCount: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // Options Section
  optionsSection: {
    flex: 1,
  },
  optionsContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Color Grid
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
  colorSwatch: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: COLORS.accent,
  },
  colorSwatchInner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkMark: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: -6,
    right: -6,
    borderWidth: 3,
    borderColor: COLORS.bg,
  },

  // Options Grid
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  optionCard: {
    width: (SCREEN_WIDTH - 46) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(88,204,2,0.1)',
  },
  optionAvatarContainer: {
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  optionLabelSelected: {
    color: COLORS.accent,
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
