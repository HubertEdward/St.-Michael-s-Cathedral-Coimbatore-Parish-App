import type { Song } from '@parish/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Tap } from '@/components/design/Tap';

/** A song in a list: its number, first line, occasions, and its book unless it is இறை அலைகள்; a tap opens it. */
export function SongRow({ song, favourite }: { song: Song; favourite: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Tap
      onPress={() => router.push({ pathname: '/songs/[id]', params: { id: song.id } })}
      style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
      accessibilityLabel={`${song.number}. ${song.title}`}>
      <Text variant="labelLarge" style={[styles.number, { color: theme.colors.primary }]}>
        {song.number}
      </Text>
      <View style={styles.text}>
        <Text variant="titleMedium">{song.title}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {[...(song.book === 'iraialaihal' ? [] : [t(`songs.book.${song.book}`)]), ...song.occasions.map((o) => t(`songs.occasion.${o}`))].join(' · ')}
        </Text>
      </View>
      {favourite && <Icon source="star" size={18} color={theme.colors.primary} />}
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  number: { minWidth: 36 },
  text: { flex: 1, gap: 2 },
});
