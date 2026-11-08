import type { Localized } from '../localized';
import type { Weekday } from '../types';

export interface Prayer {
  id: string;
  title: Localized;
  text: Localized;
}

// Traditional English texts in the public domain. Tamil texts are added only
// after the parish supplies the approved translation used in the diocese.
export const prayers: Prayer[] = [
  {
    id: 'st-michael',
    title: { en: 'Prayer to St. Michael the Archangel', ta: 'புனித மிக்கேல் அதிதூதரிடம் செபம்' },
    text: {
      en: 'Saint Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray; and do thou, O Prince of the heavenly host, by the power of God, cast into hell Satan and all the evil spirits who prowl about the world seeking the ruin of souls. Amen.',
    },
  },
  {
    id: 'sign-of-the-cross',
    title: { en: 'Sign of the Cross' },
    text: { en: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.' },
  },
  {
    id: 'our-father',
    title: { en: 'Our Father' },
    text: {
      en: 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.',
    },
  },
  {
    id: 'hail-mary',
    title: { en: 'Hail Mary' },
    text: {
      en: 'Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
    },
  },
  {
    id: 'glory-be',
    title: { en: 'Glory Be' },
    text: {
      en: 'Glory be to the Father, and to the Son, and to the Holy Spirit; as it was in the beginning, is now, and ever shall be, world without end. Amen.',
    },
  },
  {
    id: 'apostles-creed',
    title: { en: 'Apostles’ Creed' },
    text: {
      en: 'I believe in God, the Father Almighty, Creator of heaven and earth; and in Jesus Christ, His only Son, our Lord; who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried. He descended into hell; the third day He rose again from the dead; He ascended into heaven, and sits at the right hand of God, the Father Almighty; from thence He shall come to judge the living and the dead. I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.',
    },
  },
  {
    id: 'memorare',
    title: { en: 'Memorare' },
    text: {
      en: 'Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thine intercession was left unaided. Inspired by this confidence, I fly unto thee, O Virgin of virgins, my Mother; to thee do I come, before thee I stand, sinful and sorrowful. O Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me. Amen.',
    },
  },
];

export interface RosaryMysteries {
  id: 'joyful' | 'luminous' | 'sorrowful' | 'glorious';
  name: Localized;
  days: Weekday[];
  mysteries: string[];
}

export const rosary: RosaryMysteries[] = [
  {
    id: 'joyful',
    name: { en: 'Joyful Mysteries', ta: 'மகிழ்ச்சி மறையுண்மைகள்' },
    days: [1, 6],
    mysteries: ['The Annunciation', 'The Visitation', 'The Nativity', 'The Presentation in the Temple', 'The Finding in the Temple'],
  },
  {
    id: 'luminous',
    name: { en: 'Luminous Mysteries', ta: 'ஒளி மறையுண்மைகள்' },
    days: [4],
    mysteries: ['The Baptism of the Lord', 'The Wedding at Cana', 'The Proclamation of the Kingdom', 'The Transfiguration', 'The Institution of the Eucharist'],
  },
  {
    id: 'sorrowful',
    name: { en: 'Sorrowful Mysteries', ta: 'துயர மறையுண்மைகள்' },
    days: [2, 5],
    mysteries: ['The Agony in the Garden', 'The Scourging at the Pillar', 'The Crowning with Thorns', 'The Carrying of the Cross', 'The Crucifixion'],
  },
  {
    id: 'glorious',
    name: { en: 'Glorious Mysteries', ta: 'மகிமை மறையுண்மைகள்' },
    days: [0, 3],
    mysteries: ['The Resurrection', 'The Ascension', 'The Descent of the Holy Spirit', 'The Assumption of Mary', 'The Coronation of Mary'],
  },
];

export function rosaryFor(day: Weekday): RosaryMysteries {
  return rosary.find((set) => set.days.includes(day))!;
}
