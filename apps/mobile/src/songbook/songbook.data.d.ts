// The songbook packed by npm run songs:bundle into songbook.data.js (gitignored; see scripts/songs/bundle-songs.ts).
declare const packed: {
  fetchedOn: string;
  count: number;
  /** Base64 of the gzipped JSON: [number, title, occasion positions in songOccasions, stanzas][] */
  gzip: string;
};
export default packed;
