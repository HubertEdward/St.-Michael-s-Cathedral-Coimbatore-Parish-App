// The connection to the parish's Supabase backend. Each app calls connectBackend once, before it renders,
// with the URL and publishable key from its .env.local (see README, "Backend").
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { parish } from '../parish';

let client: SupabaseClient | undefined;

interface Connection {
  url: string | undefined;
  publishableKey: string | undefined;
  /**
   * Which app this is. The parishioner and office apps keep separate sign-ins, so both can run in one
   * browser (the demo page) signed in as different people.
   */
  app: 'parishioner' | 'office';
}

export function connectBackend({ url, publishableKey, app }: Connection) {
  if (!url || !publishableKey) {
    throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the app’s .env.local (see README, "Backend").');
  }
  client = createClient(url, publishableKey, {
    auth: {
      storage: AsyncStorage,
      storageKey: `${parish.id}.${app}.auth`,
      autoRefreshToken: true,
      persistSession: true,
      // Phones have no address bar to read a session from; nor do the apps sign in through links.
      detectSessionInUrl: false,
    },
  });
  return client;
}

/** The connected client. */
export function db(): SupabaseClient {
  if (!client) throw new Error('connectBackend has not been called.');
  return client;
}

export const parishId = () => parish.id;
