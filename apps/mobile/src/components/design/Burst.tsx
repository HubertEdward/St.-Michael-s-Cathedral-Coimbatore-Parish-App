import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';

import { gold } from './tokens';

const COUNT = 18;
const colors = [gold, '#9E2436', '#FFFFFF', '#F3D58A'];

/** A ring of sparks that flies out once, behind a success mark. Mount it to play it. */
export function Burst({ size = 220 }: { size?: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withDelay(80, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })));
  }, [progress]);
  return (
    <View pointerEvents="none" style={[styles.box, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }]}>
      {Array.from({ length: COUNT }, (_, index) => (
        <Spark key={index} index={index} progress={progress} reach={size / 2 - 10} />
      ))}
    </View>
  );
}

function Spark({ index, progress, reach }: { index: number; progress: SharedValue<number>; reach: number }) {
  const angle = (index / COUNT) * Math.PI * 2;
  const distance = reach * (0.65 + (index % 3) * 0.17);
  const dot = 6 + (index % 3) * 2;
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: 1 - p * p,
      transform: [{ translateX: Math.cos(angle) * distance * p }, { translateY: Math.sin(angle) * distance * p }, { scale: 1 - p * 0.5 }],
    };
  });
  return (
    <Animated.View
      style={[styles.spark, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: colors[index % colors.length] }, style]}
    />
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: '50%', top: '50%', alignItems: 'center', justifyContent: 'center' },
  spark: { position: 'absolute' },
});
