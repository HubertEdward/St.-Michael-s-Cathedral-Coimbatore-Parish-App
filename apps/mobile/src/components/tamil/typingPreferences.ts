// Whether text fields turn English letters into Tamil, and the spellings this person has picked before.
// Kept on the phone and shared by every field, so a choice made once applies everywhere.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parish } from '@parish/core';
import { useSyncExternalStore } from 'react';

import { useLanguage } from '@/i18n';

const MODE_KEY = `${parish.id}.tamilTyping`;
const WORDS_KEY = `${parish.id}.tamilWords`;

let mode: boolean | undefined;
/** Latin word (lower case) → the spelling picked for it: Tamil, or the word itself to keep it in English. */
let words: Record<string, string> = {};
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

void Promise.all([AsyncStorage.getItem(MODE_KEY), AsyncStorage.getItem(WORDS_KEY)])
  .then(([savedMode, savedWords]) => {
    if (savedMode !== null) mode = savedMode === 'on';
    if (savedWords) words = JSON.parse(savedWords) as Record<string, string>;
    notify();
  })
  .catch(() => undefined);

/** Tamil typing is on by default when the app is in Tamil, until the person switches it. */
export function useTamilTyping(): [boolean, (on: boolean) => void] {
  const language = useLanguage();
  const saved = useSyncExternalStore(subscribe, () => mode);
  const set = (on: boolean) => {
    mode = on;
    notify();
    void AsyncStorage.setItem(MODE_KEY, on ? 'on' : 'off').catch(() => undefined);
  };
  return [saved ?? language === 'ta', set];
}

/** The spelling picked earlier for a word typed in English letters, if any. */
export const pickedSpelling = (latin: string): string | undefined => words[latin.toLowerCase()];

export function rememberSpelling(latin: string, spelling: string) {
  words = { ...words, [latin.toLowerCase()]: spelling };
  void AsyncStorage.setItem(WORDS_KEY, JSON.stringify(words)).catch(() => undefined);
}
