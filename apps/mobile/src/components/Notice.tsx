import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

import { gold } from './design/tokens';

/** A quiet information strip, e.g. the preview notice or "last checked" date: a soft card with a gold edge. */
export function Notice({ text, icon = 'information-outline' }: { text: string; icon?: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.dark ? theme.colors.elevation.level1 : '#FFFBF2', borderColor: theme.colors.outlineVariant },
      ]}>
      <Icon source={icon} size={20} color={theme.dark ? gold : theme.colors.secondary} />
      <Text variant="bodySmall" style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    alignItems: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
    borderLeftColor: gold,
  },
  text: { flex: 1, lineHeight: 20 },
});
