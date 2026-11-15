import assert from 'node:assert/strict';
import { test } from 'node:test';

import { keepsEnglish, tamilSpellings, toTamil } from './tamil.ts';

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
    anbiyam: 'அன்பியம்',
    thanthai: 'தந்தை',
    vandhaan: 'வந்தான்',
    rendu: 'ரெண்டு',
    kutram: 'குற்றம்',
    singam: 'சிங்கம்',
    deivam: 'தெய்வம்',
    periya: 'பெரிய',
    kaalai: 'காலை',
    maadha: 'மாதா',
    manjal: 'மஞ்சல்',
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
});

test('offers the other spellings of uncertain letters', () => {
  assert.ok(tamilSpellings('manjal').includes('மஞ்சள்'));
  assert.ok(tamilSpellings('kannu').includes('கண்ணு'));
  assert.ok(tamilSpellings('vendum').includes('வேண்டும்'));
  assert.ok(tamilSpellings('nalvaazhvu').length > 1);
  assert.ok(tamilSpellings('kanni', 10).length <= 10);
});

test('leaves non-letters alone, and keeps capitalised words in English', () => {
  assert.deepEqual(tamilSpellings('123'), []);
  assert.equal(toTamil('appa,'), 'அப்ப,');
  assert.ok(keepsEnglish('Joseph'));
  assert.ok(keepsEnglish('Coimbatore'));
  assert.ok(!keepsEnglish('jebam'));
});
