import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** A dot with a ring that breathes, for "starting soon". */
export function Pulse({ color }: { color: string }) {
  const beat = useSharedValue(0);
  useEffect(() => {
    beat.set(withRepeat(withTiming(1, { duration: 1100 }), -1, false));
  }, [beat]);
  const ring = useAnimatedStyle(() => ({
    opacity: interpolate(beat.get(), [0, 1], [0.55, 0]),
    transform: [{ scale: interpolate(beat.get(), [0, 1], [1, 2.6]) }],
  }));
  return (
    <View style={styles.box}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, ring]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
});
