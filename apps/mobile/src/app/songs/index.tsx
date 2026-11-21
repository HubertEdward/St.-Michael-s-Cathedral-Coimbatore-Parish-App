import { byLetter, englishLetterOf, occasionCounts, searchSongs, songOccasions, tamilLetterOf, tamilLetters, useSongs } from '@parish/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Divider, Icon, Searchbar, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';
import { Panel } from '@/components/design/Panel';
import { Tap } from '@/components/design/Tap';
import { SongList } from '@/components/songs/SongList';

/** Search shows this many songs at most; a few more words narrow it. */
const SHOWN = 100;

type Index = 'occasion' | 'tamil' | 'english';

/** The songbook: search in Tamil or English letters, or browse by occasion or by first letter. */
export default function Songbook() {
  const { t } = useTranslation();
  const theme = useTheme();
  const songs = useSongs();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<Index>('occasion');

  if (songs.isPending) return <Screen><ActivityIndicator style={styles.loading} accessibilityLabel={t('common.loading')} /></Screen>;
  if (songs.isError) {
    return (
      <Screen>
        <Text variant="bodyLarge">{t('songs.offline')}</Text>
        <Button mode="outlined" icon="refresh" onPress={() => songs.refetch()}>
          {t('common.retry')}
        </Button>
      </Screen>
    );
  }

  const all = songs.data;
  const found = query.trim() ? searchSongs(all, query) : undefined;
  const counts = occasionCounts(all);
  const letters = index === 'tamil' ? byLetter(all, tamilLetterOf, tamilLetters) : byLetter(all, englishLetterOf);

  return (
    <Screen onRefresh={() => songs.refetch()} refreshing={songs.isRefetching}>
      <Searchbar placeholder={t('songs.search')} value={query} onChangeText={setQuery} />
      {found ? (
        <>
          {found.length === 0 && <Text variant="bodyLarge">{t('songs.noMatch')}</Text>}
          {found.length > SHOWN && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('songs.tooMany', { shown: SHOWN, count: found.length })}
            </Text>
          )}
          <SongList songs={found.slice(0, SHOWN)} />
        </>
      ) : (
        <>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('songs.searchHint')}
          </Text>
          <SegmentedButtons
            value={index}
            onValueChange={(value) => setIndex(value as Index)}
            buttons={[
              { value: 'occasion', label: t('songs.byOccasion') },
              { value: 'tamil', label: t('songs.tamilIndex') },
              { value: 'english', label: t('songs.englishIndex') },
            ]}
          />
          {index === 'occasion' ? (
            <Panel style={styles.list}>
              {songOccasions
                .filter((o) => counts.has(o))
                .map((occasion, i) => (
                  <View key={occasion}>
                    {i > 0 && <Divider />}
                    <Tap
                      onPress={() => router.push({ pathname: '/songs/browse', params: { occasion } })}
                      style={styles.row}
                      accessibilityLabel={t(`songs.occasion.${occasion}`)}>
                      <View style={styles.flex}>
                        <Text variant="titleMedium">{t(`songs.occasion.${occasion}`)}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {t('songs.count', { count: counts.get(occasion) })}
                        </Text>
                      </View>
                      <Icon source="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
                    </Tap>
                  </View>
                ))}
            </Panel>
          ) : (
            <View style={styles.letters}>
              {letters.map(({ letter, songs: under }) => (
                <Chip
                  key={letter}
                  mode="outlined"
                  textStyle={styles.letter}
                  accessibilityLabel={`${letter}, ${t('songs.count', { count: under.length })}`}
                  onPress={() => router.push({ pathname: '/songs/browse', params: { letter, script: index } })}>
                  {letter}
                </Chip>
              ))}
            </View>
          )}
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('songs.count', { count: all.length })} · {t('songs.credit')}
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 48 },
  list: { paddingVertical: 4, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  flex: { flex: 1 },
  letters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  letter: { fontSize: 20, lineHeight: 28 },
});
