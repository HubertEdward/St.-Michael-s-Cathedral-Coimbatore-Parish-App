import {
  byLetter,
  englishLetterOf,
  filterSongs,
  occasionCounts,
  songBooks,
  songOccasions,
  tamilLetterOf,
  tamilLetters,
  type Song,
  type SongBook,
  type SongFilter,
  type SongOccasion,
} from '@parish/core';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Dialog, Portal, Searchbar, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { SongRow } from '@/components/songs/SongRow';
import { useSongPrefs } from '@/songbook/prefs';
import { useSongs } from '@/songbook/songbook';

type Shown = 'all' | 'favourites' | 'recent';
type Letter = NonNullable<SongFilter['letter']>;

/**
 * The songbook, all on the phone: search in Tamil or English letters or by number, and narrow it with any
 * mix of filters — favourites, recently opened, book, occasions, first letter, first line only — in book order,
 * Tamil alphabetical order, or best match first.
 */
export default function Songbook() {
  const { t } = useTranslation();
  const theme = useTheme();
  const songs = useSongs();
  const { favourites, recent } = useSongPrefs();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<Shown>('all');
  const [book, setBook] = useState<SongBook>();
  const [occasions, setOccasions] = useState<SongOccasion[]>([]);
  const [letter, setLetter] = useState<Letter>();
  const [firstLineOnly, setFirstLineOnly] = useState(false);
  const [sort, setSort] = useState<SongFilter['sort'] | 'best'>('best');
  const [picking, setPicking] = useState<'occasions' | 'letter'>();

  const all = songs.data;
  const searching = query.trim() !== '';
  // Without a search, "best match" means book order, or most recent first for the Recent list.
  const order = sort === 'best' ? (searching || view !== 'all' ? undefined : 'number') : sort;
  const shown = useMemo(
    () =>
      all
        ? filterSongs(all, {
            query,
            firstLineOnly,
            occasions,
            letter,
            book,
            only: view === 'favourites' ? favourites : view === 'recent' ? recent : undefined,
            sort: order,
          })
        : [],
    [all, query, firstLineOnly, occasions, letter, book, view, favourites, recent, order],
  );
  const favouriteSet = useMemo(() => new Set(favourites), [favourites]);
  const filtered = view !== 'all' || !!book || occasions.length > 0 || !!letter || firstLineOnly || sort !== 'best';

  if (!all) return <ActivityIndicator style={styles.loading} accessibilityLabel={t('common.loading')} />;

  const clearAll = () => {
    setView('all');
    setBook(undefined);
    setOccasions([]);
    setLetter(undefined);
    setFirstLineOnly(false);
    setSort('best');
  };

  const header = (
    <View style={styles.header}>
      <Searchbar placeholder={t('songs.search')} value={query} onChangeText={setQuery} />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('songs.searchHint')}
      </Text>
      <View style={styles.chips}>
        <Choice selected={view === 'all'} onPress={() => setView('all')} label={t('songs.all')} />
        <Choice selected={view === 'favourites'} onPress={() => setView('favourites')} icon="star" label={`${t('songs.favourites')} ${favourites.length}`} />
        <Choice selected={view === 'recent'} onPress={() => setView('recent')} icon="history" label={`${t('songs.recent')} ${recent.length}`} />
      </View>
      <View style={styles.chips}>
        <Choice selected={!book} onPress={() => setBook(undefined)} icon="book-multiple-outline" label={t('songs.allBooks')} />
        {songBooks.map((b) => (
          <Choice key={b} selected={book === b} onPress={() => setBook(b)} icon="book-open-variant" label={t(`songs.book.${b}`)} />
        ))}
      </View>
      <View style={styles.chips}>
        <Choice
          selected={occasions.length > 0}
          onPress={() => setPicking('occasions')}
          icon="tag-multiple-outline"
          label={occasions.length === 1 ? t(`songs.occasion.${occasions[0]}`) : occasions.length > 1 ? `${t('songs.occasions')} ${occasions.length}` : t('songs.occasions')}
        />
        <Choice selected={!!letter} onPress={() => setPicking('letter')} icon="alphabetical-variant" label={letter ? `${t('songs.letter')}: ${letter.letter}` : t('songs.letter')} />
        <Choice selected={firstLineOnly} onPress={() => setFirstLineOnly(!firstLineOnly)} icon="format-text" label={t('songs.firstLineOnly')} />
      </View>
      <View style={styles.chips}>
        {(searching || view === 'recent') && <Choice selected={sort === 'best'} onPress={() => setSort('best')} icon="sort" label={t('songs.sortBest')} />}
        <Choice selected={order === 'number'} onPress={() => setSort('number')} icon="sort-numeric-ascending" label={t('songs.sortNumber')} />
        <Choice selected={order === 'alphabet'} onPress={() => setSort('alphabet')} icon="sort-alphabetical-ascending" label={t('songs.sortAlphabet')} />
      </View>
      <View style={styles.summary}>
        <Text variant="labelLarge" style={styles.flex}>
          {t('songs.count', { count: shown.length })}
        </Text>
        {filtered && (
          <Button compact icon="filter-remove-outline" onPress={clearAll}>
            {t('songs.clear')}
          </Button>
        )}
      </View>
    </View>
  );

  const empty =
    view === 'favourites' && favourites.length === 0 ? t('songs.noFavourites') : view === 'recent' && recent.length === 0 ? t('songs.noRecent') : t('songs.noMatch');

  return (
    <>
      <FlatList
        data={shown}
        keyExtractor={(song) => song.id}
        renderItem={({ item }) => <SongRow song={item} favourite={favouriteSet.has(item.id)} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text variant="bodyLarge">{empty}</Text>}
        ListFooterComponent={
          <Text variant="bodySmall" style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}>
            {t('songs.credit')}
          </Text>
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.content}
      />
      <OccasionPicker visible={picking === 'occasions'} songs={all} chosen={occasions} onChange={setOccasions} onClose={() => setPicking(undefined)} />
      <LetterPicker visible={picking === 'letter'} songs={all} chosen={letter} onChange={setLetter} onClose={() => setPicking(undefined)} />
    </>
  );
}

