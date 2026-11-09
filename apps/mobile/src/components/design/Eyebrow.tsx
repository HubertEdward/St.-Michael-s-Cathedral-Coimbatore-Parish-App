import type { StyleProp, TextStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

/** Small spaced capitals above a heading: "NEXT MASS". */
export function Eyebrow({ children, color, style }: { children: string; color?: string; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return (
    <Text style={[{ fontSize: 12, letterSpacing: 1.6, fontWeight: '700', color: color ?? theme.colors.secondary }, style]}>
      {children.toUpperCase()}
    </Text>
  );
}
