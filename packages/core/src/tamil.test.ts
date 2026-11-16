import assert from 'node:assert/strict';
import { test } from 'node:test';

import { keepsEnglish, learnTamil, tamilCompletions, tamilSpellings, toTamil } from './tamil.ts';
import { countWords, makeLexicon, toTamil as toTamilWith } from './tanglish.ts';

test('spells common words as people type them', () => {
  const words: Record<string, string> = {
    naan: 'நான்',
    neengal: 'நீங்கள்',
    ungal: 'உங்கள்',
    engal: 'எங்கள்',
    nandri: 'நன்றி',
    thiruppali: 'திருப்பலி',
    jebam: 'ஜெபம்',
    sebam: 'செபம்',
    thanthai: 'தந்தை',
    vandhaan: 'வந்தான்',
    kutram: 'குற்றம்',
    deivam: 'தெய்வம்',
    periya: 'பெரிய',
    kaalai: 'காலை',
    maadha: 'மாதா',
    padippu: 'படிப்பு',
    thamizh: 'தமிழ்',
    kudumba: 'குடும்ப',
    paatti: 'பாட்டி',
  };
  for (const [latin, tamil] of Object.entries(words)) assert.equal(toTamil(latin), tamil, latin);
});

test('knows words the rules cannot spell from sound', () => {
  assert.equal(toTamil('vanakkam'), 'வணக்கம்');
  assert.equal(toTamil('yesu'), 'இயேசு');
  assert.equal(toTamil('amma'), 'அம்மா');
  assert.equal(toTamil('Iraivan'), 'இறைவன்');
  // A known word with an ending after it.
  assert.equal(toTamil('appavukku'), 'அப்பாவுக்கு');
  // Punctuation around a word does not hide it (this used to give அப்ப,).
  assert.equal(toTamil('appa,'), 'அப்பா,');
});

test('real words beat the rules when English letters are ambiguous', () => {
  // The rules alone write மஞ்சல்; the word list knows மஞ்சள்.
  assert.equal(toTamilWith('manjal'), 'மஞ்சல்');
  assert.equal(toTamil('manjal'), 'மஞ்சள்');
  assert.equal(toTamil('kalyaanam'), 'கல்யாணம்');
  assert.equal(toTamil('vaazhkai'), 'வாழ்க்கை');
  assert.equal(toTamil('parisutha'), 'பரிசுத்த');
  assert.equal(toTamil('samadhanam'), 'சமாதானம்');
  assert.equal(toTamil('kuzhandhaikkaga'), 'குழந்தைக்காக');
  // A commoner word that needs a guess (a letter typed once for two) does not beat the word typed.
  assert.equal(toTamil('pera'), 'பெற');
  assert.equal(toTamil('petra'), 'பெற்ற');
  // Everyday intention words win over look-alikes from the prayers: "died", not "begged".
  assert.equal(toTamil('irandhu'), 'இறந்து');
  assert.equal(toTamil('jebikkiren'), 'ஜெபிக்கிறேன்');
  assert.equal(toTamil('sagodhari'), 'சகோதரி');
  assert.equal(toTamil('ponavargal'), 'போனவர்கள்');
});

test('offers the other spellings of uncertain letters, and completes long words', () => {
  assert.ok(tamilSpellings('manjal').includes('மஞ்சல்'));
  assert.ok(tamilSpellings('kannu').includes('கண்ணு'));
  assert.ok(tamilSpellings('vendum').includes('வேண்டும்'));
  assert.ok(tamilSpellings('nalvaazhvu').length > 1);
  assert.ok(tamilSpellings('kanni', 10).length <= 10);
  assert.ok(tamilCompletions('aaseer').some((w) => w.startsWith('ஆசீர்வ')));
});

test('learns the words people write', () => {
  const lexicon = makeLexicon(countWords(['வலி']));
  assert.equal(toTamilWith('vali', lexicon), 'வலி');
  learnTamil('அன்பியம் அன்பியம்');
  assert.equal(toTamil('anbiyam'), 'அன்பியம்');
});

test('leaves non-letters alone, and keeps capitalised words in English', () => {
  assert.deepEqual(tamilSpellings('123'), []);
  assert.ok(keepsEnglish('Joseph'));
  assert.ok(keepsEnglish('Coimbatore'));
  assert.ok(!keepsEnglish('jebam'));
});
