import { StyleSheet, View } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';

interface Props<T extends string | number> {
  label?: string;
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
}

export function Choice<T extends string | number>({ label, options, value, onChange, error }: Props<T>) {
  const theme = useTheme();
  return (
    <View style={styles.block}>
      {label && <Text variant="labelLarge">{label}</Text>}
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Chip
              key={String(option.value)}
              compact
              mode={selected ? 'flat' : 'outlined'}
              selected={selected}
              selectedColor={selected ? theme.colors.onPrimary : theme.colors.onSurface}
              style={selected ? { backgroundColor: theme.colors.primary } : undefined}
              onPress={() => onChange(option.value)}>
              {option.label}
            </Chip>
          );
        })}
      </View>
      {error && (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
