// Phase 1 demo store: the whole dataset as one JSON document in AsyncStorage
// (localStorage on the web). Phase 2 replaces this file with the backend
// client; the functions in api.ts keep their signatures.
//
// On the web, the parishioner and office apps served from one origin (the demo
// page, see demo/) share this document, and each sees the other's changes live.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { parish } from '../parish';
import { createSeed, type ParishData } from './seed';

const STORAGE_KEY = `${parish.id}.demo.v4`;

let cache: Promise<ParishData> | null = null;
const listeners = new Set<() => void>();

function load(): Promise<ParishData> {
  cache ??= AsyncStorage.getItem(STORAGE_KEY).then((raw) =>
    raw ? (JSON.parse(raw) as ParishData) : createSeed(new Date()),
  );
  return cache;
}

export async function read<T>(select: (data: ParishData) => T): Promise<T> {
  return select(await load());
}

export async function write<T>(change: (data: ParishData) => T): Promise<T> {
  const data = await load();
  const result = change(data);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return result;
}

export async function resetDemoData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  cache = null;
}

/** Calls `listener` when another app or tab changes the demo data (web only). Returns an unsubscribe function. */
export function subscribeToDemoData(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The browser fires `storage` in every other tab and frame of the origin when the document changes.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    cache = null;
    listeners.forEach((listener) => listener());
  });
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
