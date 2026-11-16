// Tamil typed in English letters, with the word list built in: see tanglish.ts for how spellings are chosen.
import { completions, keepsEnglish, learn, makeLexicon, tamilSpellings as spellings, type Lexicon } from './tanglish.ts';
import { TAMIL_WORD_COUNTS } from './tamilWordCounts.ts';

export { keepsEnglish };

let lexicon: Lexicon | undefined;

/** The word list, read the first time someone types. */
function words(): Lexicon {
  if (!lexicon) {
    const count = new Map<string, number>();
    for (const line of TAMIL_WORD_COUNTS.split('\n')) {
      const [n, list] = line.split('|');
      for (const word of list?.split(' ') ?? []) if (word) count.set(word, Number(n));
    }
    lexicon = makeLexicon(count);
  }
  return lexicon;
}

/**
 * Tamil spellings for one word typed in English letters, most likely first; empty when the word has
 * no English letters. Real words come first, then what the rules make of it, then the rules' other
 * spellings of one uncertain letter at a time.
 */
export const tamilSpellings = (word: string, limit = 4): string[] => spellings(word, words(), limit);

/** The most likely Tamil spelling of a word typed in English letters. */
export const toTamil = (word: string): string => tamilSpellings(word, 1)[0] ?? word;

/** Longer real words that begin with what has been typed so far ("aaseer" → ஆசீர்வாதம்). */
export const tamilCompletions = (typed: string, limit = 2): string[] => completions(typed, words(), limit);

/** Count the Tamil words in some text as words people use, such as what the person has just written. */
export const learnTamil = (text: string, weight = 3): void => learn(words(), text, weight);
