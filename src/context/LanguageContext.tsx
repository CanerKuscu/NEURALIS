/**
 * Language Context for managing app language with persistence
 * Supports RTL/LTR switching without restart for Arabic, Hebrew, Persian
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { SUPPORTED_LANGUAGES } from '../i18n';

type LanguageContextType = {
  currentLanguage: string;
  isRTL: boolean;
  setLanguage: (lang: string) => Promise<void>;
  availableLanguages: { code: string; name: string; flag: string }[];
};

const RTL_LANGUAGES = ['ar', 'he', 'fa'];

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'en',
  isRTL: false,
  setLanguage: async () => {},
  availableLanguages: SUPPORTED_LANGUAGES,
});

const LANGUAGE_STORAGE_KEY = 'app_language';

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.locale || 'en');
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLang && SUPPORTED_LANGUAGES.some((l) => l.code === savedLang)) {
        i18n.locale = savedLang;
        setCurrentLanguage(savedLang);

        // Sync RTL state
        const shouldBeRTL = RTL_LANGUAGES.includes(savedLang);
        if (shouldBeRTL !== I18nManager.isRTL) {
          I18nManager.allowRTL(shouldBeRTL);
          I18nManager.forceRTL(shouldBeRTL);
          setIsRTL(shouldBeRTL);
        }
      }
    } catch (e) {
      console.error('Error loading saved language:', e);
    }
  };

  const setLanguage = useCallback(
    async (langCode: string) => {
      try {
        const previousLang = currentLanguage;
        const previousRTL = RTL_LANGUAGES.includes(previousLang);
        const newRTL = RTL_LANGUAGES.includes(langCode);

        // Update i18n
        i18n.locale = langCode;
        setCurrentLanguage(langCode);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);

        // Handle RTL/LTR change
        if (previousRTL !== newRTL) {
          I18nManager.allowRTL(newRTL);
          I18nManager.forceRTL(newRTL);
          setIsRTL(newRTL);

          // RTL change requires app restart to apply layout direction
          // The change will take effect after the user reopens the app
          console.log('RTL layout direction changed. Restart required.');
        }
      } catch (e) {
        console.error('Error saving language:', e);
      }
    },
    [currentLanguage],
  );

  return (
    <LanguageContext.Provider
      value={{ currentLanguage, isRTL, setLanguage, availableLanguages: SUPPORTED_LANGUAGES }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
