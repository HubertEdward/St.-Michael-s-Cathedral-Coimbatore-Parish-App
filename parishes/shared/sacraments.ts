import type { SacramentGuide } from '@parish/core';

// General guidance from common practice in Indian Latin-rite parishes, for a
// parish profile to start from. TO CONFIRM: each parish office must review
// every step and document before its app is released.
export const indianLatinRiteSacraments: SacramentGuide[] = [
  {
    id: 'baptism',
    name: { en: 'Baptism', ta: 'திருமுழுக்கு' },
    summary: { en: 'Infant baptism for children of parish families.' },
    steps: [
      { en: 'Meet the parish priest or the office at least two weeks before the preferred date.' },
      { en: 'Parents and godparents attend the short preparation talk.' },
      { en: 'Agree the date and time of the baptism with the office.' },
    ],
    documents: [
      { en: 'Child’s birth certificate (copy)' },
      { en: 'Parents’ church marriage certificate' },
      { en: 'Godparent: a confirmed, practising Catholic, at least 16 years old; a letter from their parish priest if they belong to another parish' },
    ],
  },
  {
    id: 'first-communion',
    name: { en: 'First Holy Communion', ta: 'புது நன்மை' },
    summary: { en: 'Prepared through the parish catechism classes.' },
    steps: [
      { en: 'Enrol the child in parish catechism classes.' },
      { en: 'Complete the preparation year and the first confession.' },
      { en: 'The parish announces the date of the First Holy Communion Mass.' },
    ],
    documents: [{ en: 'Baptism certificate, if baptised in another parish' }],
  },
  {
    id: 'confirmation',
    name: { en: 'Confirmation', ta: 'உறுதிப்பூசுதல்' },
    summary: { en: 'Conferred by the Bishop after catechism preparation.' },
    steps: [
      { en: 'Complete the confirmation preparation in catechism classes.' },
      { en: 'Choose a sponsor who is a confirmed, practising Catholic.' },
      { en: 'Attend the confirmation Mass on the date announced.' },
    ],
    documents: [{ en: 'Baptism certificate, if baptised in another parish' }],
  },
  {
    id: 'marriage',
    name: { en: 'Marriage', ta: 'திருமணம்' },
    summary: { en: 'Meet the parish priest at least three months before the wedding.' },
    steps: [
      { en: 'Meet the parish priest at least three months before the wedding date.' },
      { en: 'Complete the diocesan marriage preparation course.' },
      { en: 'Banns are published on three Sundays in the parishes of both parties.' },
      { en: 'If one party is not Catholic, the parish priest applies for the required permission.' },
    ],
    documents: [
      { en: 'Baptism and confirmation certificates issued within the last six months' },
      { en: 'Marriage preparation course certificate' },
      { en: 'Letter of freedom to marry from the parish priest, for a party from another parish' },
      { en: 'Proof of age and identity' },
    ],
  },
  {
    id: 'anointing',
    name: { en: 'Anointing of the Sick', ta: 'நோயில் பூசுதல்' },
    summary: { en: 'For the seriously ill or elderly; call a priest at any time.' },
    steps: [
      { en: 'Call the parish office or a priest; in an emergency, at any hour.' },
      { en: 'Share the patient’s name, address or hospital and ward.' },
    ],
    documents: [],
  },
  {
    id: 'funeral',
    name: { en: 'Funeral', ta: 'அடக்கச் சடங்கு' },
    summary: { en: 'Inform the parish office as soon as possible after a death.' },
    steps: [
      { en: 'Inform the parish office as soon as possible.' },
      { en: 'Agree the time of the funeral Mass and the burial.' },
      { en: 'The office guides the family on cemetery arrangements.' },
    ],
    documents: [{ en: 'Death certificate, when issued' }],
  },
];
