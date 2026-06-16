/**
 * PremiumPopup - Premium Upsell Modal
 *
 * Göz alıcı, animasyonlu bir popup. Kullanıcı uygulamaya ilk girdiğinde
 * veya belirli aralıklarla premium avantajlarını gösterir.
 * "Tekrar gösterme" seçeneği ile kullanıcı kalıcı olarak kapatabilir.
 *
 * Gösterim koşulları:
 * - Kullanıcı premium değilse
 * - Son gösterimden 24 saat geçmişse
 * - Kullanıcı "bir daha gösterme" demediyse
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Crown,
  Brain,
  Sparkles,
  Shield,
  Star,
  Zap,
  Mic,
  BarChart3,
  Gift,
  ChevronRight,
  Check,
  Wand2,
  BookPlus,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Storage Keys ───────────────────────────────────────────────────
const PREMIUM_POPUP_LAST_SHOWN = '@neuralis_premium_popup_last';
const PREMIUM_POPUP_DISMISSED = '@neuralis_premium_popup_dismissed';
const SHOW_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 saat

// ─── Premium Features ───────────────────────────────────────────────
const PREMIUM_FEATURES = [
  {
    icon: Wand2,
    title: 'Özel Konu Dersleri',
    description: 'İstediğin konuda YZ ile ders serisi oluştur',
    color: '#FFD700',
    gradient: ['#FFD700', '#FF8C00'] as const,
    highlight: true,
  },
  {
    icon: BookPlus,
    title: 'Sınırsız Seri Oluşturma',
    description: 'Konunu seç, YZ sana özel ders serisi hazırlasın',
    color: '#CE82FF',
    gradient: ['#CE82FF', '#A29BFE'] as const,
  },
  {
    icon: Mic,
    title: 'Sesli Gölge (Voice Shadow)',
    description: 'YZ ile birebir sesli konuşma pratiği',
    color: '#4FC3F7',
    gradient: ['#4FC3F7', '#0984E3'] as const,
  },
  {
    icon: Shield,
    title: 'Reklamsız Deneyim',
    description: 'Hiçbir reklam kesintisi olmadan odaklan',
    color: '#81C784',
    gradient: ['#81C784', '#00B894'] as const,
  },
  {
    icon: Sparkles,
    title: 'Özel Tilki Kozmetikleri',
    description: 'Premium kıyafetler ve aksesuarlar',
    color: '#FFA726',
    gradient: ['#FFA726', '#FF9600'] as const,
  },
  {
    icon: BarChart3,
    title: 'Gelişmiş Analitik',
    description: 'Detaylı performans raporları ve trendler',
    color: '#26C6DA',
    gradient: ['#26C6DA', '#00ACC1'] as const,
  },
  {
    icon: Zap,
    title: 'Seri Koruma Kalkanı',
    description: 'Günlük seri kırılmasını önle',
    color: '#FFD54F',
    gradient: ['#FFD54F', '#FFC107'] as const,
  },
];

// ─── Props ───────────────────────────────────────────────────────────
interface PremiumPopupProps {
  /** Kullanıcı premium mı? true ise popup gösterilmez */
  isPremium: boolean;
  /** Popup gösterilme durumunu dışarıdan kontrol etmek için (opsiyonel) */
  forceShow?: boolean;
}

