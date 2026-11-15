// Tamil typed in English letters ("Tanglish"), the way people type on a phone without a Tamil keyboard:
// "vanakkam" → வணக்கம், "nandri" → நன்றி, "neengal" → நீங்கள். Rule-based and offline; it gives the
// most likely spelling first and a few alternatives for the sounds English letters cannot tell apart
// (n: ன/ண, l: ல/ள/ழ, r: ர/ற, t: ட/த/ற, e: ெ/ே, o: ொ/ோ, and a final a/ஆ). Capital S is ஸ.
// Self-contained so `node --test` can load it.

type Vowel = readonly [independent: string, sign: string];
type Unit =
  /** A doubled consonant (kk, nn, tt) is one unit, so both halves change together. */
  | { kind: 'consonant'; options: readonly string[]; double?: true }
  | { kind: 'vowel'; options: readonly Vowel[] }
  | { kind: 'text'; text: string };

const A: Vowel = ['அ', ''];
const AA: Vowel = ['ஆ', 'ா'];
const E: Vowel = ['எ', 'ெ'];
const EE: Vowel = ['ஏ', 'ே'];
const O: Vowel = ['ஒ', 'ொ'];
const OO: Vowel = ['ஓ', 'ோ'];

// Longest first. Capitals are for typists who know the convention (A = ஆ, E = ஏ, ...).
const vowels: [string, readonly Vowel[]][] = [
  ['aa', [AA]],
  ['ai', [['ஐ', 'ை']]],
  ['au', [['ஔ', 'ௌ']]],
  ['ii', [['ஈ', 'ீ']]],
  ['ee', [['ஈ', 'ீ'], EE]],
  ['uu', [['ஊ', 'ூ']]],
  ['oo', [['ஊ', 'ூ'], OO]],
  ['A', [AA]],
  ['I', [['ஈ', 'ீ']]],
  ['U', [['ஊ', 'ூ']]],
  ['E', [EE]],
  ['O', [OO]],
  ['a', [A]],
  ['i', [['இ', 'ி']]],
  ['u', [['உ', 'ு']]],
  ['e', [E, EE]],
  ['o', [O, OO]],
];

const isVowelAt = (s: string, i: number) => i < s.length && 'aeiouAEIOU'.includes(s[i]!);
const c = (...options: string[]): Unit => ({ kind: 'consonant', options });
const doubled = (...options: string[]): Unit => ({ kind: 'consonant', options, double: true });

/** The consonant units starting at \`i\`, and how many letters they use; null if \`s[i]\` is not a consonant. */
function consonantAt(s: string, i: number): [Unit[], number] | null {
  const rest = s.slice(i);
  const first = i === 0;
  const has = (prefix: string) => rest.startsWith(prefix);

  // Clusters whose sound depends on the letters together.
  if (has('ndr') || has('ntr')) return [[c('ன', 'ண'), c('ற')], 3];
  if (has('nth') || has('ndh')) return [[c('ந'), c('த')], 3];
  if (has('nj')) return [[c('ஞ'), c('ச')], 2];
  if (has('ng')) return isVowelAt(s, i + 2) ? [[c('ங'), c('க')], 2] : [[c('ங')], 2];
  if ((has('nd') || has('nt')) && !'hr'.includes(s[i + 2] ?? '')) return [[c('ண', 'ன'), c('ட')], 2];
  if (has('tr') && !first) return [[doubled('ற')], 2];
  if (has('rr')) return [[doubled('ற')], 2];
  if (has('tt')) return [[doubled('ட', 'த')], 2];
  if (has('dd')) return [[doubled('ட')], 2];
  // Any other doubled letter: one unit, spelt as in the middle of a word (kk → க்க, nn → ன்ன or ண்ண).
  if (s[i + 1] === s[i] && !isVowelAt(s, i)) {
    const single = consonantAt(` ${s[i]}`, 1);
    const unit = single?.[0][0];
    if (single?.[0].length === 1 && unit?.kind === 'consonant') return [[{ ...unit, double: true }], 2];
  }
  if (has('zh')) return [[c('ழ')], 2];
  if (has('th') || has('dh')) return [[c('த')], 2];
  if (has('sh')) return [[c('ஷ')], 2];
  if (has('ch')) return [[c('ச')], 2];
  if (has('kh') || has('gh')) return [[c('க')], 2];
  if (has('ph')) return [[c('ப')], 2];
  if (has('ksh')) return [[c('க'), c('ஷ')], 3];

  // A final "l" in -kal/-gal is the plural கள் (ungal → உங்கள்).
  const finalL = i === s.length - 1 && /(ka|ga)$/.test(s.slice(0, i));

  switch (s[i]) {
    case 'n':
      return [[first ? c('ந') : c('ன', 'ண')], 1];
    case 'N':
      return [[c('ண')], 1];
    case 'd':
      return [[first ? c('த', 'ட') : c('ட', 'த')], 1];
    case 't':
      return [[first ? c('த', 'ட') : c('ட', 'த', 'ற')], 1];
    case 'D':
    case 'T':
      return [[c('ட')], 1];
    case 'k':
    case 'g':
    case 'q':
    case 'K':
    case 'G':
      return [[c('க')], 1];
    case 'c':
    case 's':
      return [[c('ச')], 1];
    case 'S':
      return [[c('ஸ')], 1];
    case 'j':
    case 'J':
      return [[c('ஜ')], 1];
    case 'h':
    case 'H':
      return [[c('ஹ')], 1];
    case 'f':
    case 'F':
      return [[{ kind: 'text', text: 'ஃ' }, c('ப')], 1];
    case 'b':
    case 'p':
    case 'B':
    case 'P':
      return [[c('ப')], 1];
    case 'v':
    case 'w':
    case 'V':
    case 'W':
      return [[c('வ')], 1];
    case 'y':
    case 'Y':
      return [[c('ய')], 1];
    case 'r':
      return [[c('ர', 'ற')], 1];
    case 'R':
      return [[c('ற')], 1];
    case 'l':
      return [[finalL ? c('ள', 'ல') : c('ல', 'ள', 'ழ')], 1];
    case 'L':
      return [[c('ள')], 1];
    case 'z':
    case 'Z':
      return [[c('ழ')], 1];
    case 'm':
    case 'M':
      return [[c('ம')], 1];
    case 'x':
    case 'X':
      return [[c('க'), c('ஸ')], 1];
    default:
      return null;
  }
}

