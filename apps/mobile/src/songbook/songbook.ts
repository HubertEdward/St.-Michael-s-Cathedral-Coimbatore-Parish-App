// The songbooks travel inside the app, compressed (about a sixth of their size as text), and are unpacked once,
// the first time the songbook is opened. Nothing is downloaded, so it works anywhere, signal or not.
import { songBooks, songOccasions, type Song } from '@parish/core';
import { useQuery } from '@tanstack/react-query';
import { gunzipSync, strFromU8 } from 'fflate';

import packed from './songbook.data.js';

function base64Bytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let unpacked: Song[] | undefined;

/** Every song, unpacked on first use and then kept in memory. */
export function songbook(): Song[] {
  if (!unpacked) {
    const rows = JSON.parse(strFromU8(gunzipSync(base64Bytes(packed.gzip)))) as [number, number, string, number[], string[][]][];
    unpacked = rows.map(([book, number, title, occasions, stanzas]) => ({
      id: `${songBooks[book]}-${number}`,
      book: songBooks[book],
      number,
      title,
      occasions: occasions.map((i) => songOccasions[i]),
      stanzas,
    }));
  }
  return unpacked;
}

export const useSongs = () =>
  useQuery({
    queryKey: ['songbook'],
    // A moment's pause first, so the screen shows it is loading before the unpacking takes the thread.
    queryFn: () => new Promise<Song[]>((resolve) => setTimeout(() => resolve(songbook()), 0)),
    staleTime: Infinity,
    gcTime: Infinity,
  });
