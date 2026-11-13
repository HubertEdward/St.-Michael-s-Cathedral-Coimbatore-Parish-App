import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { radius } from '@/components/design/tokens';

const LENGTH = 6;

interface Props {
  value: string;
  onChange: (digits: string) => void;
  /** Read aloud by screen readers, e.g. "PIN". */
  label: string;
  /** Shows dots instead of digits, for a PIN. */
  secure?: boolean;
  autoFocus?: boolean;
}

/** Six boxes for a PIN or a reset code; tapping anywhere on them opens the number keyboard. */
export function PinInput({ value, onChange, label, secure, autoFocus }: Props) {
  const theme = useTheme();
  const input = useRef<TextInput>(null);

  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel={label}>
      <View style={styles.row}>
        {Array.from({ length: LENGTH }, (_, index) => {
          const active = index === Math.min(value.length, LENGTH - 1);
          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                  borderWidth: active ? 2 : 1,
                  backgroundColor: theme.dark ? theme.colors.elevation.level2 : '#FFFFFF',
                },
              ]}>
              <Text variant="headlineSmall" style={styles.digit}>
                {value[index] ? (secure ? '•' : value[index]) : ''}
              </Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        value={value}
        onChangeText={(typed) => onChange(typed.replace(/\D/g, '').slice(0, LENGTH))}
        keyboardType="number-pad"
        secureTextEntry={secure}
        maxLength={LENGTH}
        autoFocus={autoFocus}
        accessibilityLabel={label}
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: { flex: 1, height: 60, maxWidth: 56, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  digit: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
