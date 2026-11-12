import type { ParishProfile, Service, Weekday } from '@parish/core';

import { indianLatinRiteSacraments } from '../shared/sacraments';

// Facts gathered from public web listings on 2026-11-08. Every value marked
// TO CONFIRM must be checked by the parish office before a store release
// (see docs/CONTENT_CHECKLIST.md).

const mass = (day: Weekday, time: string, extra: Partial<Service> = {}): Service => ({
  id: `mass-${day}-${time.replace(':', '')}`,
  kind: 'mass',
  day,
  time,
  ...extra,
});
const weekdays: Weekday[] = [1, 2, 3, 4, 5, 6];

export default {
  id: 'st-michaels-coimbatore',
  name: { en: "St. Michael's Cathedral", ta: 'புனித மிக்கேல் பேராலயம்' },
  place: { en: 'Coimbatore', ta: 'கோயம்புத்தூர்' },
  diocese: { en: 'Roman Catholic Diocese of Coimbatore', ta: 'கோயம்புத்தூர் உரோமன் கத்தோலிக்க மறைமாவட்டம்' },
  languages: ['ta', 'en'],
  timeZone: 'Asia/Kolkata',
  // TO CONFIRM: exact postal address
  address: { en: 'Big Bazaar Street, Coimbatore 641 001, Tamil Nadu, India' },
  // TO CONFIRM: phone and email are taken from the parish website
  phone: '+914222392854',
  phoneDisplay: '+91 422 239 2854',
  email: 'parishpriest@stmichaelscathedral.in',
  website: 'https://stmichaelscathedral.in',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=St.+Michael%27s+Cathedral%2C+Big+Bazaar+Street%2C+Coimbatore',
  feast: {
    name: { en: 'Feast of St. Michael the Archangel', ta: 'புனித மிக்கேல் அதிதூதர் திருவிழா' },
    month: 9,
    day: 29,
  },

  clergy: [
    // TO CONFIRM: name taken from a Wikipedia-derived diocesan listing
    { role: 'bishop', name: 'Most Rev. Thomas Aquinas Lephonse', title: { en: 'Bishop of Coimbatore', ta: 'கோயம்புத்தூர் ஆயர்' } },
    // TO CONFIRM: current parish priest and assistant priests
    { role: 'parish-priest', name: null },
    { role: 'assistant-priest', name: null },
  ],

  history: {
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
  },

  // TO CONFIRM: a typical cathedral list; replace with the parish's own
  // ministries, associations and Anbiyams.
  ministries: [
    { id: 'altar-servers', kind: 'liturgical', name: { en: 'Altar servers', ta: 'பீடப் பணியாளர்கள்' }, description: { en: 'Serve at the altar during Mass and feasts.' } },
    { id: 'choir', kind: 'liturgical', name: { en: 'Choir', ta: 'பாடகர் குழு' }, description: { en: 'Leads the singing at Sunday and feast-day Masses.' } },
    { id: 'lectors', kind: 'liturgical', name: { en: 'Lectors', ta: 'வாசகர்கள்' }, description: { en: 'Proclaim the readings and the prayers of the faithful.' } },
    { id: 'ushers', kind: 'liturgical', name: { en: 'Ushers', ta: 'வரவேற்புப் பணியாளர்கள்' }, description: { en: 'Welcome people, guide seating and take up the collection.' } },
    { id: 'legion-of-mary', kind: 'association', name: { en: 'Legion of Mary', ta: 'மரியாயின் சேனை' }, description: { en: 'Prayer and visits to homes, the sick and the elderly.' } },
    { id: 'svp', kind: 'association', name: { en: 'Society of St. Vincent de Paul', ta: 'புனித வின்சென்ட் தே பவுல் சபை' }, description: { en: 'Care for the poor and needy families of the parish.' } },
    { id: 'youth', kind: 'association', name: { en: 'Catholic youth', ta: 'இளைஞர் இயக்கம்' }, description: { en: 'Faith formation, service and fellowship for young people.' } },
    { id: 'catechism', kind: 'formation', name: { en: 'Catechism', ta: 'மறைக்கல்வி' }, description: { en: 'Sunday faith formation for children, and preparation for the sacraments.' } },
    { id: 'anbiyams', kind: 'anbiyam', name: { en: 'Anbiyams (Basic Christian Communities)', ta: 'அன்பியங்கள்' }, description: { en: 'Neighbourhood communities that meet to pray, read the Word and serve.' } },
  ],

  sacraments: indianLatinRiteSacraments,

  // TO CONFIRM: from the parish website (page dated June 2025)
  timetable: [
    mass(0, '05:15'),
    mass(0, '06:30'),
    mass(0, '08:00'),
    mass(0, '17:30'),
    ...weekdays.map((day) => mass(day, '06:15')),
    mass(1, '18:30', { place: { en: 'Cemetery', ta: 'கல்லறைத் தோட்டம்' } }),
    ...weekdays.filter((day) => day !== 1).map((day) => mass(day, '18:30')),
  ],

  images: {
    patron: {
      source: require('./assets/saint.jpg'),
      credit: {
        en: 'St. Michael the Archangel, Guido Reni, 1635 (public domain, via Wikimedia Commons)',
        ta: 'புனித மிக்கேல் அதிதூதர், குய்டோ ரேனி, 1635 (பொது உரிமை, விக்கிமீடியா காமன்ஸ்)',
      },
    },
    // Photos supplied for the preview on 2026-11-12. TO CONFIRM: photographer and permission to publish.
    church: [
      { source: require('./assets/church.webp') },
      { source: require('./assets/church-steps.webp') },
      { source: require('./assets/church-avenue.webp') },
    ],
    night: { source: require('./assets/church-night.jpg') },
  },
  patronPrayer: 'st-michael',

  // Archangel red, gold and sky blue.
  colors: {
    light: {
      primary: '#8C1D2C',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFDAD9',
      onPrimaryContainer: '#3F0009',
      secondary: '#765A0B',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#FFDF9E',
      onSecondaryContainer: '#261A00',
      tertiary: '#3F5F90',
      tertiaryContainer: '#D6E3FF',
      onTertiaryContainer: '#001B3D',
      background: '#FFF8F6',
      surface: '#FFF8F6',
      surfaceVariant: '#F4DDDB',
      onSurfaceVariant: '#534342',
      outline: '#857372',
      outlineVariant: '#D8C2C0',
      elevation: {
        level0: 'transparent',
        level1: '#FCEFEC',
        level2: '#F9E8E5',
        level3: '#F6E1DE',
        level4: '#F5DFDC',
        level5: '#F3DAD7',
      },
    },
    dark: {
      primary: '#FFB3B3',
      onPrimary: '#680018',
      primaryContainer: '#7A1626',
      onPrimaryContainer: '#FFDAD9',
      secondary: '#E7C26C',
      onSecondary: '#3F2E00',
      secondaryContainer: '#5A4300',
      onSecondaryContainer: '#FFDF9E',
      tertiary: '#A8C8FF',
      tertiaryContainer: '#264777',
      onTertiaryContainer: '#D6E3FF',
      background: '#1A1111',
      surface: '#1A1111',
      surfaceVariant: '#534342',
      onSurfaceVariant: '#D8C2C0',
      outline: '#A08C8B',
      outlineVariant: '#534342',
      elevation: {
        level0: 'transparent',
        level1: '#251919',
        level2: '#2A1D1D',
        level3: '#302121',
        level4: '#322323',
        level5: '#362626',
      },
    },
  },

  lastChecked: '2026-11-08',
} satisfies ParishProfile;