export default function PremiumPopup({ isPremium, forceShow }: PremiumPopupProps) {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  // Animasyon değerleri
  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.85);
  const cardTranslateY = useSharedValue(50);
  const crownRotation = useSharedValue(0);

  // ─── Gösterim kontrolü ──────────────────────────────────────────
  useEffect(() => {
    if (isPremium) return;
    if (forceShow) {
      showPopup();
      return;
    }

    checkShouldShow();
  }, [isPremium, forceShow]);

  const checkShouldShow = async () => {
    try {
      const dismissed = await AsyncStorage.getItem(PREMIUM_POPUP_DISMISSED);
      if (dismissed === 'true') return;

      const lastShown = await AsyncStorage.getItem(PREMIUM_POPUP_LAST_SHOWN);
      const now = Date.now();

      if (!lastShown || now - parseInt(lastShown, 10) > SHOW_INTERVAL_MS) {
        // Biraz gecikmeyle göster (kullanıcı ana ekranı görsün)
        setTimeout(() => showPopup(), 2000);
      }
    } catch (e) {
      // Sessizce devam et
    }
  };

  const showPopup = () => {
    setVisible(true);
    overlayOpacity.value = withTiming(1, { duration: 300 });
    cardScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    cardTranslateY.value = withSpring(0, { damping: 16, stiffness: 100 });
    crownRotation.value = withDelay(
      400,
      withSequence(
        withTiming(-10, { duration: 150 }),
        withTiming(10, { duration: 150 }),
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      ),
    );

    // Son gösterim zamanını kaydet
    AsyncStorage.setItem(PREMIUM_POPUP_LAST_SHOWN, Date.now().toString());
  };

  const hidePopup = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withTiming(0.85, { duration: 200 });
    cardTranslateY.value = withTiming(50, { duration: 200 });
    setTimeout(() => setVisible(false), 220);
  }, []);

  const handleDismissForever = useCallback(async () => {
    await AsyncStorage.setItem(PREMIUM_POPUP_DISMISSED, 'true');
    hidePopup();
  }, [hidePopup]);

  const handleUpgrade = useCallback(() => {
    hidePopup();
    setTimeout(() => router.push('/premium'), 300);
  }, [hidePopup, router]);

  // ─── Animasyonlu stiller ────────────────────────────────────────
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }, { translateY: cardTranslateY.value }],
  }));

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${crownRotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* ─── Arka Plan Gradient ─── */}
          <LinearGradient
            colors={['#1A1A2E', '#16213E', '#0F3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* ─── Kapat Butonu ─── */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={hidePopup}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={22} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            {/* ─── Başlık Alanı ─── */}
            <Animated.View style={[styles.crownContainer, crownStyle]}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.crownCircle}>
                <Crown size={36} color="#FFF" fill="#FFF" />
              </LinearGradient>
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(200).duration(400)} style={styles.title}>
              Neuralis Premium
            </Animated.Text>

            <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={styles.subtitle}>
              Öğrenme deneyimini bir üst seviyeye taşı! 🚀
            </Animated.Text>

            {/* ─── Özellik Listesi ─── */}
            <ScrollView
              style={styles.featureScroll}
              contentContainerStyle={styles.featureScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {PREMIUM_FEATURES.map((feature, index) => (
                <Animated.View
                  key={feature.title}
                  entering={FadeInDown.delay(350 + index * 60).duration(350)}
                  style={[
                    styles.featureRow,
                    'highlight' in feature && feature.highlight && styles.featureRowHighlight,
                  ]}
                >
                  <LinearGradient
                    colors={feature.gradient}
                    style={[
                      styles.featureIconCircle,
                      'highlight' in feature &&
                        feature.highlight &&
                        styles.featureIconCircleHighlight,
                    ]}
                  >
                    <feature.icon
                      size={'highlight' in feature && feature.highlight ? 22 : 18}
                      color="#FFF"
                    />
                  </LinearGradient>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                  <Check size={16} color="#2ECC71" />
                </Animated.View>
              ))}
            </ScrollView>

            {/* ─── CTA Butonları ─── */}
            <Animated.View entering={FadeInUp.delay(800).duration(400)} style={styles.ctaContainer}>
              {/* Ücretsiz Deneme */}
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleUpgrade}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FFD700', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaGradient}
                >
                  <Gift size={20} color="#FFF" />
                  <Text style={styles.ctaText}>7 Gün Ücretsiz Dene</Text>
                  <ChevronRight size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Daha sonra */}
              <TouchableOpacity style={styles.laterButton} onPress={hidePopup}>
                <Text style={styles.laterText}>Daha Sonra</Text>
              </TouchableOpacity>

              {/* Bir daha gösterme */}
              <TouchableOpacity style={styles.dismissButton} onPress={handleDismissForever}>
                <Text style={styles.dismissText}>Bir daha gösterme</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* ─── Alt Bilgi ─── */}
            <Animated.Text entering={FadeIn.delay(1000)} style={styles.footerText}>
              İstediğin zaman iptal edebilirsin • Ödeme alınmaz
            </Animated.Text>

            {/* ─── Dekoratif parıltı efektleri ─── */}
            <View style={[styles.sparkle, { top: 20, left: 30 }]}>
              <Star size={12} color="rgba(255,215,0,0.4)" fill="rgba(255,215,0,0.4)" />
            </View>
            <View style={[styles.sparkle, { top: 60, right: 40 }]}>
              <Sparkles size={14} color="rgba(206,130,255,0.3)" />
            </View>
            <View style={[styles.sparkle, { bottom: 80, left: 25 }]}>
              <Star size={10} color="rgba(255,215,0,0.3)" fill="rgba(255,215,0,0.3)" />
            </View>
            <View style={[styles.sparkle, { bottom: 120, right: 30 }]}>
              <Zap size={12} color="rgba(255,200,0,0.3)" />
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 40, 400),
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  cardGradient: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  crownCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  featureScroll: {
    maxHeight: SCREEN_HEIGHT * 0.35,
    marginBottom: 16,
  },
  featureScrollContent: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  featureRowHighlight: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.35)',
    borderWidth: 1.5,
    padding: 14,
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconCircleHighlight: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '400',
  },
  ctaContainer: {
    alignItems: 'center',
    gap: 8,
  },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  laterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  laterText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  dismissButton: {
    paddingVertical: 4,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.25)',
    textDecorationLine: 'underline',
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 12,
  },
  sparkle: {
    position: 'absolute',
    pointerEvents: 'none',
  },
});
