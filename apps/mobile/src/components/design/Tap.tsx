import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const tapFeedback = () => Haptics.selectionAsync().catch(() => undefined);

interface Props {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'radio' | 'tab';
  selected?: boolean;
}

/** A pressable that springs down slightly and ticks the haptics when touched. */
export function Tap({ children, onPress, style, disabled, accessibilityLabel, accessibilityRole = 'button', selected }: Props) {
  const pressed = useSharedValue(false);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.get() ? 0.96 : 1, { damping: 18, stiffness: 320 }) }],
  }));
  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPressIn={() => pressed.set(true)}
      onPressOut={() => pressed.set(false)}
      onPress={() => {
        void tapFeedback();
        onPress?.();
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}
