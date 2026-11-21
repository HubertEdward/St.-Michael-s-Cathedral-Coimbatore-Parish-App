import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, Chip, IconButton, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { Display } from '@/components/design/Display';
import { Panel } from '@/components/design/Panel';
import { songOpened, toggleFavourite, useSongPrefs } from '@/songbook/prefs';
import { useSongs } from '@/songbook/songbook';

/** Fr. Agilan's own app has each song's audio and music notation. */
const IRAIALAIHAL_APP = 'https://play.google.com/store/apps/details?id=com.iraialaigal.strackit';

const SIZE_KEY = 'songs.textSize';
const sizes = [18, 21, 24, 28, 32] as const;

/** The text size chosen for songs, remembered on the phone; elders often want it large in church. */
function useTextSize() {
  const [step, setStep] = useState(1);
  useEffect(() => {
    AsyncStorage.getItem(SIZE_KEY)
      .then((saved) => saved !== null && setStep(Math.min(sizes.length - 1, Math.max(0, Number(saved)))))
      .catch(() => undefined);
  }, []);
  const change = (by: number) => {
    const next = Math.min(sizes.length - 1, Math.max(0, step + by));
    setStep(next);
    void AsyncStorage.setItem(SIZE_KEY, String(next)).catch(() => undefined);
  };
  return { size: sizes[step], smaller: step > 0 ? () => change(-1) : undefined, larger: step < sizes.length - 1 ? () => change(1) : undefined };
}

/** One song: its words, verse by verse, in a size that can be read in church. */
export default function SongScreen() {
  const { number } = useLocalSearchParams<{ number: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const songs = useSongs();
  const { size, smaller, larger } = useTextSize();
  const { favourites } = useSongPrefs();
  const favourite = favourites.includes(Number(number));
  // Opened songs make up the Recent list.
  useEffect(() => {
    if (number) void songOpened(Number(number));
  }, [number]);

  return (
    <Screen>
      <Stack.Screen options={{ title: t('songs.number', { number }) }} />
      <QueryState query={songs}>
        {(all) => {
          const song = all.find((s) => String(s.number) === number);
          if (!song) return <Text variant="bodyLarge">{t('common.notFound')}</Text>;
          return (
            <>
              <Display size={30}>{song.title}</Display>
              <View style={styles.tags}>
                {song.occasions.map((o) => (
                  <Chip key={o} compact>
                    {t(`songs.occasion.${o}`)}
                  </Chip>
                ))}
                <View style={styles.flex} />
                <IconButton
                  icon={favourite ? 'star' : 'star-outline'}
                  iconColor={theme.colors.primary}
                  accessibilityLabel={favourite ? t('songs.removeFavourite') : t('songs.addFavourite')}
                  onPress={() => void toggleFavourite(song.number)}
                />
                <IconButton icon="format-font-size-decrease" accessibilityLabel={t('songs.smaller')} disabled={!smaller} onPress={smaller} />
                <IconButton icon="format-font-size-increase" accessibilityLabel={t('songs.larger')} disabled={!larger} onPress={larger} />
              </View>
              <Panel style={styles.words}>
                {song.stanzas.map((lines, i) => (
                  <Text key={i} selectable style={{ fontSize: size, lineHeight: Math.round(size * 1.6), color: theme.colors.onSurface }}>
                    {lines.join('\n')}
                  </Text>
                ))}
              </Panel>
              <Button mode="outlined" icon="music-note" contentStyle={styles.listen} labelStyle={styles.wrap} onPress={() => void Linking.openURL(IRAIALAIHAL_APP)}>
                {t('songs.listen')}
              </Button>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('songs.credit')}
              </Text>
            </>
          );
        }}
      </QueryState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  flex: { flex: 1 },
  words: { gap: 22 },
  listen: { paddingVertical: 4 },
  wrap: { flexShrink: 1 },
});
