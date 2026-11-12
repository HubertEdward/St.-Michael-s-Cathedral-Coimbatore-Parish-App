import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Icon, Text } from 'react-native-paper';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Tap } from './Tap';
import { crimson, gold, radius } from './tokens';

interface Props {
  label: string;
  icon?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/** The main action on a screen: a crimson gradient button with a band of light that sweeps across it now and then. */
export function GradientButton({ label, icon, onPress, loading, disabled }: Props) {
  const [width, setWidth] = useState(0);
  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.set(
      withRepeat(
        withSequence(withDelay(2400, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) })), withTiming(0, { duration: 0 })),
        -1,
      ),
    );
  }, [sweep]);
  const shine = useAnimatedStyle(() => ({ transform: [{ translateX: -120 + sweep.get() * (width + 240) }, { skewX: '-20deg' }] }));

  return (
    <Tap
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      style={[styles.button, (disabled || loading) && styles.dim]}>
      <View style={StyleSheet.absoluteFill} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <LinearGradient colors={crimson} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.shine, shine]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.32)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <View style={styles.row}>
          {icon && <Icon source={icon} size={22} color={gold} />}
          <Text variant="titleMedium" style={styles.label}>
            {label}
          </Text>
        </View>
      )}
    </Tap>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 58,
    borderRadius: radius.button,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A1626',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  dim: { opacity: 0.6 },
  shine: { position: 'absolute', top: -10, bottom: -10, width: 90 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { color: '#FFFFFF', fontWeight: '700' },
});
