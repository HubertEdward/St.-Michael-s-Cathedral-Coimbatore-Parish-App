import type { ImageContentPosition } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Children, isValidElement, type ReactNode } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Display } from './Display';
import { Eyebrow } from './Eyebrow';
import { TAB_BAR_SPACE } from './FloatingTabBar';
import { KenBurns } from './KenBurns';
import { crimson, gold, photoScrim } from './tokens';

interface Props {
  /** Bundled pictures; several crossfade with a slow zoom. Without any, the header is the crimson gradient. */
  images?: number[];
  /** Which part of the pictures stays in view, as CSS object-position. */
  imagePosition?: ImageContentPosition;
  height?: number;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Shows a back button, for screens opened on top of the tabs. */
  back?: boolean;
  /** A row over the top of the picture, such as a greeting and a language switch. */
  topBar?: ReactNode;
  /** A card that sits half over the bottom of the picture, such as the next Mass. */
  floating?: ReactNode;
  children: ReactNode;
  onRefresh?: () => void;
}

const BAR = 52;
/** How far a floating card reaches up over the picture. */
const FLOAT_OVER = 72;

/**
 * A page that opens on a full-bleed picture. The picture drifts slower than the page as you
 * scroll, the title fades with it, and a slim crimson bar with the title takes over at the top.
 * The page's sections rise into place one after another.
 */
export function ParallaxScreen({
  images = [],
  imagePosition = 'center',
  height = 380,
  eyebrow,
  title,
  subtitle,
  back,
  topBar,
  floating,
  children,
  onRefresh,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => scrollY.set(event.contentOffset.y));
  const barAt = height - insets.top - BAR - 40;
  const sections = Children.toArray(children).filter(isValidElement);

  const pictureStyle = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      transform: [
        { translateY: interpolate(y, [-height, 0, height], [-height / 2, 0, height * 0.45]) },
        { scale: interpolate(y, [-height, 0], [2, 1], Extrapolation.CLAMP) },
      ],
    };
  });
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, height * 0.45], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.get(), [0, height * 0.45], [0, -24], Extrapolation.CLAMP) }],
  }));
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [barAt - 30, barAt], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={gold} progressViewOffset={insets.top} /> : undefined
        }>
        <View style={[styles.hero, { height }]}>
          <Animated.View style={[StyleSheet.absoluteFill, pictureStyle]}>
            {images.length > 0 ? (
              <KenBurns images={images} position={imagePosition} dotsBottom={floating ? FLOAT_OVER + 16 : 44} />
            ) : (
              <LinearGradient colors={crimson} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            )}
          </Animated.View>
          <LinearGradient pointerEvents="none" colors={photoScrim} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
          {topBar && (
            <Animated.View style={[styles.topBar, { top: insets.top + 8 }, titleStyle]}>{topBar}</Animated.View>
          )}
          <Animated.View pointerEvents="none" style={[styles.heroText, floating ? styles.heroTextOver : null, titleStyle]}>
            {eyebrow && <Eyebrow color={gold}>{eyebrow}</Eyebrow>}
            <Display size={40} color="#FFFFFF">
              {title}
            </Display>
            <View style={styles.rule} />
            {subtitle && (
              <Text variant="titleMedium" style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </Animated.View>
        </View>
        {floating && (
          <Animated.View entering={FadeInDown.delay(150).springify().damping(15)} style={styles.floating}>
            <View style={styles.inner}>{floating}</View>
          </Animated.View>
        )}
        <View style={[styles.sheet, floating ? styles.sheetUnder : { backgroundColor: theme.colors.background }]}>
          <View style={styles.inner}>
            {sections.map((section, index) => (
              <Animated.View key={section.key ?? index} entering={FadeInDown.delay(220 + index * 70).springify().damping(16)}>
                {section}
              </Animated.View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      <Animated.View pointerEvents="none" style={[styles.bar, { paddingTop: insets.top, height: insets.top + BAR }, barStyle]}>
        <LinearGradient colors={crimson} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <Display size={22} color="#FFFFFF" numberOfLines={1} style={[styles.barTitle, back && styles.barTitleBack]}>
          {title}
        </Display>
      </Animated.View>

      {back && (
        <IconButton
          icon="arrow-left"
          iconColor="#FFFFFF"
          containerColor="rgba(15,4,6,0.45)"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={[styles.back, { top: insets.top + 4 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingBottom: TAB_BAR_SPACE + 40 },
  hero: { overflow: 'hidden', justifyContent: 'flex-end' },
  topBar: { position: 'absolute', left: 20, right: 20 },
  heroText: { paddingHorizontal: 24, paddingBottom: 52, gap: 6 },
  heroTextOver: { paddingBottom: FLOAT_OVER + 24 },
  rule: { width: 56, height: 2, backgroundColor: gold, borderRadius: 1, marginVertical: 4 },
  subtitle: { color: 'rgba(255,255,255,0.88)' },
  floating: { marginTop: -FLOAT_OVER, paddingHorizontal: 16, alignItems: 'center', zIndex: 1 },
  sheet: { marginTop: -28, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20, paddingHorizontal: 16, alignItems: 'center' },
  sheetUnder: { marginTop: 0, paddingTop: 18 },
  inner: { width: '100%', maxWidth: 720, gap: 18 },
  bar: { position: 'absolute', left: 0, right: 0, top: 0, justifyContent: 'center' },
  barTitle: { paddingHorizontal: 20 },
  barTitleBack: { paddingLeft: 60 },
  back: { position: 'absolute', left: 8, margin: 0 },
});
