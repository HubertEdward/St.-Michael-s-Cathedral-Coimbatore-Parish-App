// Tamil typed in English letters, with the word list built in: see tanglish.ts for how spellings are chosen.
import { completions, countWords, keepsEnglish, learn, makeLexicon, tamilSpellings as spellings, type Lexicon } from './tanglish.ts';
import { TAMIL_WORD_COUNTS } from './tamilWordCounts.ts';

export { keepsEnglish };

// Everyday words people write in intentions and group messages that the prayers rarely use, counted
// above the prayers' look-alikes (இறந்து "died" over இரந்து "begged"). The Holy Rosary app has the same list.
const EVERYDAY = `
இறந்து இறந்தார் இறந்துபோன இறந்துபோனவர்கள் போனவர்கள் போன போனார் சகோதரி சகோதரிகள் சகோதரன் சகோதரர் சகோதரர்கள்
ஜெபிக்கிறேன் ஜெபிக்கிறோம் செபிக்கிறேன் செபிக்கிறோம் வேண்டுகிறேன் வேண்டுகிறோம் மன்றாடுகிறேன் மன்றாடுகிறோம்
நன்றி நன்றிகள் படித்து படிச்சு படிக்க கூட்டம் கூட்டத்துக்கு கூட்டத்தில் அன்பியம் அன்பியக் அன்பியத்தில் பங்கு
மக்கள் வாருங்கள் வரவும் அனைவரும் கலந்துகொள்ள கலந்துகொள்ளவும் ஞாயிறு திங்கள் செவ்வாய் புதன் வியாழன் வெள்ளி சனி
`;

let lexicon: Lexicon | undefined;

/** The word list, read the first time someone types. */
function words(): Lexicon {
  if (!lexicon) {
    const count = new Map<string, number>();
    for (const line of TAMIL_WORD_COUNTS.split('\n')) {
      const [n, list] = line.split('|');
      for (const word of list?.split(' ') ?? []) if (word) count.set(word, Number(n));
    }
    lexicon = makeLexicon(countWords([EVERYDAY], count, 8));
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
