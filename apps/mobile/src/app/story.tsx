import { parish } from '@parish/core';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Display } from '@/components/design/Display';
import { Eyebrow } from '@/components/design/Eyebrow';
import { GradientButton } from '@/components/design/GradientButton';
import { tapFeedback } from '@/components/design/Tap';
import { gold } from '@/components/design/tokens';
import { markSeen, useStories } from '@/components/stories/useStories';
import { useLocalized } from '@/i18n';

const DURATION = 7000;

/** Full-screen parish stories: each plays for a few seconds; tap the right side for the next, the left for the previous. */
export default function StoryViewer() {
  const { start } = useLocalSearchParams<{ start?: string }>();
  const { t } = useTranslation();
  const text = useLocalized();
  const insets = useSafeAreaInsets();
  const stories = useStories();
  const [index, setIndex] = useState(Number(start ?? 0) || 0);
  const story = stories[index];

  const next = () => {
    void tapFeedback();
    if (index + 1 < stories.length) setIndex(index + 1);
    else router.back();
  };
  const previous = () => {
    void tapFeedback();
    setIndex(Math.max(0, index - 1));
  };

  const storyId = story?.id;
  useEffect(() => {
    if (!storyId) return;
    markSeen(storyId);
    const timer = setTimeout(() => (index + 1 < stories.length ? setIndex(index + 1) : router.back()), DURATION);
    return () => clearTimeout(timer);
  }, [storyId, index, stories.length]);

  if (!story) return <View style={styles.page} />;

  return (
    <View style={styles.page}>
      <Zoom key={`picture-${story.id}`} source={story.image} />
      <LinearGradient colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.05)', 'rgba(10,3,5,0.92)']} locations={[0, 0.3, 0.75]} style={StyleSheet.absoluteFill} />

      <View style={StyleSheet.absoluteFill}>
        <View style={styles.tapZones}>
          <Pressable style={styles.left} onPress={previous} accessibilityLabel={t('stories.previous')} />
          <Pressable style={styles.right} onPress={next} accessibilityLabel={t('stories.next')} />
        </View>
      </View>

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <View style={styles.bars}>
          {stories.map((s, i) => (
            <Segment key={s.id} state={i < index ? 'done' : i === index ? 'active' : 'todo'} />
          ))}
        </View>
        <View style={styles.header}>
          <Image source={parish.images.patron.source} contentFit="cover" contentPosition="top" style={styles.avatar} />
          <Text variant="titleSmall" style={styles.white} numberOfLines={1}>
            {text(parish.name)}
          </Text>
          <View style={styles.flex} />
          <IconButton icon="close" iconColor="#FFFFFF" onPress={() => router.back()} accessibilityLabel={t('stories.close')} />
        </View>
      </View>

      <Animated.View key={`text-${story.id}`} entering={FadeInDown.springify().damping(16)} style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Eyebrow color={gold}>{story.label}</Eyebrow>
        <Display size={38} color="#FFFFFF">
          {story.title}
        </Display>
        <Text variant="bodyLarge" style={styles.body} numberOfLines={7}>
          {story.body}
        </Text>
        <GradientButton label={t('stories.open')} icon="arrow-right" onPress={() => router.replace(story.href)} />
      </Animated.View>
    </View>
  );
}

function Zoom({ source }: { source: number }) {
  const scale = useSharedValue(1.04);
  useEffect(() => {
    scale.set(withTiming(1.2, { duration: DURATION + 600, easing: Easing.linear }));
  }, [scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <Animated.View entering={FadeIn.duration(500)} style={[StyleSheet.absoluteFill, style]}>
      <Image source={source} contentFit="cover" style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

function Segment({ state }: { state: 'done' | 'active' | 'todo' }) {
  const fill = useSharedValue(state === 'done' ? 1 : 0);
  useEffect(() => {
    if (state === 'active') {
      fill.set(0);
      fill.set(withTiming(1, { duration: DURATION, easing: Easing.linear }));
    } else {
      fill.set(state === 'done' ? 1 : 0);
    }
  }, [state, fill]);
  const style = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));
  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.segmentFill, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0A0305' },
  tapZones: { flex: 1, flexDirection: 'row' },
  left: { flex: 35 },
  right: { flex: 65 },
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 12, gap: 8 },
  bars: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  segmentFill: { height: 3, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: gold },
  white: { color: '#FFFFFF' },
  flex: { flex: 1 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, gap: 10, maxWidth: 720, alignSelf: 'center', width: '100%' },
  body: { color: 'rgba(255,255,255,0.88)', lineHeight: 28 },
});
