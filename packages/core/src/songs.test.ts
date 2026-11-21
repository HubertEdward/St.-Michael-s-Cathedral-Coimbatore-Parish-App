import assert from 'node:assert/strict';
import { test } from 'node:test';

import { byLetter, compareTamil, englishLetterOf, filterSongs, fold, romanize, searchSongs, tamilLetterOf, tamilLetters } from './songs.ts';
import type { Song } from './types.ts';

const song = (number: number, title: string, lines: string[] = []): Song => ({ number, title, occasions: ['entrance'], stanzas: [[title, ...lines]] });
const songs = [
  song(1, 'அன்பு நாளில் கூடுவோம்', ['இயேசுவின் வழியில் நடப்போம்']),
  song(2, 'கடவுளின் அன்பு', ['இயேசுவே என் தேவனே']),
  song(3, 'தேவனே உம்மைப் போற்றுவோம்'),
  song(12, 'காணிக்கை ஏந்தி வருவோம்'),
];

test('Tamil in English letters', () => {
  assert.equal(romanize('அன்பு'), 'anpu');
  assert.equal(romanize('தேவனே'), 'thevane');
  assert.equal(romanize('இயேசு'), 'iyesu');
  assert.equal(romanize('ஜீவன்'), 'jeevan');
  assert.equal(romanize('Lord'), 'Lord');
});

test('different spellings meet', () => {
  assert.equal(fold('anbu'), fold('அன்பு'));
  assert.equal(fold('thevane'), fold('தேவனே'));
  assert.equal(fold('Yesu'), 'yesu');
  assert.ok(fold('இயேசு').includes(fold('yesu')));
});

test('search by English letters, Tamil, words in the song, or number', () => {
  assert.deepEqual(searchSongs(songs, 'thevane').map((s) => s.number), [3, 2]);
  assert.deepEqual(searchSongs([songs[1], songs[2]], 'thevane umm').map((s) => s.number), [3], 'a first line that starts with the search comes first');
  assert.deepEqual(searchSongs(songs, 'கடவுள்').map((s) => s.number), [2]);
  assert.deepEqual(searchSongs(songs, 'கடவுளின்').map((s) => s.number), [2]);
  assert.deepEqual(searchSongs(songs, 'kadavul').map((s) => s.number), [2]);
  assert.deepEqual(searchSongs(songs, 'yesu').map((s) => s.number), [1, 2]);
  assert.deepEqual(searchSongs(songs, '12').map((s) => s.number), [12]);
  assert.deepEqual(searchSongs(songs, 'devane yesuve').map((s) => s.number), [2], 'every word, in any order');
  assert.equal(fold('deivam'), fold('தெய்வம்'));
  assert.equal(fold('jeevane'), fold('ஜீவனே'));
  assert.equal(fold('poo'), fold('பூ'));
  assert.deepEqual(searchSongs(songs, '  ').length, 4);
});

test('songs listed by first letter in Tamil and in English', () => {
  const tamil = byLetter(songs, tamilLetterOf, tamilLetters);
  assert.deepEqual(tamil.map((g) => g.letter), ['அ', 'க', 'த']);
  assert.deepEqual(byLetter(songs, englishLetterOf).map((g) => g.letter), ['A', 'K', 'T']);
});

test('Tamil alphabetical order, not Unicode order', () => {
  const titles = ['னகரம்', 'றகரம்', 'கா', 'க்ஷ', 'கடல்', 'அம்மா', 'ஆண்டவர்', 'கி'];
  assert.deepEqual([...titles].sort(compareTamil), ['அம்மா', 'ஆண்டவர்', 'க்ஷ', 'கடல்', 'கா', 'கி', 'றகரம்', 'னகரம்']);
});

test('filters combine: occasion, letter, first line only, favourites, sort', () => {
  const book: Song[] = [
    { number: 5, title: 'காணிக்கை ஏந்தி வருவோம்', occasions: ['offertory'], stanzas: [['காணிக்கை ஏந்தி வருவோம்', 'அன்பின் பலியாக']] },
    { number: 9, title: 'அன்பின் விருந்து', occasions: ['communion'], stanzas: [['அன்பின் விருந்து']] },
    { number: 2, title: 'அப்பம் இது', occasions: ['communion', 'adoration'], stanzas: [['அப்பம் இது', 'அன்பின் உணவு']] },
  ];
  assert.deepEqual(filterSongs(book, { occasions: ['communion'] }).map((s) => s.number), [9, 2]);
  assert.deepEqual(filterSongs(book, { occasions: ['communion'], sort: 'number' }).map((s) => s.number), [2, 9]);
  assert.deepEqual(filterSongs(book, { sort: 'alphabet' }).map((s) => s.number), [2, 9, 5]);
  assert.deepEqual(filterSongs(book, { letter: { script: 'tamil', letter: 'அ' } }).map((s) => s.number), [9, 2]);
  assert.deepEqual(filterSongs(book, { letter: { script: 'english', letter: 'K' } }).map((s) => s.number), [5]);
  assert.deepEqual(filterSongs(book, { query: 'anbin' }).map((s) => s.number), [9, 5, 2]);
  assert.deepEqual(filterSongs(book, { query: 'anbin', firstLineOnly: true }).map((s) => s.number), [9]);
  assert.deepEqual(filterSongs(book, { only: [5, 2] }).map((s) => s.number), [5, 2]);
  assert.deepEqual(filterSongs(book, { only: [5, 2], occasions: ['adoration'] }).map((s) => s.number), [2]);
});
