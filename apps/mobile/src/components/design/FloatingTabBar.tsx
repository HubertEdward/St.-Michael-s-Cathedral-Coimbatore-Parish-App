import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { tapFeedback } from './Tap';
import { crimson, gold } from './tokens';

/** Icons per tab route: [outline, filled]. */
const icons: Record<string, [string, string]> = {
  index: ['home-variant-outline', 'home-variant'],
  timings: ['clock-outline', 'clock'],
  pray: ['hands-pray', 'hands-pray'],
  give: ['hand-heart-outline', 'hand-heart'],
  more: ['view-grid-outline', 'view-grid'],
};

/** The tab in the middle, drawn as a raised round button. */
const CENTER = 'pray';

/** Height the floating bar takes above the safe area; scroll views leave this much room at the bottom. */
export const TAB_BAR_SPACE = 104;

/**
 * A floating, rounded tab bar. A soft pill slides under the chosen tab, its icon fills and bounces,
 * and the Pray tab rises from the middle as a glowing crimson button.
 */
export function FloatingTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const slot = width / state.routes.length;
  const x = useSharedValue(0);
  const centerFocused = state.routes[state.index]?.name === CENTER;

  useEffect(() => {
    x.set(withSpring(state.index * slot, { damping: 18, stiffness: 190, mass: 0.8 }));
  }, [state.index, slot, x]);

  const pill = useAnimatedStyle(() => ({
    width: slot,
    opacity: withTiming(centerFocused || slot === 0 ? 0 : 1, { duration: 180 }),
    transform: [{ translateX: x.get() }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={[
          styles.bar,
          {
            backgroundColor: theme.dark ? 'rgba(42,29,29,0.94)' : 'rgba(255,255,255,0.94)',
            borderColor: theme.colors.outlineVariant,
          },
        ]}>
        <Animated.View style={[styles.pillSlot, pill]}>
          <View style={[styles.pill, { backgroundColor: theme.colors.primaryContainer }]} />
        </Animated.View>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            void tapFeedback();
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return route.name === CENTER ? (
            <CenterTab key={route.key} label={label} focused={focused} onPress={onPress} />
          ) : (
            <TabItem key={route.key} name={route.name} label={label} focused={focused} onPress={onPress} />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({ name, label, focused, onPress }: { name: string; label: string; focused: boolean; onPress: () => void }) {
  const theme = useTheme();
  const bounce = useSharedValue(1);
  useEffect(() => {
    if (focused) bounce.set(withSequence(withTiming(0.92, { duration: 80 }), withSpring(1, { damping: 16, stiffness: 220 })));
  }, [focused, bounce]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: bounce.get() }] }));
  const [outline, filled] = icons[name] ?? ['circle-outline', 'circle'];
  const color = focused ? theme.colors.primary : theme.colors.onSurfaceVariant;
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label} style={styles.item}>
      <Animated.View style={iconStyle}>
        <Icon source={focused ? filled : outline} size={24} color={color} />
      </Animated.View>
      <Text numberOfLines={1} style={[styles.label, { color, fontWeight: focused ? '700' : '500' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function CenterTab({ label, focused, onPress }: { label: string; focused: boolean; onPress: () => void }) {
  const theme = useTheme();
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.set(withRepeat(withTiming(1, { duration: 1800 }), -1, true));
  }, [glow]);
  const halo = useAnimatedStyle(() => ({
    opacity: interpolate(glow.get(), [0, 1], [0.25, 0.6]),
    transform: [{ scale: interpolate(glow.get(), [0, 1], [1, 1.18]) }],
  }));
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label} style={styles.item}>
      <View style={styles.centerLift}>
        <Animated.View style={[styles.halo, halo]} />
        <View style={styles.centerButton}>
          <LinearGradient colors={crimson} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Icon source="hands-pray" size={28} color={gold} />
        </View>
      </View>
      <Text numberOfLines={1} style={[styles.label, { color: focused ? theme.colors.primary : theme.colors.onSurfaceVariant, fontWeight: '700' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 560,
    height: 68,
    borderRadius: 34,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#3D0710',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(18px)' } : null),
  },
  pillSlot: { position: 'absolute', top: 6, bottom: 6, left: 0, paddingHorizontal: 6 },
  pill: { flex: 1, borderRadius: 28 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 11 },
  centerLift: { marginTop: -34, width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: gold },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
