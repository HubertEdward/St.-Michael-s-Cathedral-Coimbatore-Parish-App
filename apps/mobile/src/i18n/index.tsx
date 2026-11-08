import AsyncStorage from '@react-native-async-storage/async-storage';
import { parish, pick, type Language, type Localized } from '@parish/core';
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

/** Each language's name in that language, for the language picker. */
export const languageNames: Record<Language, string> = { ta: 'தமிழ்', en: 'English' };

/** The languages this parish's app offers; the first is the default. */
export const languages = parish.languages;

const STORAGE_KEY = `${parish.id}.language`;
const offered = (code: string | null | undefined): code is Language => languages.some((l) => l === code);
const deviceLanguage = getLocales()[0]?.languageCode;

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ta: { translation: ta } },
  lng: offered(deviceLanguage) ? deviceLanguage : languages[0],
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
  // With a single language there is nothing to choose.
  const [state, setState] = useState({ ready: languages.length === 1, chosen: languages.length === 1 });

  useEffect(() => {
    if (languages.length === 1) return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (saved) => {
        if (offered(saved)) await i18n.changeLanguage(saved);
        setState({ ready: true, chosen: offered(saved) });
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
  return offered(instance.language) ? instance.language : languages[0];
}

/** Picks the current language from parish content. */
export function useLocalized(): (text: Localized) => string {
  const language = useLanguage();
  return (text) => pick(text, language);
}
