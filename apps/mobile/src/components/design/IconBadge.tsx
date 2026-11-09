import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

/** An icon in a tinted circle, used in action rows and lists. */
export function IconBadge({ icon, color, background, size = 48 }: { icon: string; color: string; background: string; size?: number }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: background }]}>
      <Icon source={icon} size={size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});
