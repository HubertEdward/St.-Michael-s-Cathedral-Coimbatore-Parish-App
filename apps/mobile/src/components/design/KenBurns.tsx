import { Image, type ImageContentPosition } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const SHOW_MS = 6500;
const FADE_MS = 1400;

interface Props {
  images: number[];
  position?: ImageContentPosition;
  /** Shows small dots for the pictures, bottom right. */
  dots?: boolean;
  dotsBottom?: number;
}

/**
 * Pictures that slowly zoom in while they are shown and crossfade into the next one,
 * like a documentary camera moving over a photograph.
 */
export function KenBurns({ images, position = 'center', dots = true, dotsBottom = 24 }: Props) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(() => setActive((index) => (index + 1) % images.length), SHOW_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {images.map((source, index) => (
        <Slide key={index} source={source} active={index === active} position={position} />
      ))}
      {dots && images.length > 1 && (
        <View style={[styles.dots, { bottom: dotsBottom }]}>
          {images.map((_, index) => (
            <Dot key={index} active={index === active} />
          ))}
        </View>
      )}
    </View>
  );
}

function Slide({ source, active, position }: { source: number; active: boolean; position: ImageContentPosition }) {
  const opacity = useSharedValue(active ? 1 : 0);
  const scale = useSharedValue(1);
  useEffect(() => {
    opacity.set(withTiming(active ? 1 : 0, { duration: FADE_MS }));
    if (active) {
      scale.set(1);
      scale.set(withTiming(1.14, { duration: SHOW_MS + FADE_MS, easing: Easing.linear }));
    }
  }, [active, opacity, scale]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ scale: scale.get() }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Image source={source} contentFit="cover" contentPosition={position} style={StyleSheet.absoluteFill} transition={300} />
    </Animated.View>
  );
}

function Dot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 22 : 7);
  useEffect(() => {
    width.set(withTiming(active ? 22 : 7, { duration: 400 }));
  }, [active, width]);
  const style = useAnimatedStyle(() => ({ width: width.get(), opacity: active ? 1 : 0.55 }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  dots: { position: 'absolute', right: 20, flexDirection: 'row', gap: 6 },
  dot: { height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' },
});
