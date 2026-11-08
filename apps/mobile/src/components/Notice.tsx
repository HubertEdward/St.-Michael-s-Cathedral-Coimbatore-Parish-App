import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

/** A quiet information strip, e.g. the preview notice or "last checked" date. */
export function Notice({ text, icon = 'information-outline' }: { text: string; icon?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.colors.secondaryContainer }]}>
      <Icon source={icon} size={20} color={theme.colors.onSecondaryContainer} />
      <Text variant="bodySmall" style={[styles.text, { color: theme.colors.onSecondaryContainer }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, alignItems: 'flex-start' },
  text: { flex: 1 },
});
