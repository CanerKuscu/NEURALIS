/**
 * NEURALIS - Settings Screen
 * User preferences: theme, language, notifications, account management.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/config/supabase';
import { SPACING, RADIUS } from '../src/constants/theme';
import {
  ArrowLeft,
  LogOut,
  Moon,
  Bell,
  Shield,
  HelpCircle,
  Globe,
  Check,
  Eye,
  Type,
  Vibrate,
  Volume2,
  BarChart3,
  Bot,
  Sparkles,
  Flag,
  MessageSquare,
  Send,
  FileText,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '../src/i18n';
import { useToast } from '../src/context/ToastContext';
import { setMuted, getMuted } from '../src/utils/sounds';

import { useTheme } from '../src/context/ThemeContext';
import { useLanguage } from '../src/context/LanguageContext';

const SOUND_STORAGE_KEY = '@neuralis_sound_enabled';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface SettingItemProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value?: boolean;
  onPress?: () => void;
  type?: 'arrow' | 'switch';
  subValue?: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme, theme } = useTheme();
  const { showToast } = useToast();
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();

  // Privacy / Mock State
  const [notifications, setNotifications] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load saved sound preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(SOUND_STORAGE_KEY);
        if (saved !== null) {
          const enabled = saved === 'true';
          setSoundEnabled(enabled);
          setMuted(!enabled);
        }
      } catch {}
    })();
  }, []);

  const toggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    setMuted(!newValue);
    await AsyncStorage.setItem(SOUND_STORAGE_KEY, String(newValue));
  };

  // Feedback State
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);

  // Get display name for current language
  const getCurrentLangName = () => {
    const lang = availableLanguages.find((l) => l.code === currentLanguage);
    return lang?.name || 'English';
  };

  const handleLanguageChange = async (langCode: string) => {
    await setLanguage(langCode);
    setLangModalVisible(false);
    showToast('Language changed', { type: 'success' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast('Logged out successfully', { type: 'success' });
    router.replace('/(auth)/login');
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackSending(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await supabase.from('feedback').insert({
        user_id: session?.user?.id || 'anonymous',
        message: feedbackText.trim(),
        type: 'bug_report',
        created_at: new Date().toISOString(),
      });
      showToast(i18n.t('feedback.sent_success'), { type: 'success' });
      setFeedbackText('');
      setFeedbackModalVisible(false);
    } catch (err) {
      console.warn('Feedback submit failed:', err);
      showToast(i18n.t('feedback.sent_failed'), { type: 'error' });
    } finally {
      setFeedbackSending(false);
    }
  };

  const SettingItem = ({
    icon: Icon,
    label,
    value,
    onPress,
    type = 'arrow',
    subValue,
  }: SettingItemProps) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: theme.background.secondary }]}
      onPress={onPress}
      disabled={type === 'switch'}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconBox, { backgroundColor: `${theme.primary}20` }]}>
          <Icon size={20} color={theme.primary} />
        </View>
        <View>
          <Text style={[styles.itemLabel, { color: theme.text.primary }]}>{label}</Text>
          {subValue && (
            <Text style={[styles.itemSub, { color: theme.text.secondary }]}>{subValue}</Text>
          )}
        </View>
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={() => onPress?.()}
          trackColor={{ false: isDark ? '#444' : '#E0E0E0', true: theme.primary }}
        />
      ) : (
        <View style={[styles.arrow, { borderColor: theme.text.muted }]} />
      )}
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: theme.background.primary },
      ]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: theme.background.secondary, borderBottomColor: theme.border.light },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
          {i18n.t('settings.title')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Learning Preference */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
            {i18n.t('settings.learning')}
          </Text>
          <SettingItem
            icon={Globe}
            label={i18n.t('settings.language')}
            subValue={getCurrentLangName()}
            onPress={() => setLangModalVisible(true)}
          />
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
            {i18n.t('settings.general')}
          </Text>
          <SettingItem
            icon={Moon}
            label={i18n.t('settings.dark_mode')}
            type="switch"
            value={isDark}
            onPress={toggleTheme}
          />
          <SettingItem
            icon={Bell}
            label={i18n.t('settings.notifications')}
            type="switch"
            value={notifications}
            onPress={() => setNotifications(!notifications)}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
            {i18n.t('settings.support')}
          </Text>
          <SettingItem
            icon={HelpCircle}
            label={i18n.t('settings.help_center')}
            onPress={() => {}}
          />
          <SettingItem
            icon={Shield}
            label={i18n.t('settings.privacy_policy')}
            onPress={() => router.push('/legal')}
          />
          <SettingItem
            icon={FileText}
            label={i18n.t('settings.terms_of_service') || 'Terms of Service'}
            onPress={() => router.push('/legal?tab=terms')}
          />
        </View>

        {/* Accessibility */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
            {i18n.t('settings.accessibility')}
          </Text>
          <SettingItem
            icon={Volume2}
            label={i18n.t('settings.sound_effects')}
            type="switch"
            value={soundEnabled}
            onPress={toggleSound}
          />
          <SettingItem
            icon={Type}
            label={i18n.t('settings.large_text')}
            type="switch"
            value={largeText}
            onPress={() => setLargeText(!largeText)}
          />
          <SettingItem
            icon={Eye}
            label={i18n.t('settings.high_contrast')}
            type="switch"
            value={highContrast}
            onPress={() => setHighContrast(!highContrast)}
          />
          <SettingItem
            icon={Vibrate}
            label={i18n.t('settings.haptic_feedback')}
            type="switch"
            value={hapticEnabled}
            onPress={() => setHapticEnabled(!hapticEnabled)}
          />
          <SettingItem
            icon={Sparkles}
            label={i18n.t('settings.reduce_motion')}
            type="switch"
            value={reduceMotion}
            onPress={() => setReduceMotion(!reduceMotion)}
          />
        </View>

        {/* Tools */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
            {i18n.t('settings.tools')}
          </Text>
          <SettingItem
            icon={BarChart3}
            label={i18n.t('settings.analytics')}
            onPress={() => router.push('/analytics')}
          />
          <SettingItem
            icon={Bot}
            label={i18n.t('settings.ai_assistant')}
            onPress={() => router.push('/ai-chat')}
          />
        </View>

        {/* Feedback / Bug Report */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
            {i18n.t('feedback.title')}
          </Text>
          <SettingItem
            icon={Flag}
            label={i18n.t('feedback.report_bug')}
            subValue={i18n.t('feedback.report_bug_desc')}
            onPress={() => setFeedbackModalVisible(true)}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
            <LogOut size={20} color="#FF3B30" />
            <Text style={styles.signOutText}>{i18n.t('settings.sign_out')}</Text>
          </TouchableOpacity>
          <Text style={[styles.version, { color: theme.text.muted }]}>
            {i18n.t('settings.version')} 1.2.0
          </Text>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal transparent visible={langModalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.background.secondary, maxHeight: '80%' },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
              {i18n.t('settings.select_language')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {availableLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langOption, { borderBottomColor: theme.border.light }]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <View>
                    <Text
                      style={[
                        styles.langText,
                        { color: theme.text.primary },
                        currentLanguage === lang.code && {
                          color: theme.primary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {lang.flag} {lang.name}
                    </Text>
                  </View>
                  {currentLanguage === lang.code && <Check size={20} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.background.tertiary }]}
              onPress={() => setLangModalVisible(false)}
            >
              <Text style={[styles.closeText, { color: theme.text.primary }]}>
                {i18n.t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal transparent visible={feedbackModalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
              {i18n.t('feedback.feedback_label')}
            </Text>
            <Text style={[styles.feedbackHint, { color: theme.text.secondary }]}>
              {i18n.t('feedback.feedback_desc')}
            </Text>
            <TextInput
              style={[
                styles.feedbackInput,
                {
                  color: theme.text.primary,
                  borderColor: theme.border.light,
                  backgroundColor: theme.background.primary,
                },
              ]}
              placeholder={i18n.t('feedback.placeholder')}
              placeholderTextColor={theme.text.muted}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[
                styles.feedbackSendBtn,
                { backgroundColor: theme.primary, opacity: feedbackText.trim() ? 1 : 0.4 },
              ]}
              onPress={handleFeedbackSubmit}
              disabled={!feedbackText.trim() || feedbackSending}
            >
              <Send size={18} color="#FFF" />
              <Text style={styles.feedbackSendText}>
                {feedbackSending ? i18n.t('feedback.sending') : i18n.t('feedback.send')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.background.tertiary }]}
              onPress={() => setFeedbackModalVisible(false)}
            >
              <Text style={[styles.closeText, { color: theme.text.primary }]}>
                {i18n.t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
  },
  backButton: { padding: SPACING.xs },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  section: { marginTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { fontSize: 16, fontWeight: '500' },
  itemSub: { fontSize: 12 },
  arrow: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#CCC',
    transform: [{ rotate: '45deg' }],
  },
  footer: { marginTop: 40, marginBottom: SPACING.xl, paddingHorizontal: SPACING.lg, gap: 16 },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  signOutText: { color: '#FF3B30', fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  langText: { fontSize: 18 },
  langNative: { fontSize: 14, marginTop: 2 },
  closeBtn: { marginTop: 20, alignItems: 'center', padding: 16, borderRadius: 12 },
  closeText: { fontSize: 16, fontWeight: '700' },

  // Feedback Modal
  feedbackHint: { fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    marginBottom: 16,
  },
  feedbackSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  feedbackSendText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
