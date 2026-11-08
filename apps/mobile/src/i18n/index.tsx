import AsyncStorage from '@react-native-async-storage/async-storage';
import { pick, type Language, type Localized } from '@stmichaels/core';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { initReactI18next, useTranslation } from 'react-i18next';

import en, { type Strings } from './en';
import ta from './ta';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: Strings };
  }
}

const STORAGE_KEY = 'stmichaels.language';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ta: { translation: ta } },
  lng: getLocales()[0]?.languageCode === 'ta' ? 'ta' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

interface LanguageState {
  /** False until the saved choice has been read from storage. */
  ready: boolean;
  /** Whether the person has picked a language (first launch shows the picker). */
  chosen: boolean;
  choose: (language: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ ready: false, chosen: false });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (saved) => {
        if (saved === 'en' || saved === 'ta') await i18n.changeLanguage(saved);
        setState({ ready: true, chosen: saved !== null });
      })
      .catch(() => setState({ ready: true, chosen: false }));
  }, []);

  const choose = async (language: Language) => {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(STORAGE_KEY, language);
    setState({ ready: true, chosen: true });
  };

  return <LanguageContext value={{ ...state, choose }}>{children}</LanguageContext>;
}

export function useLanguageState(): LanguageState {
  const state = use(LanguageContext);
  if (!state) throw new Error('useLanguageState must be used inside LanguageProvider');
  return state;
}

export function useLanguage(): Language {
  const { i18n: instance } = useTranslation();
  return instance.language === 'ta' ? 'ta' : 'en';
}

/** Picks the current language from bilingual parish content. */
export function useLocalized(): (text: Localized) => string {
  const language = useLanguage();
  return (text) => pick(text, language);
}
