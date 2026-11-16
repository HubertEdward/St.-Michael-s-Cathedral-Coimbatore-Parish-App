// Whether text fields turn English letters into Tamil, the spellings this person has picked before,
// and the language to listen for when they speak instead of typing. Kept on the phone and shared by
// every field, so a choice made once applies everywhere.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { keepsEnglish, learnTamil, parish, tamilSpellings, type Language } from '@parish/core';
import { useSyncExternalStore } from 'react';

import { useLanguage } from '@/i18n';
import ta from '@/i18n/ta';

const MODE_KEY = `${parish.id}.tamilTyping`;
const WORDS_KEY = `${parish.id}.tamilWords`;
const VOICE_KEY = `${parish.id}.voice`;

let mode: boolean | undefined;
/** Latin word (lower case) → the spelling picked for it: Tamil, or the word itself to keep it in English. */
let words: Record<string, string> = {};
/** The language to listen for, and whether the person agreed to speech going to the phone's online service. */
let voice: { language?: Language; onlineOk?: boolean } = {};
/** Whether Tamil typing is on now, for finishing text outside a component. */
let inForce = false;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

void Promise.all([AsyncStorage.getItem(MODE_KEY), AsyncStorage.getItem(WORDS_KEY), AsyncStorage.getItem(VOICE_KEY)])
  .then(([savedMode, savedWords, savedVoice]) => {
    if (savedMode !== null) mode = savedMode === 'on';
    if (savedWords) words = JSON.parse(savedWords) as Record<string, string>;
    if (savedVoice) voice = JSON.parse(savedVoice) as typeof voice;
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
  inForce = saved ?? language === 'ta';
  return [inForce, set];
}

let screensCounted = false;

/** The spellings to offer for a word typed in English letters, most likely first: one picked before comes first. */
export function spellingsFor(latin: string): string[] {
  // The app's own Tamil counts as words people use (Anbiyam, parish words), once.
  if (!screensCounted) {
    screensCounted = true;
    learnTamil(JSON.stringify(ta), 1);
  }
  const picked = words[latin.toLowerCase()];
  return [...new Set([...(picked ? [picked] : []), ...tamilSpellings(latin)])].slice(0, 4);
}

export function rememberSpelling(latin: string, spelling: string) {
  const next = { ...words };
  // Only a choice different from what would come anyway is worth keeping.
  delete next[latin.toLowerCase()];
  if (tamilSpellings(latin, 1)[0] !== spelling) next[latin.toLowerCase()] = spelling;
  words = next;
  void AsyncStorage.setItem(WORDS_KEY, JSON.stringify(words)).catch(() => undefined);
}

/**
 * The text with a last word typed in English letters, and no space after it yet, turned into Tamil.
 * With `learn`, the Tamil words in it count as words this person uses, so they are offered first next time.
 */
export function finishTamilText(text: string, learn = false): string {
  const word = inForce ? /[A-Za-z]+$/.exec(text)?.[0] : undefined;
  const done = word && !keepsEnglish(word) ? text.slice(0, -word.length) + (spellingsFor(word)[0] ?? word) : text;
  if (learn) learnTamil(done);
  return done;
}

// The field being typed in, so that the screen's main button can finish its last word first.
let pending: (() => void) | undefined;
export const setPendingFinish = (finish: (() => void) | undefined) => {
  pending = finish;
};
/** Finish the last word of the field being typed in (called by the screen's main button before it acts). */
export const finishPendingTamil = () => pending?.();

/** The language to listen for (the app's language until the person picks one) and the online-speech agreement. */
export function useVoicePreferences() {
  const appLanguage = useLanguage();
  const saved = useSyncExternalStore(subscribe, () => voice);
  const save = (next: typeof voice) => {
    voice = next;
    notify();
    void AsyncStorage.setItem(VOICE_KEY, JSON.stringify(voice)).catch(() => undefined);
  };
  return {
    language: saved.language ?? appLanguage,
    setLanguage: (language: Language) => save({ ...voice, language }),
    /** Read fresh, since it changes during the start of listening. */
    onlineOk: () => voice.onlineOk === true,
    agreeOnline: () => save({ ...voice, onlineOk: true }),
  };
}
