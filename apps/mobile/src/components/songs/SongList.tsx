import type { Song } from '@parish/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Divider, Icon, Text, useTheme } from 'react-native-paper';

import { Panel } from '@/components/design/Panel';
import { Tap } from '@/components/design/Tap';

/** Songs as rows of number and first line; a tap opens the song. */
export function SongList({ songs }: { songs: Song[] }) {
  const theme = useTheme();
  if (songs.length === 0) return null;
  return (
    <Panel style={styles.list}>
      {songs.map((song, index) => (
        <View key={song.number}>
          {index > 0 && <Divider />}
          <Tap
            onPress={() => router.push({ pathname: '/songs/[number]', params: { number: String(song.number) } })}
            style={styles.row}
            accessibilityLabel={`${song.number}. ${song.title}`}>
            <Text variant="labelLarge" style={[styles.number, { color: theme.colors.primary }]}>
              {song.number}
            </Text>
            <Text variant="titleMedium" style={styles.title}>
              {song.title}
            </Text>
            <Icon source="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
          </Tap>
        </View>
      ))}
    </Panel>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 4, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  number: { minWidth: 40 },
  title: { flex: 1 },
});
