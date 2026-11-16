// Tamil typed in English letters ("Tanglish"), the way people type on a phone without a Tamil keyboard:
// "vanakkam" → வணக்கம், "nandri" → நன்றி, "neengal" → நீங்கள். Offline and rule-based. English letters
// cannot tell ன/ண/ந, ல/ள/ழ, ர/ற, ட/த/ற, short and long vowels apart, so every spelling the letters
// could mean is tried against a list of real Tamil words (a Lexicon) and the commonest real word wins;
// the rules alone decide only when no real word matches. The same file is in the Holy Rosary app
// (src/engine/tanglish.ts): keep the two the same. Self-contained so `node --test` can load it.

type Vowel = readonly [independent: string, sign: string];
type Unit =
  /**
   * `options` are the letters it could be, most likely first. Only the first `shown` are offered as
   * alternatives when no real word matches; the rest are tried against the word list only.
   * A doubled consonant (kk, nn, tt) is one unit, so both halves change together.
   */
  | { kind: 'consonant'; options: readonly string[]; shown: number; double?: true }
  | { kind: 'vowel'; options: readonly Vowel[]; shown: number }
  | { kind: 'text'; text: string };

const A: Vowel = ['அ', ''];
const AA: Vowel = ['ஆ', 'ா'];
const I: Vowel = ['இ', 'ி'];
const II: Vowel = ['ஈ', 'ீ'];
const U: Vowel = ['உ', 'ு'];
const UU: Vowel = ['ஊ', 'ூ'];
const E: Vowel = ['எ', 'ெ'];
const EE: Vowel = ['ஏ', 'ே'];
const O: Vowel = ['ஒ', 'ொ'];
const OO: Vowel = ['ஓ', 'ோ'];
const AI: Vowel = ['ஐ', 'ை'];
const AU: Vowel = ['ஔ', 'ௌ'];

const v = (shown: Vowel[], extra: Vowel[] = []): Unit => ({ kind: 'vowel', options: [...shown, ...extra], shown: shown.length });
const c = (shown: string[], extra: string[] = []): Unit => ({ kind: 'consonant', options: [...shown, ...extra], shown: shown.length });
const doubled = (shown: string[], extra: string[] = []): Unit => ({ ...(c(shown, extra) as Extract<Unit, { kind: 'consonant' }>), double: true });

// Longest first. Capitals are for typists who know the convention (A = ஆ, E = ஏ, ...). People often
// type a long vowel short ("pasam" for பாசம்), so short vowels also try the long one against the word list.
const vowels: [string, () => Unit][] = [
  ['aa', () => v([AA])],
  ['ai', () => v([AI])],
  ['au', () => v([AU])],
  ['ii', () => v([II])],
  ['ee', () => v([II, EE])],
  ['uu', () => v([UU])],
  ['oo', () => v([UU, OO])],
  ['A', () => v([AA])],
  ['I', () => v([II])],
  ['U', () => v([UU])],
  ['E', () => v([EE])],
  ['O', () => v([OO])],
  ['a', () => v([A], [AA])],
  ['i', () => v([I], [II])],
  ['u', () => v([U], [UU])],
  ['e', () => v([E, EE])],
  ['o', () => v([O, OO])],
];

const isVowelAt = (s: string, i: number) => i < s.length && 'aeiouAEIOU'.includes(s[i]!);

