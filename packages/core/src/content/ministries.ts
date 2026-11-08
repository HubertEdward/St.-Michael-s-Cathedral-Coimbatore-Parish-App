import type { Ministry } from '../types';

// TO CONFIRM: a typical cathedral list; replace with the parish's own
// ministries, associations and Anbiyams.
export const ministries: Ministry[] = [
  { id: 'altar-servers', kind: 'liturgical', name: { en: 'Altar servers', ta: 'பீடப் பணியாளர்கள்' }, description: { en: 'Serve at the altar during Mass and feasts.' } },
  { id: 'choir', kind: 'liturgical', name: { en: 'Choir', ta: 'பாடகர் குழு' }, description: { en: 'Leads the singing at Sunday and feast-day Masses.' } },
  { id: 'lectors', kind: 'liturgical', name: { en: 'Lectors', ta: 'வாசகர்கள்' }, description: { en: 'Proclaim the readings and the prayers of the faithful.' } },
  { id: 'ushers', kind: 'liturgical', name: { en: 'Ushers', ta: 'வரவேற்புப் பணியாளர்கள்' }, description: { en: 'Welcome people, guide seating and take up the collection.' } },
  { id: 'legion-of-mary', kind: 'association', name: { en: 'Legion of Mary', ta: 'மரியாயின் சேனை' }, description: { en: 'Prayer and visits to homes, the sick and the elderly.' } },
  { id: 'svp', kind: 'association', name: { en: 'Society of St. Vincent de Paul', ta: 'புனித வின்சென்ட் தே பவுல் சபை' }, description: { en: 'Care for the poor and needy families of the parish.' } },
  { id: 'youth', kind: 'association', name: { en: 'Catholic youth', ta: 'இளைஞர் இயக்கம்' }, description: { en: 'Faith formation, service and fellowship for young people.' } },
  { id: 'catechism', kind: 'formation', name: { en: 'Catechism', ta: 'மறைக்கல்வி' }, description: { en: 'Sunday faith formation for children, and preparation for the sacraments.' } },
  { id: 'anbiyams', kind: 'anbiyam', name: { en: 'Anbiyams (Basic Christian Communities)', ta: 'அன்பியங்கள்' }, description: { en: 'Neighbourhood communities that meet to pray, read the Word and serve.' } },
];
