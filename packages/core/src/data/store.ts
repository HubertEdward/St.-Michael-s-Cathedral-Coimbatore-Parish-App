// Phase 1 demo store: the whole dataset as one JSON document in AsyncStorage
// (localStorage on the web). Phase 2 replaces this file with the backend
// client; the functions in api.ts keep their signatures.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createSeed, type ParishData } from './seed';

const STORAGE_KEY = 'stmichaels.demo.v1';

let options = { sampleRequests: false };
let cache: Promise<ParishData> | null = null;

/** Call once at app start. The admin app shows sample requests; the parishioner app starts empty. */
export function configureDemoStore(next: { sampleRequests: boolean }) {
  options = next;
}

function load(): Promise<ParishData> {
  cache ??= AsyncStorage.getItem(STORAGE_KEY).then((raw) =>
    raw ? (JSON.parse(raw) as ParishData) : createSeed(new Date(), options),
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

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
