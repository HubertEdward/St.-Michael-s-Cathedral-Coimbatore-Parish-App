import { englishLetterOf, tamilLetterOf, useSongs, type SongOccasion } from '@parish/core';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { SongList } from '@/components/songs/SongList';

/** The songs of one occasion, or under one first letter (Tamil or English). */
export default function BrowseSongs() {
  const { occasion, letter, script } = useLocalSearchParams<{ occasion?: SongOccasion; letter?: string; script?: 'tamil' | 'english' }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const songs = useSongs();
  const title = occasion ? t(`songs.occasion.${occasion}`) : (letter ?? '');
  const letterOf = script === 'english' ? englishLetterOf : tamilLetterOf;

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <QueryState query={songs}>
        {(all) => {
          const shown = all.filter((song) => (occasion ? song.occasions.includes(occasion) : letterOf(song) === letter));
          return (
            <>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('songs.count', { count: shown.length })}
              </Text>
              <SongList songs={shown} />
            </>
          );
        }}
      </QueryState>
    </Screen>
  );
}