function parse(word: string): Unit[] {
  const units: Unit[] = [];
  let i = 0;
  while (i < word.length) {
    const vowel = vowels.find(([latin]) => word.startsWith(latin, i));
    if (vowel) {
      const [latin, options] = vowel;
      // A word-final short "a" is often ஆ (amma, appa), so offer it.
      const final = i + latin.length === word.length;
      units.push({ kind: 'vowel', options: latin === 'a' && final && units.length > 0 ? [A, AA] : options });
      i += latin.length;
      // "ei" is எய் (deivam → தெய்வம்), not two vowels.
      if (latin === 'e' && word[i] === 'i' && !isVowelAt(word, i + 1)) {
        units.push(c('ய'));
        i += 1;
      }
      continue;
    }
    const consonant = consonantAt(word, i);
    if (consonant) {
      units.push(...consonant[0]);
      i += consonant[1];
      continue;
    }
    units.push({ kind: 'text', text: word[i]! });
    i += 1;
  }
  return units;
}

/** Tamil script for parsed units, taking the option each unit's index names (0 = most likely). */
function render(units: Unit[], choice: number[]): string {
  let out = '';
  for (let i = 0; i < units.length; i++) {
    const unit = units[i]!;
    if (unit.kind === 'text') out += unit.text;
    else if (unit.kind === 'vowel') out += unit.options[choice[i]!]![0];
    else {
      const next = units[i + 1];
      const option = unit.options[choice[i]!]!;
      const letter = unit.double ? `${option}்${option}` : option;
      if (next?.kind === 'vowel') {
        out += letter + next.options[choice[i + 1]!]![1];
        i++;
      } else out += `${letter}்`;
    }
  }
  return out;
}

// Common words the rules cannot spell from their sound alone.
const known: Record<string, string> = {
  vanakkam: 'வணக்கம்',
  amma: 'அம்மா',
  appa: 'அப்பா',
  thaatha: 'தாத்தா',
  maadha: 'மாதா',
  maatha: 'மாதா',
  maadhaa: 'மாதா',
  yesu: 'இயேசு',
  yesuvae: 'இயேசுவே',
  yesuve: 'இயேசுவே',
  yesuvin: 'இயேசுவின்',
  aandavar: 'ஆண்டவர்',
  andavar: 'ஆண்டவர்',
  aandavarae: 'ஆண்டவரே',
  iraivan: 'இறைவன்',
  iraivanae: 'இறைவனே',
  iraiva: 'இறைவா',
  kadavul: 'கடவுள்',
  kadavulae: 'கடவுளே',
  mariyaal: 'மரியாள்',
  mariye: 'மரியே',
  aathma: 'ஆத்மா',
  aanma: 'ஆன்மா',
  aanmaa: 'ஆன்மா',
  maranam: 'மரணம்',
  irandha: 'இறந்த',
  irandhavar: 'இறந்தவர்',
  irandhavargal: 'இறந்தவர்கள்',
  piranthanaal: 'பிறந்தநாள்',
  pirandhanaal: 'பிறந்தநாள்',
  thirumanam: 'திருமணம்',
  thirumana: 'திருமண',
  aasirvaadham: 'ஆசீர்வாதம்',
  aaseervaadham: 'ஆசீர்வாதம்',
  nandri: 'நன்றி',
  pugazh: 'புகழ்',
  arul: 'அருள்',
  anbu: 'அன்பு',
  karunai: 'கருணை',
  udal: 'உடல்',
  nalam: 'நலம்',
  nalla: 'நல்ல',
  vendum: 'வேண்டும்',
  vendudhal: 'வேண்டுதல்',
  kanni: 'கன்னி',
  makkal: 'மக்கள்',
  magan: 'மகன்',
  magal: 'மகள்',
  thaai: 'தாய்',
  pillaigal: 'பிள்ளைகள்',
  kuzhandhai: 'குழந்தை',
  kudumbam: 'குடும்பம்',
  thervu: 'தேர்வு',
  velai: 'வேலை',
  noi: 'நோய்',
};

/** True for a word typed with a capital first letter: a name or place to keep in English (Joseph, Coimbatore). */
export const keepsEnglish = (word: string) => /^[A-Z]/.test(word);

/**
 * Tamil spellings for one word typed in English letters, most likely first; empty when the word has
 * no English letters. Up to \`limit\` spellings, varying one uncertain letter at a time.
 */
export function tamilSpellings(word: string, limit = 4): string[] {
  if (!/[a-zA-Z]/.test(word)) return [];
  const units = parse(word);
  const primary = units.map(() => 0);
  const spellings = [known[word.toLowerCase()] ?? render(units, primary), render(units, primary)];
  units.forEach((unit, i) => {
    const count = unit.kind === 'text' ? 1 : unit.options.length;
    for (let option = 1; option < count; option++) spellings.push(render(units, primary.map((o, j) => (j === i ? option : o))));
  });
  return [...new Set(spellings)].slice(0, limit);
}

/** The most likely Tamil spelling of a word typed in English letters. */
export const toTamil = (word: string) => tamilSpellings(word, 1)[0] ?? word;
