/**
 * AVATAR EDITOR — Modern Bitmoji / Facebook Avatar Style
 *
 * Complete rewrite with:
 * - Large, dominant avatar preview (top ~40%)
 * - Floating animation for avatar
 * - Clean bottom panel with intuitive category navigation
 * - 3-column option grid with mini avatar previews
 * - Smooth spring animations on every interaction
 * - Haptic feedback for tactile feel
 * - Undo/Redo support (30-step history)
 * - One-tap randomize & reset
 * - Saves to Supabase + AsyncStorage
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Undo2, Redo2, RotateCcw, Shuffle } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
  FadeInDown,
  ZoomIn,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../src/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../src/context/ToastContext';
import AvatarV2View from '../src/components/avatar/AvatarV2View';
import i18n from '../src/i18n';
import type { AvatarV2Config } from '../src/types/avatar-v2';
import { DEFAULT_AVATAR_V2, AVATAR_V2_CATEGORIES, getOptionLabelKey } from '../src/types/avatar-v2';

// ─── Dimensions ──────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const AVATAR_PREVIEW_SIZE = Math.min(SW * 0.52, 240);
const OPTION_COLS = 3;
const OPTION_GAP = 10;
const OPTION_CARD_SIZE = Math.floor((SW - 32 - OPTION_GAP * (OPTION_COLS - 1)) / OPTION_COLS);
const MINI_AVATAR = Math.floor(OPTION_CARD_SIZE * 0.7);
const COLOR_SWATCH_SIZE = Math.floor((SW - 48) / 7);
const MAX_UNDO = 30;

// ─── Theme ───────────────────────────────────────────────────────────
const C = {
  bgPrimary: '#0B0B14',
  bgSecondary: '#12121F',
  bgCard: '#1A1A2D',
  bgElevated: '#22223A',

  accent: '#6C5CE7',
  accentLight: '#A29BFE',
  accentSoft: 'rgba(108, 92, 231, 0.15)',
  accentBorder: 'rgba(108, 92, 231, 0.45)',

  green: '#58CC02',
  greenDark: '#46A302',

  white: '#FFFFFF',
  textPrimary: '#F0F0F5',
  textSecondary: '#9CA3AF',
  textMuted: '#5B5F73',
  textDim: '#3E4155',

  border: '#2A2A42',
  borderLight: '#33334D',
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function AvatarEditorV2() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  // ─── State ───────────────────────────────────────────────────────
  const [config, setConfig] = useState<AvatarV2Config>({ ...DEFAULT_AVATAR_V2 });
  const [activeCat, setActiveCat] = useState(0);
  const [activeSub, setActiveSub] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Undo/Redo
  const [history, setHistory] = useState<AvatarV2Config[]>([{ ...DEFAULT_AVATAR_V2 }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Animations
  const avatarScale = useSharedValue(1);
  const avatarRotation = useSharedValue(0);
  const floatValue = useSharedValue(0);
  const subScrollRef = useRef<ScrollView>(null);
  const catScrollRef = useRef<ScrollView>(null);

  // Subtle floating animation
  useEffect(() => {
    floatValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  // ─── Load saved config ───────────────────────────────────────────
  useEffect(() => {
    loadAvatar();
  }, []);

  const loadAvatar = async () => {
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
          const merged = { ...DEFAULT_AVATAR_V2, ...data.avatar_config };
          setConfig(merged);
          setHistory([merged]);
          setLoaded(true);
          return;
        }
      }
      const stored = await AsyncStorage.getItem('avatar_config');
      if (stored) {
        const parsed = { ...DEFAULT_AVATAR_V2, ...JSON.parse(stored) };
        setConfig(parsed);
        setHistory([parsed]);
      }
    } catch {
      console.log('[AvatarEditor] Load error');
    }
    setLoaded(true);
  };

  // ─── Update config with history ──────────────────────────────────
  const updateConfig = useCallback(
    (key: keyof AvatarV2Config, value: string) => {
      setConfig((prev) => {
        const next = { ...prev, [key]: value };
        setHistory((h) => {
          const trimmed = h.slice(0, historyIndex + 1);
          const updated = [...trimmed, next].slice(-MAX_UNDO);
          setHistoryIndex(updated.length - 1);
          return updated;
        });
        return next;
      });
      avatarScale.value = withSequence(
        withSpring(1.06, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [historyIndex],
  );

  // ─── Undo / Redo ─────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (!canUndo) return;
    const ni = historyIndex - 1;
    setHistoryIndex(ni);
    setConfig(history[ni]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [canUndo, historyIndex, history]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const ni = historyIndex + 1;
    setHistoryIndex(ni);
    setConfig(history[ni]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [canRedo, historyIndex, history]);

  // ─── Randomize ───────────────────────────────────────────────────
  const randomize = useCallback(() => {
    const pick = <TVal,>(arr: readonly TVal[]): TVal => arr[Math.floor(Math.random() * arr.length)];
    const rc: AvatarV2Config = { ...DEFAULT_AVATAR_V2 };
    AVATAR_V2_CATEGORIES.forEach((cat) => {
      cat.subCategories.forEach((sub) => {
        if (sub.type === 'color' && sub.colors) {
          (rc as any)[sub.key] = pick(sub.colors);
        } else if (sub.type === 'option' && sub.options) {
          (rc as any)[sub.key] = pick(sub.options);
        }
      });
    });
    setConfig(rc);
    setHistory((h) => [...h.slice(0, historyIndex + 1), rc].slice(-MAX_UNDO));
    setHistoryIndex((prev) => prev + 1);
    avatarRotation.value = withSequence(
      withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 0 }),
    );
    avatarScale.value = withSequence(
      withSpring(1.15, { damping: 5, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [historyIndex]);

  // ─── Reset ───────────────────────────────────────────────────────
  const resetAvatar = useCallback(() => {
    const def = { ...DEFAULT_AVATAR_V2 };
    setConfig(def);
    setHistory((h) => [...h.slice(0, historyIndex + 1), def].slice(-MAX_UNDO));
    setHistoryIndex((prev) => prev + 1);
    avatarScale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [historyIndex]);

  // ─── Save ────────────────────────────────────────────────────────
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(i18n.t('avatar.saved'), { type: 'success' });
      router.back();
    } catch (err) {
      console.error('[AvatarEditor] Save error:', err);
      showToast(i18n.t('avatar.save_failed'), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Animated styles ─────────────────────────────────────────────
  const avatarAnim = useAnimatedStyle(() => ({
    transform: [
      { scale: avatarScale.value },
      { rotate: `${avatarRotation.value}deg` },
      { translateY: interpolate(floatValue.value, [0, 1], [0, -6]) },
    ],
  }));

  const currentCat = AVATAR_V2_CATEGORIES[activeCat];
  const currentSub = currentCat.subCategories[activeSub];

  useEffect(() => {
    setActiveSub(0);
    subScrollRef.current?.scrollTo({ x: 0, animated: true });
  }, [activeCat]);

  // ═════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgPrimary} />

      {/* ── TOP: Header + Avatar Preview ──────────────────────── */}
      <View style={styles.topSection}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.hBtn} onPress={() => router.back()} hitSlop={12}>
            <X size={22} color={C.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.hTitle}>{i18n.t('avatar.title')}</Text>
          <View style={styles.hRight}>
            <TouchableOpacity
              style={[styles.hBtnSm, !canUndo && styles.disabled]}
              onPress={undo}
              disabled={!canUndo}
              hitSlop={8}
            >
              <Undo2 size={17} color={canUndo ? C.textPrimary : C.textDim} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.hBtnSm, !canRedo && styles.disabled]}
              onPress={redo}
              disabled={!canRedo}
              hitSlop={8}
            >
              <Redo2 size={17} color={canRedo ? C.textPrimary : C.textDim} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar Preview */}
        <View style={styles.previewArea}>
          <View style={styles.glow} />

          {/* Randomize */}
          <View style={styles.sideCol}>
            <TouchableOpacity style={styles.sideBtn} onPress={randomize} activeOpacity={0.7}>
              <Shuffle size={20} color={C.accent} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.sideLabel}>{i18n.t('avatar.randomize')}</Text>
          </View>

          {/* Avatar */}
          <Animated.View style={[styles.avatarWrap, avatarAnim]}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarClip}>
                <AvatarV2View config={config} size={AVATAR_PREVIEW_SIZE} showBg />
              </View>
            </View>
          </Animated.View>

          {/* Reset */}
          <View style={styles.sideCol}>
            <TouchableOpacity style={styles.sideBtn} onPress={resetAvatar} activeOpacity={0.7}>
              <RotateCcw size={20} color={C.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.sideLabel}>{i18n.t('avatar.reset')}</Text>
          </View>
        </View>
      </View>

      {/* ── BOTTOM: Editor Panel ──────────────────────────────── */}
      <View style={styles.panel}>
        <View style={styles.panelHandle} />

        {/* Category Tabs */}
        <ScrollView
          ref={catScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
          style={styles.catScroll}
        >
          {AVATAR_V2_CATEGORIES.map((cat, idx) => {
            const active = idx === activeCat;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  setActiveCat(idx);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.catTab, active && styles.catTabOn]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.catIcon,
                    active && { backgroundColor: cat.color + '20', borderColor: cat.color + '50' },
                  ]}
                >
                  <Text style={styles.catEmoji}>{cat.icon}</Text>
                </View>
                <Text style={[styles.catLbl, active && styles.catLblOn]} numberOfLines={1}>
                  {i18n.t(cat.labelKey)}
                </Text>
                {active && (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    style={[styles.catBar, { backgroundColor: cat.color }]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Subcategory Pills */}
        {currentCat.subCategories.length > 1 && (
          <ScrollView
            ref={subScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subRow}
            style={styles.subScroll}
          >
            {currentCat.subCategories.map((sub, idx) => {
              const active = idx === activeSub;
              return (
                <TouchableOpacity
                  key={sub.key}
                  onPress={() => {
                    setActiveSub(idx);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[styles.subPill, active && styles.subPillOn]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.subTxt, active && styles.subTxtOn]}>
                    {i18n.t(sub.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Options */}
        <ScrollView
          style={styles.optScroll}
          contentContainerStyle={styles.optContent}
          showsVerticalScrollIndicator={false}
        >
          {currentSub.type === 'color' ? (
            <ColorPicker
              colors={currentSub.colors || []}
              selected={config[currentSub.key] as string}
              onSelect={(v) => updateConfig(currentSub.key, v)}
            />
          ) : (
            <OptionGrid
              options={currentSub.options || []}
              selected={config[currentSub.key] as string}
              onSelect={(v) => updateConfig(currentSub.key, v)}
              configKey={currentSub.key}
              config={config}
            />
          )}
        </ScrollView>
      </View>

      {/* ── SAVE BUTTON ───────────────────────────────────────── */}
      <View style={[styles.saveBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={saving ? [C.textMuted, C.textMuted] : [C.green, C.greenDark]}
            style={styles.saveBtn}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Check size={22} color="#FFF" strokeWidth={3} />
            )}
            <Text style={styles.saveTxt}>
              {saving ? i18n.t('avatar.saving') : i18n.t('avatar.save')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// COLOR PICKER
// ═══════════════════════════════════════════════════════════════════════

function ColorPicker({
  colors,
  selected,
  onSelect,
}: {
  colors: readonly string[];
  selected: string;
  onSelect: (c: string) => void;
}) {
  return (
    <View style={styles.clrGrid}>
      {colors.map((color, idx) => {
        const sel = color === selected || color.toLowerCase() === selected.toLowerCase();
        const natural = color === 'natural';
        const display = natural ? '#D4A574' : color;
        return (
          <Animated.View key={`${color}-${idx}`} entering={FadeIn.delay(idx * 15).duration(200)}>
            <TouchableOpacity
              onPress={() => onSelect(color)}
              activeOpacity={0.75}
              style={[styles.clrOuter, sel && styles.clrOuterSel]}
            >
              <View style={[styles.clrInner, { backgroundColor: display }]}>
                {natural && <Text style={styles.clrNatural}>N</Text>}
                {sel && (
                  <Animated.View entering={ZoomIn.duration(200)}>
                    <View style={styles.clrCheck}>
                      <Check size={14} color="#FFF" strokeWidth={3} />
                    </View>
                  </Animated.View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// OPTION GRID — 3 columns with mini avatar previews
// ═══════════════════════════════════════════════════════════════════════

const OptionCard = React.memo(
  ({
    opt,
    isSelected,
    config,
    configKey,
    onSelect,
    index,
  }: {
    opt: string;
    isSelected: boolean;
    config: AvatarV2Config;
    configKey: keyof AvatarV2Config;
    onSelect: (v: string) => void;
    index: number;
  }) => {
    const label = i18n.t(getOptionLabelKey(opt));
    const previewConfig = useMemo(
      () => ({ ...config, [configKey]: opt }),
      [config, configKey, opt],
    );

    return (
      <Animated.View entering={FadeInDown.delay(index * 20).duration(200)}>
        <TouchableOpacity
          onPress={() => onSelect(opt)}
          style={[styles.oCard, isSelected && styles.oCardSel]}
          activeOpacity={0.75}
        >
          <View style={[styles.oPrev, isSelected && styles.oPrevSel]}>
            <AvatarV2View config={previewConfig} size={MINI_AVATAR} showBg={false} />
          </View>
          {isSelected && (
            <Animated.View entering={ZoomIn.springify()} style={styles.oBadge}>
              <Check size={12} color="#FFF" strokeWidth={3} />
            </Animated.View>
          )}
          <Text
            style={[styles.oLbl, isSelected && styles.oLblSel]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {label}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

function OptionGrid({
  options,
  selected,
  onSelect,
  configKey,
  config,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  configKey: keyof AvatarV2Config;
  config: AvatarV2Config;
}) {
  return (
    <View style={styles.oGrid}>
      {options.map((opt, idx) => (
        <OptionCard
          key={opt}
          opt={opt}
          isSelected={opt === selected}
          config={config}
          configKey={configKey}
          onSelect={onSelect}
          index={idx}
        />
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgPrimary },

  // ── Top Section ──────────────────────────────────────────────────
  topSection: { backgroundColor: C.bgPrimary, paddingBottom: 8 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  hBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.3,
  },
  hRight: { flexDirection: 'row', gap: 6 },
  hBtnSm: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.3 },

  // Preview
  previewArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: AVATAR_PREVIEW_SIZE * 1.5,
    height: AVATAR_PREVIEW_SIZE * 1.5,
    borderRadius: AVATAR_PREVIEW_SIZE * 0.75,
    backgroundColor: C.accent,
    opacity: 0.06,
  },
  sideCol: { alignItems: 'center', gap: 6, width: 54 },
  sideBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
  },
  sideLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    textAlign: 'center',
  },
  avatarWrap: { marginHorizontal: 16 },
  avatarRing: {
    padding: 4,
    borderRadius: AVATAR_PREVIEW_SIZE / 2 + 8,
    borderWidth: 3,
    borderColor: C.accent + '40',
    ...Platform.select({
      ios: {
        shadowColor: C.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  avatarClip: {
    width: AVATAR_PREVIEW_SIZE,
    height: AVATAR_PREVIEW_SIZE,
    borderRadius: AVATAR_PREVIEW_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: C.bgSecondary,
  },

  // ── Editor Panel ─────────────────────────────────────────────────
  panel: {
    flex: 1,
    backgroundColor: C.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: C.borderLight,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  panelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },

  // Category Tabs
  catScroll: { maxHeight: 84 },
  catRow: { paddingHorizontal: 10, gap: 2, alignItems: 'flex-start' },
  catTab: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 64,
    position: 'relative',
  },
  catTabOn: { backgroundColor: 'rgba(255,255,255,0.04)' },
  catIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bgElevated,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  catEmoji: { fontSize: 20 },
  catLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    textAlign: 'center',
  },
  catLblOn: { color: C.white, fontWeight: '800' },
  catBar: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },

  // Subcategory Pills
  subScroll: {
    maxHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  subRow: {
    paddingHorizontal: 14,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 6,
  },
  subPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: C.bgElevated,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  subPillOn: {
    backgroundColor: C.accentSoft,
    borderColor: C.accentBorder,
  },
  subTxt: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  subTxtOn: { color: C.accentLight, fontWeight: '700' },

  // Options
  optScroll: { flex: 1 },
  optContent: { padding: 14, paddingBottom: 24 },

  // ── Color Picker ─────────────────────────────────────────────────
  clrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  clrOuter: {
    width: COLOR_SWATCH_SIZE,
    height: COLOR_SWATCH_SIZE,
    borderRadius: COLOR_SWATCH_SIZE / 2,
    padding: 3,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  clrOuterSel: {
    borderColor: C.accent,
    ...Platform.select({
      ios: {
        shadowColor: C.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
    }),
  },
  clrInner: {
    flex: 1,
    borderRadius: COLOR_SWATCH_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  clrNatural: { fontSize: 12, fontWeight: '800', color: '#FFF', opacity: 0.7 },
  clrCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Option Cards ─────────────────────────────────────────────────
  oGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: OPTION_GAP,
    justifyContent: 'flex-start',
  },
  oCard: {
    width: OPTION_CARD_SIZE,
    backgroundColor: C.bgElevated,
    borderRadius: 18,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.border,
    position: 'relative',
    borderBottomWidth: 5,
    borderBottomColor: C.bgCard,
  },
  oCardSel: {
    borderColor: C.accent,
    backgroundColor: C.accentSoft,
    borderBottomColor: C.accent,
  },
  oPrev: {
    width: MINI_AVATAR,
    height: MINI_AVATAR,
    borderRadius: MINI_AVATAR / 2,
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: C.bgPrimary,
  },
  oPrevSel: { backgroundColor: C.bgSecondary },
  oBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.bgElevated,
  },
  oLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  oLblSel: { color: C.white, fontWeight: '800' },

  // ── Save Bar ─────────────────────────────────────────────────────
  saveBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: C.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    borderBottomWidth: 4,
    borderBottomColor: C.greenDark,
    ...Platform.select({
      ios: {
        shadowColor: C.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  saveTxt: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.4,
  },
});
