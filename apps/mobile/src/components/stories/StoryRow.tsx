import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { Tap } from '@/components/design/Tap';
import { gold } from '@/components/design/tokens';

import { useSeen, useStories } from './useStories';

const SIZE = 70;

/** Round story bubbles; a golden ring marks the ones not yet opened. */
export function StoryRow() {
  const theme = useTheme();
  const stories = useStories();
  const isSeen = useSeen();
  if (stories.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.row}>
      {stories.map((story, index) => {
        const seen = isSeen(story.id);
        return (
          <Animated.View key={story.id} entering={FadeInRight.delay(index * 70).springify()}>
            <Tap
              onPress={() => router.push({ pathname: '/story', params: { start: String(index) } })}
              style={styles.item}
              accessibilityLabel={story.title}>
              <LinearGradient
                colors={seen ? [theme.colors.outlineVariant, theme.colors.outlineVariant] : [gold, '#C2410C', '#9E2436']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ring}>
                <View style={[styles.gap, { backgroundColor: theme.colors.background }]}>
                  <Image source={story.image} contentFit="cover" style={styles.image} />
                </View>
              </LinearGradient>
              <Text variant="labelMedium" numberOfLines={1} style={[styles.label, { color: theme.colors.onSurface }]}>
                {story.title}
              </Text>
            </Tap>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -16 },
  row: { paddingHorizontal: 16, gap: 14 },
  item: { width: SIZE + 8, alignItems: 'center', gap: 6 },
  ring: { width: SIZE + 8, height: SIZE + 8, borderRadius: (SIZE + 8) / 2, padding: 3 },
  gap: { flex: 1, borderRadius: SIZE, padding: 2 },
  image: { flex: 1, borderRadius: SIZE },
  label: { textAlign: 'center', width: SIZE + 8 },
});
