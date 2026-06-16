/**
 * LanguageSelector - Dil Seçici Komponenti
 * 6 dil desteği ile dil değiştirme
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Globe, Check, ChevronRight, X } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { SUPPORTED_LANGUAGES, setLanguage, getCurrentLanguage, t } from '../i18n';

interface LanguageSelectorProps {
  onLanguageChange?: (langCode: string) => void;
  style?: object;
  compact?: boolean;
}

export function LanguageSelector({
  onLanguageChange,
  style,
  compact = false,
}: LanguageSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  const handleSelectLanguage = (langCode: string) => {
    setLanguage(langCode);
    setCurrentLang(langCode);
    setShowModal(false);
    onLanguageChange?.(langCode);
  };

  const getCurrentLangData = () => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];
  };

  const currentLangData = getCurrentLangData();

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactButton, style]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.compactFlag}>{currentLangData.flag}</Text>
        <Text style={styles.compactCode}>{currentLangData.code.toUpperCase()}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <Globe size={20} color={COLORS.text.secondary} />
          <View style={styles.buttonText}>
            <Text style={styles.label}>{t('profile.language')}</Text>
            <Text style={styles.value}>
              {currentLangData.flag} {currentLangData.name}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={COLORS.text.muted} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.language')}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
                <X size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Language List */}
            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = item.code === currentLang;
                return (
                  <TouchableOpacity
                    style={[styles.languageItem, isSelected && styles.languageItemSelected]}
                    onPress={() => handleSelectLanguage(item.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.languageFlag}>{item.flag}</Text>
                    <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                      {item.name}
                    </Text>
                    {isSelected && <Check size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.tertiary,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    marginLeft: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginTop: 2,
  },

  // Compact button
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  compactFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  compactCode: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.secondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SPACING.xs,
  },

  // Language items
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  languageItemSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  languageName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.primary,
  },
  languageNameSelected: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
});

export default LanguageSelector;
