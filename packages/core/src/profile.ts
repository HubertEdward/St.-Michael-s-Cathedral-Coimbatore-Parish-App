import type { MD3Theme } from 'react-native-paper';

import type { Language, Localized } from './localized';
import type { Ministry, Service } from './types';

export type ClergyRole = 'bishop' | 'parish-priest' | 'assistant-priest';

export interface ClergyMember {
  role: ClergyRole;
  /** null until the parish office supplies the name. */
  name: string | null;
  /** Shown instead of the role's generic title, e.g. "Bishop of Coimbatore". */
  title?: Localized;
}

/** A picture bundled with the parish profile. */
export interface ParishImage {
  /** `require('./assets/…')` */
  source: number;
  /** Shown in About; required for anything that is not the parish's own photo. */
  credit?: Localized;
}

export interface SacramentGuide {
  id: string;
  name: Localized;
  summary: Localized;
  steps: Localized[];
  documents: Localized[];
}

/**
 * Everything that makes the apps belong to one parish. Each parish has a folder
 * under `parishes/` whose index.ts default-exports one of these; the app is
 * built for the parish named by the PARISH environment variable.
 */
export interface ParishProfile {
  /** The parish's folder name under `parishes/`. Also keeps each parish's stored data apart. */
  id: string;
  name: Localized;
  place: Localized;
  diocese: Localized;
  /** Languages the app offers, the default first. A single language skips the language picker. */
  languages: readonly [Language, ...Language[]];
  /** IANA time zone of the church, e.g. "Asia/Kolkata". Mass times are always shown in it. */
  timeZone: string;
  address: Localized;
  /** Dialable form, e.g. "+914222392854". */
  phone: string;
  phoneDisplay: string;
  email: string;
  website?: string;
  mapsUrl: string;
  feast: { name: Localized; month: number; day: number };
  clergy: ClergyMember[];
  history: { title: Localized; paragraphs: Localized[] };
  ministries: Ministry[];
  sacraments: SacramentGuide[];
  /** The weekly timetable the app starts with. */
  timetable: Service[];
  images: {
    /** The patron saint. */
    patron: ParishImage;
    /** Photos of the church, the main one first; the home screen cycles through them. Without any, the patron is shown. */
    church: ParishImage[];
    /** The church lit at night, shown on the home screen in the evening. */
    night?: ParishImage;
  };
  /** Id of the prayer to the patron saint in the shared prayers, if there is one. */
  patronPrayer?: string;
  /** Material 3 colours laid over the default light and dark themes. */
  colors: { light: Partial<MD3Theme['colors']>; dark: Partial<MD3Theme['colors']> };
  /** "YYYY-MM-DD" the facts in the profile were last checked; shown in the app. */
  lastChecked: string;
}
