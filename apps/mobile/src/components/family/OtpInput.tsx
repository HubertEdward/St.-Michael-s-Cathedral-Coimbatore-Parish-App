import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { radius } from '@/components/design/tokens';

const LENGTH = 6;

/** Six boxes for a one-time code; typing fills them, and the sixth digit completes it. */
export function OtpInput({ onComplete }: { onComplete: (code: string) => void }) {
  const theme = useTheme();
  const input = useRef<TextInput>(null);
  const [code, setCode] = useState('');

  const change = (typed: string) => {
    const digits = typed.replace(/\D/g, '').slice(0, LENGTH);
    setCode(digits);
    if (digits.length === LENGTH) onComplete(digits);
  };

  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel="One-time code">
      <View style={styles.row}>
        {Array.from({ length: LENGTH }, (_, index) => {
          const active = index === Math.min(code.length, LENGTH - 1);
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
                {code[index] ?? ''}
              </Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        value={code}
        onChangeText={change}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={LENGTH}
        autoFocus
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