/** The consonant units starting at `i`, and how many letters they use; null if `s[i]` is not a consonant. */
function consonantAt(s: string, i: number): [Unit[], number] | null {
  const rest = s.slice(i);
  const first = i === 0;
  const has = (prefix: string) => rest.startsWith(prefix);

  // Clusters whose sound depends on the letters together.
  if (has('ndr') || has('ntr')) return [[c(['ன', 'ண']), c(['ற'])], 3];
  if (has('nth') || has('ndh')) return [[c(['ந']), c(['த'])], 3];
  if (has('nj')) return [[c(['ஞ']), c(['ச'])], 2];
  if (has('ng')) return isVowelAt(s, i + 2) ? [[c(['ங']), c(['க'])], 2] : [[c(['ங'])], 2];
  if ((has('nd') || has('nt')) && !'hr'.includes(s[i + 2] ?? '')) return [[c(['ண', 'ன'], ['ந']), c(['ட'], ['த'])], 2];
  if (has('tr') && !first) return [[doubled(['ற'])], 2];
  if (has('rr')) return [[doubled(['ற'])], 2];
  if (has('tt')) return [[doubled(['ட', 'த'], ['ற'])], 2];
  if (has('dd')) return [[doubled(['ட'])], 2];
  if (has('ksh')) return [[c(['க']), c(['ஷ'])], 3];
  // Any other doubled letter: one unit, spelt as in the middle of a word (kk → க்க, nn → ன்ன or ண்ண).
  if (s[i + 1] === s[i] && !isVowelAt(s, i)) {
    const single = consonantAt(` ${s[i]}`, 1);
    const unit = single?.[0][0];
    if (single?.[0].length === 1 && unit?.kind === 'consonant') return [[{ ...unit, double: true }], 2];
  }
  if (has('zh')) return [[c(['ழ'])], 2];
  if (has('th') || has('dh')) return [[c(['த'])], 2];
  if (has('sh')) return [[c(['ஷ'], ['ச'])], 2];
  if (has('ch')) return [[c(['ச'])], 2];
  if (has('kh') || has('gh')) return [[c(['க'])], 2];
  if (has('ph')) return [[c(['ப'])], 2];

  // A final "l" in -kal/-gal is the plural கள் (ungal → உங்கள்).
  const finalL = i === s.length - 1 && /(ka|ga)$/.test(s.slice(0, i));

  switch (s[i]) {
    case 'n':
      return [[first ? c(['ந']) : c(['ன', 'ண'], ['ந'])], 1];
    case 'N':
      return [[c(['ண'])], 1];
    case 'd':
      return [[first ? c(['த', 'ட']) : c(['ட', 'த'])], 1];
    case 't':
      return [[first ? c(['த', 'ட']) : c(['ட', 'த', 'ற'])], 1];
    case 'D':
    case 'T':
      return [[c(['ட'])], 1];
    case 'k':
    case 'g':
    case 'q':
    case 'K':
    case 'G':
      return [[c(['க'])], 1];
    case 'c':
    case 's':
      // Older prayers spell many words with ஸ or ஷ (ஸ்தோத்திரம், விஷயம்).
      return [[c(['ச'], ['ஸ', 'ஷ'])], 1];
    case 'S':
      return [[c(['ஸ'])], 1];
    case 'j':
    case 'J':
      return [[c(['ஜ'], ['ச'])], 1];
    case 'h':
    case 'H':
      return [[c(['ஹ'])], 1];
    case 'f':
    case 'F':
      return [[{ kind: 'text', text: 'ஃ' }, c(['ப'])], 1];
    case 'b':
    case 'p':
    case 'B':
    case 'P':
      return [[c(['ப'])], 1];
    case 'v':
    case 'w':
    case 'V':
    case 'W':
      return [[c(['வ'])], 1];
    case 'y':
    case 'Y':
      return [[c(['ய'])], 1];
    case 'r':
      return [[c(['ர', 'ற'])], 1];
    case 'R':
      return [[c(['ற'])], 1];
    case 'l':
      return [[finalL ? c(['ள', 'ல']) : c(['ல', 'ள', 'ழ'])], 1];
    case 'L':
      return [[c(['ள'])], 1];
    case 'z':
    case 'Z':
      return [[c(['ழ'])], 1];
    case 'm':
    case 'M':
      return [[c(['ம'])], 1];
    case 'x':
    case 'X':
      return [[c(['க']), c(['ஸ'])], 1];
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
      const [latin, make] = vowel;
      // A word-final short "a" is often ஆ (amma, appa), so offer it.
      const final = i + latin.length === word.length;
      units.push(latin === 'a' && final && units.length > 0 ? v([A, AA]) : make());
      i += latin.length;
      // "ei" is எய் (deivam → தெய்வம்), not two vowels.
      if (latin === 'e' && word[i] === 'i' && !isVowelAt(word, i + 1)) {
        units.push(c(['ய']));
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

const letterOf = (unit: Extract<Unit, { kind: 'consonant' }>, option: string) => (unit.double ? `${option}்${option}` : option);

/** Tamil script for parsed units, taking the option each unit's index names (0 = most likely). */
function render(units: Unit[], choice: number[]): string {
  let out = '';
  for (let i = 0; i < units.length; i++) {
    const unit = units[i]!;
    if (unit.kind === 'text') out += unit.text;
    else if (unit.kind === 'vowel') out += unit.options[choice[i]!]![0];
    else {
      const next = units[i + 1];
      const letter = letterOf(unit, unit.options[choice[i]!]!);
      if (next?.kind === 'vowel') {
        out += letter + next.options[choice[i + 1]!]![1];
        i++;
      } else out += `${letter}்`;
    }
  }
  return out;
}

/** One way a syllable could be written, and how many guesses beyond the letters typed it takes. */
type Spelling = { text: string; guesses: number };

/** The units grouped into syllables, each with every way it could be written (in order of likelihood). */
function syllables(units: Unit[]): Spelling[][] {
  const out: Spelling[][] = [];
  const guess = (index: number, shown: number) => (index < shown ? 0 : 1);
  for (let i = 0; i < units.length; i++) {
    const unit = units[i]!;
    if (unit.kind === 'text') out.push([{ text: unit.text, guesses: 0 }]);
    else if (unit.kind === 'vowel') out.push(unit.options.map(([independent], k) => ({ text: independent, guesses: guess(k, unit.shown) })));
    else {
      const next = units[i + 1];
      const letters = unit.options.map((o, k) => ({ text: letterOf(unit, o), guesses: guess(k, unit.shown) }));
      // A doubled letter is often typed single ("parisutha" for பரிசுத்த, "vaazhkai" for வாழ்க்கை).
      if (!unit.double && i > 0 && units[i - 1]?.kind !== 'text') letters.push(...unit.options.map((o, k) => ({ text: `${o}்${o}`, guesses: 1 + guess(k, unit.shown) })));
      if (next?.kind === 'vowel') {
        out.push(letters.flatMap((l) => next.options.map(([, sign], k) => ({ text: l.text + sign, guesses: l.guesses + guess(k, next.shown) }))));
        i++;
      } else out.push(letters.map((l) => ({ text: `${l.text}்`, guesses: l.guesses })));
    }
  }
  return out;
}

// Common words the rules cannot spell from their sound alone (a leading இ, a silent letter, ...).
const known: Record<string, string> = {
  vanakkam: 'வணக்கம்',
  amma: 'அம்மா',
  appa: 'அப்பா',
  thaatha: 'தாத்தா',
  thatha: 'தாத்தா',
  paati: 'பாட்டி',
  maadha: 'மாதா',
  maatha: 'மாதா',
  madha: 'மாதா',
  matha: 'மாதா',
  yesu: 'இயேசு',
  yesuve: 'இயேசுவே',
  yesuvae: 'இயேசுவே',
  yesuvin: 'இயேசுவின்',
  yesuvukku: 'இயேசுவுக்கு',
  iyesu: 'இயேசு',
  aandavar: 'ஆண்டவர்',
  andavar: 'ஆண்டவர்',
  aandavare: 'ஆண்டவரே',
  aandavarae: 'ஆண்டவரே',
  andavare: 'ஆண்டவரே',
  iraivan: 'இறைவன்',
  iraivane: 'இறைவனே',
  iraivanae: 'இறைவனே',
  iraiva: 'இறைவா',
  iraivaa: 'இறைவா',
  kadavul: 'கடவுள்',
  kadavule: 'கடவுளே',
  kadavulae: 'கடவுளே',
  mariyaal: 'மரியாள்',
  mariyal: 'மரியாள்',
  mariye: 'மரியே',
  aathma: 'ஆத்மா',
  aanma: 'ஆன்மா',
  aanmaa: 'ஆன்மா',
  aathmaa: 'ஆத்மா',
  piranthanaal: 'பிறந்தநாள்',
  pirandhanaal: 'பிறந்தநாள்',
  thirumanam: 'திருமணம்',
  aasirvaadham: 'ஆசீர்வாதம்',
  aaseervaadham: 'ஆசீர்வாதம்',
  asirvatham: 'ஆசீர்வாதம்',
  aseervatham: 'ஆசீர்வாதம்',
  nandri: 'நன்றி',
  vendum: 'வேண்டும்',
  vendudhal: 'வேண்டுதல்',
  venduthal: 'வேண்டுதல்',
  kudumbam: 'குடும்பம்',
  kuzhandhai: 'குழந்தை',
  kuzhanthai: 'குழந்தை',
  thervu: 'தேர்வு',
  velai: 'வேலை',
  noi: 'நோய்',
  udalnalam: 'உடல்நலம்',
  sugam: 'சுகம்',
  magan: 'மகன்',
  magal: 'மகள்',
  makan: 'மகன்',
  makal: 'மகள்',
  thambi: 'தம்பி',
  thangai: 'தங்கை',
  thangachi: 'தங்கச்சி',
  akka: 'அக்கா',
  anna: 'அண்ணா',
  annan: 'அண்ணன்',
  manaivi: 'மனைவி',
  kanavar: 'கணவர்',
  paiyan: 'பையன்',
  ponnu: 'பொண்ணு',
  nanbar: 'நண்பர்',
  nanban: 'நண்பன்',
  nanbi: 'நண்பி',
  veedu: 'வீடு',
  payanam: 'பயணம்',
  pirarthanai: 'பிரார்த்தனை',
  prarthanai: 'பிரார்த்தனை',
  irandhavar: 'இறந்தவர்',
  irandhavargal: 'இறந்தவர்கள்',
  irandha: 'இறந்த',
  aanmakkal: 'ஆன்மாக்கள்',
  velankanni: 'வேளாங்கண்ணி',
  jebamaalai: 'ஜெபமாலை',
  sebamaalai: 'செபமாலை',
  jebamalai: 'ஜெபமாலை',
  sebamalai: 'செபமாலை',
};

/**
 * Real Tamil words and how common each is, for choosing between the spellings English letters could
 * mean. `prefixes` lets the search stop early on a spelling no word starts with.
 */
export interface Lexicon {
  count: Map<string, number>;
  prefixes: Set<string>;
  /** Every word, commonest first, for completing a word being typed. */
  byCount: string[];
}

const TAMIL_WORD = /[஀-௿]+/g;

/** Counts of the Tamil words in some text, to build a lexicon from. */
export function countWords(texts: Iterable<string>, into = new Map<string, number>(), weight = 1): Map<string, number> {
  for (const text of texts) for (const word of text.match(TAMIL_WORD) ?? []) into.set(word, (into.get(word) ?? 0) + weight);
  return into;
}

export function makeLexicon(count: Map<string, number>): Lexicon {
  // The known words count too, so they are found as the stem of longer words.
  for (const word of Object.values(known)) count.set(word, (count.get(word) ?? 0) + 5);
  const prefixes = new Set<string>();
  for (const word of count.keys()) for (let end = 1; end <= word.length; end++) prefixes.add(word.slice(0, end));
  const byCount = [...count.keys()].sort((a, b) => count.get(b)! - count.get(a)!);
  return { count, prefixes, byCount };
}

/** Add words to a lexicon, such as Tamil the person has just written, so it is offered next time. */
export function learn(lexicon: Lexicon, text: string, weight = 3) {
  for (const word of text.match(TAMIL_WORD) ?? []) {
    lexicon.count.set(word, (lexicon.count.get(word) ?? 0) + weight);
    for (let end = 1; end <= word.length; end++) lexicon.prefixes.add(word.slice(0, end));
    if (!lexicon.byCount.includes(word)) lexicon.byCount.push(word);
  }
}

/**
 * The real words these syllables could spell, commonest first. 'stem' finds spellings that real words
 * begin with (சமாதானம் from சமாதானமும்), in order of likelihood; 'partial' also lets the last consonant
 * still be waiting for its vowel, for completing a word being typed.
 */
function search(parts: Spelling[][], lexicon: Lexicon, mode: 'word' | 'stem' | 'partial' = 'word'): string[] {
  const partial = mode === 'partial';
  const found: string[] = [];
  // Each guess beyond the letters typed (a long vowel typed short, a letter typed once for two)
  // makes a word less likely to be the one meant, however common it is: "pera" is பெற, not பெற்ற.
  const guesses = new Map<string, number>();
  const walk = (i: number, so: string, g: number) => {
    if (found.length >= 40) return;
    if (i === parts.length) {
      if (mode !== 'word' || lexicon.count.has(so)) {
        found.push(so);
        guesses.set(so, g);
      }
      return;
    }
    for (const { text: option, guesses: more } of parts[i]!) {
      const next = so + option;
      if (lexicon.prefixes.has(next)) walk(i + 1, next, g + more);
      // A stem ending in a consonant, found in real words only with an ending after it (சமாதானம|மும்).
      else if (mode === 'stem' && i === parts.length - 1 && next.endsWith('்') && lexicon.prefixes.has(next.slice(0, -1))) found.push(next);
      // A last consonant still being typed may yet take a vowel (aaseerv… → ஆசீர்வா…).
      else if (partial && i === parts.length - 1 && next.endsWith('்') && lexicon.prefixes.has(next.slice(0, -1))) found.push(next.slice(0, -1));
    }
  };
  walk(0, '', 0);
  const score = (w: string) => (lexicon.count.get(w) ?? 0) / 16 ** (guesses.get(w) ?? 0);
  return mode === 'word' ? found.sort((a, b) => score(b) - score(a)) : found;
}

/** The word without punctuation around it, and that punctuation, so "appa," is still அப்பா. */
const splitPunctuation = (word: string): [before: string, core: string, after: string] => {
  const m = /^([^A-Za-z]*)(.*?)([^A-Za-z]*)$/.exec(word)!;
  return [m[1]!, m[2]!, m[3]!];
};

/** A known word with an ending typed after it: appavukku → அப்பா + வுக்கு. */
function knownStem(word: string): string | undefined {
  for (let end = word.length - 1; end >= 3; end--) {
    const stem = known[word.slice(0, end)];
    // Only an ending that starts with a consonant joins on cleanly.
    if (!stem || isVowelAt(word, end)) continue;
    // Spelt as in the middle of a word (a leading space stands in for the stem), then the space dropped.
    const rest = parse(` ${word.slice(end)}`).slice(1);
    return stem + render(rest, rest.map(() => 0));
  }
  return undefined;
}

/** True for a word typed with a capital first letter: a name or place to keep in English (Joseph, Coimbatore). */
export const keepsEnglish = (word: string) => /^[A-Z]/.test(word);

/**
 * Tamil spellings for one word typed in English letters, most likely first; empty when the word has
 * no English letters. Real words come first (commonest first), then what the rules make of it, then
 * the rules' other spellings of one uncertain letter at a time.
 */
export function tamilSpellings(word: string, lexicon?: Lexicon, limit = 4): string[] {
  const [before, core, after] = splitPunctuation(word);
  if (!/[a-zA-Z]/.test(core)) return [];
  const units = parse(core);
  const primary = units.map(() => 0);
  const lower = core.toLowerCase();
  const knownWord = known[lower];
  const parts = syllables(units);
  const real = lexicon ? search(parts, lexicon) : [];
  // Only when no real word matches: a known word with an ending, or a spelling real words begin with.
  const withEnding = real.length === 0 ? knownStem(lower) : undefined;
  const stems = lexicon && real.length === 0 && units.length > 3 ? search(parts, lexicon, 'stem').slice(0, 1) : [];
  const spellings = [...(knownWord ? [knownWord] : []), ...real.slice(0, 3), ...(withEnding ? [withEnding] : []), ...stems, render(units, primary)];
  units.forEach((unit, i) => {
    const count = unit.kind === 'text' ? 1 : unit.shown;
    for (let option = 1; option < count; option++) spellings.push(render(units, primary.map((o, j) => (j === i ? option : o))));
  });
  return [...new Set(spellings)].slice(0, limit).map((s) => before + s + after);
}

/** The most likely Tamil spelling of a word typed in English letters. */
export const toTamil = (word: string, lexicon?: Lexicon) => tamilSpellings(word, lexicon, 1)[0] ?? word;

/** Longer real words that begin with what has been typed so far ("aaseer" → ஆசீர்வாதம்), commonest first. */
export function completions(typed: string, lexicon: Lexicon, limit = 2): string[] {
  if (typed.length < 3 || !/^[a-zA-Z]+$/.test(typed)) return [];
  const starts = search(syllables(parse(typed)), lexicon, 'partial');
  if (starts.length === 0) return [];
  const out: string[] = [];
  for (const word of lexicon.byCount) {
    if (starts.some((s) => word.length > s.length + 1 && word.startsWith(s))) out.push(word);
    if (out.length >= limit) break;
  }
  return out;
}
