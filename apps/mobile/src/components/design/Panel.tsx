import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

import { Tap } from './Tap';
import { panel, radius } from './tokens';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** The app's card: soft surface, hairline border, generous padding. Pressable when given onPress. */
export function Panel({ children, onPress, style, accessibilityLabel }: Props) {
  const theme = useTheme();
  const look = [styles.panel, panel(theme), style];
  return onPress ? (
    <Tap onPress={onPress} style={look} accessibilityLabel={accessibilityLabel}>
      {children}
    </Tap>
  ) : (
    <View style={look}>{children}</View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 10,
    shadowColor: '#3D0710',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
});
