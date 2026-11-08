import type { Localized } from '../localized';

// Facts gathered from public web listings on 2026-11-08. Every value marked
// TO CONFIRM must be checked by the parish office before a store release
// (see docs/CONTENT_CHECKLIST.md).

export const parish = {
  name: { en: "St. Michael's Cathedral", ta: 'புனித மிக்கேல் பேராலயம்' } satisfies Localized,
  place: { en: 'Coimbatore', ta: 'கோயம்புத்தூர்' } satisfies Localized,
  diocese: { en: 'Roman Catholic Diocese of Coimbatore', ta: 'கோயம்புத்தூர் உரோமன் கத்தோலிக்க மறைமாவட்டம்' } satisfies Localized,
  // TO CONFIRM: exact postal address
  address: { en: 'Big Bazaar Street, Coimbatore 641 001, Tamil Nadu, India' } satisfies Localized,
  // TO CONFIRM: phone and email are taken from the parish website
  phone: '+914222392854',
  phoneDisplay: '+91 422 239 2854',
  email: 'parishpriest@stmichaelscathedral.in',
  website: 'https://stmichaelscathedral.in',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=St.+Michael%27s+Cathedral%2C+Big+Bazaar+Street%2C+Coimbatore',
  feast: {
    name: { en: 'Feast of St. Michael the Archangel', ta: 'புனித மிக்கேல் அதிதூதர் திருவிழா' } satisfies Localized,
    month: 9,
    day: 29,
  },
  /** Date the facts in this file were last checked; shown in the app. */
  lastChecked: '2026-11-08',
};

export type ClergyRole = 'bishop' | 'parish-priest' | 'assistant-priest';

export interface ClergyMember {
  role: ClergyRole;
  /** null until the parish office supplies the name. */
  name: string | null;
}

export const clergy: ClergyMember[] = [
  // TO CONFIRM: name taken from a Wikipedia-derived diocesan listing
  { role: 'bishop', name: 'Most Rev. Thomas Aquinas Lephonse' },
  // TO CONFIRM: current parish priest and assistant priests
  { role: 'parish-priest', name: null },
  { role: 'assistant-priest', name: null },
];

export const history: { title: Localized; paragraphs: Localized[] } = {
  title: { en: 'History of the cathedral', ta: 'பேராலய வரலாறு' },
  // TO CONFIRM: sources disagree on 1867 (blessing) versus 1869 (consecration)
  paragraphs: [
    {
      en: 'The Diocese of Coimbatore and its cathedral are dedicated to St. Michael the Archangel. The first bishop, Melchior de Marion Brésillac, chose the dedication in honour of his own patron saint and planned the church on the model of St. Peter’s Basilica in Rome.',
    },
    {
      en: 'Building took about seventeen years. The church was blessed on 28 April 1867 by Bishop Gladius Maria Depommier, the third Bishop of Coimbatore, who also provided three bells from France and the altar.',
    },
    {
      en: 'Bishop Bardou was the first bishop consecrated in the new cathedral, on 30 April 1874. The Vicariate Apostolic of Coimbatore became a diocese on 1 September 1886, with St. Michael’s as its cathedral.',
    },
    {
      en: 'Today the cathedral on Big Bazaar Street is the mother church of the diocese, beside the Bishop’s House, and celebrates its patronal feast every September.',
    },
  ],
};
