// Favourite songs and recently opened ones, kept on this phone only.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const KEY = 'songs.saved';
const RECENT = 30;

interface Prefs {
  /** Song ids. */
  favourites: string[];
  /** Song ids, most recently opened first. */
  recent: string[];
}

let prefs: Prefs = { favourites: [], recent: [] };
let loading: Promise<void> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function load(): Promise<void> {
  loading ??= AsyncStorage.getItem(KEY)
    .then((raw) => {
      if (!raw) return;
      prefs = { ...prefs, ...(JSON.parse(raw) as Partial<Prefs>) };
      emit();
    })
    .catch(() => undefined);
  return loading;
}

function save(next: Prefs) {
  prefs = next;
  emit();
  void AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Changes wait for what is saved to load, so an early change never overwrites it.
export async function toggleFavourite(id: string) {
  await load();
  const favourites = prefs.favourites.includes(id) ? prefs.favourites.filter((x) => x !== id) : [id, ...prefs.favourites];
  save({ ...prefs, favourites });
}

/** Remembers that a song was opened, for the Recent list. */
export async function songOpened(id: string) {
  await load();
  save({ ...prefs, recent: [id, ...prefs.recent.filter((x) => x !== id)].slice(0, RECENT) });
}

export function useSongPrefs(): Prefs {
  void load();
  return useSyncExternalStore(subscribe, () => prefs);
}