function Choice({ selected, onPress, label, icon }: { selected: boolean; onPress: () => void; label: string; icon?: string }) {
  const theme = useTheme();
  return (
    <Chip
      mode={selected ? 'flat' : 'outlined'}
      selected={selected}
      icon={icon}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: theme.colors.primaryContainer }]}
      textStyle={styles.chipText}>
      {label}
    </Chip>
  );
}

/** Any number of occasions; a song for any of them is shown. */
function OccasionPicker({
  visible,
  songs,
  chosen,
  onChange,
  onClose,
}: {
  visible: boolean;
  songs: Song[];
  chosen: SongOccasion[];
  onChange: (change: (current: SongOccasion[]) => SongOccasion[]) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const counts = useMemo(() => occasionCounts(songs), [songs]);
  // Each tap works from the latest choice, however quickly they come.
  const toggle = (o: SongOccasion) => onChange((current) => (current.includes(o) ? current.filter((x) => x !== o) : [...current, o]));
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>{t('songs.occasions')}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.pickerBody}>
            {songOccasions
              .filter((o) => counts.has(o))
              .map((o) => (
                <Choice key={o} selected={chosen.includes(o)} onPress={() => toggle(o)} label={`${t(`songs.occasion.${o}`)} ${counts.get(o)}`} />
              ))}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => onChange(() => [])}>{t('songs.clearThese')}</Button>
          <Button mode="contained" onPress={onClose}>
            {t('songs.done')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

/** One first letter, Tamil or English; picking it closes the list. */
function LetterPicker({ visible, songs, chosen, onChange, onClose }: { visible: boolean; songs: Song[]; chosen: Letter | undefined; onChange: (l: Letter | undefined) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const tamil = useMemo(() => byLetter(songs, tamilLetterOf, tamilLetters), [songs]);
  const english = useMemo(() => byLetter(songs, englishLetterOf), [songs]);
  const pick = (letter: Letter) => {
    onChange(chosen?.script === letter.script && chosen.letter === letter.letter ? undefined : letter);
    onClose();
  };
  const group = (title: string, script: Letter['script'], letters: { letter: string; songs: Song[] }[]) => (
    <>
      <Text variant="titleSmall">{title}</Text>
      <View style={styles.letters}>
        {letters.map(({ letter }) => (
          <Choice key={letter} selected={chosen?.script === script && chosen.letter === letter} onPress={() => pick({ script, letter })} label={letter} />
        ))}
      </View>
    </>
  );
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>{t('songs.letter')}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.letterBody}>
            {group(t('songs.tamilLetters'), 'tamil', tamil)}
            {group(t('songs.englishLetters'), 'english', english)}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button
            onPress={() => {
              onChange(undefined);
              onClose();
            }}>
            {t('songs.clearThese')}
          </Button>
          <Button mode="contained" onPress={onClose}>
            {t('songs.done')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 48 },
  content: { padding: 16, paddingBottom: 48, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: { gap: 10, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { maxWidth: '100%' },
  chipText: { flexShrink: 1 },
  summary: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  flex: { flexShrink: 1 },
  footer: { marginTop: 16 },
  dialog: { maxHeight: '85%' },
  pickerBody: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12 },
  letterBody: { gap: 8, paddingVertical: 12 },
  letters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
