import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';

interface Props<T extends string> {
  label?: string;
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
  /** One scrolling row instead of wrapping lines. */
  scroll?: boolean;
}

/** Large, tappable single-choice chips; easier than a dropdown for older users. */
export function ChoiceChips<T extends string>({ label, options, value, onChange, scroll = false }: Props<T>) {
  const theme = useTheme();
  const chips = options.map((option) => {
    const selected = option.value === value;
    return (
      <Chip
        key={option.value}
        mode={selected ? 'flat' : 'outlined'}
        selected={selected}
        selectedColor={selected ? theme.colors.onPrimary : theme.colors.onSurface}
        style={selected ? { backgroundColor: theme.colors.primary } : undefined}
        onPress={() => onChange(option.value)}
        accessibilityRole="radio"
        accessibilityState={{ selected }}>
        {option.label}
      </Chip>
    );
  });
  return (
    <View style={styles.block}>
      {label && <Text variant="titleSmall">{label}</Text>}
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {chips}
        </ScrollView>
      ) : (
        <View style={[styles.row, styles.wrap]}>{chips}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  wrap: { flexWrap: 'wrap' },
});
