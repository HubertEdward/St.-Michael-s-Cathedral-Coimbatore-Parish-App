import { formatRupees, suggestedAmounts } from '@parish/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, Icon, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Tap } from '@/components/design/Tap';
import { radius } from '@/components/design/tokens';
import { useLanguage } from '@/i18n';

interface Props {
  value: number;
  onChange: (amount: number) => void;
  error?: string;
}

const isSuggested = (amount: number) => suggestedAmounts.some((a) => a === amount);

/** Tiles for the suggested monthly amounts, and "Other" for any amount. */
export function AmountPicker({ value, onChange, error }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useLanguage();
  const [other, setOther] = useState(() => !isSuggested(value));

  const tile = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <Tap
      key={key}
      onPress={onPress}
      accessibilityRole="radio"
      selected={selected}
      accessibilityLabel={label}
      style={[
        styles.tile,
        selected
          ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
          : { backgroundColor: theme.dark ? theme.colors.elevation.level2 : '#FFFFFF', borderColor: theme.colors.outlineVariant },
      ]}>
      <Text variant="titleLarge" style={[styles.amount, { color: selected ? theme.colors.onPrimary : theme.colors.onSurface }]}>
        {label}
      </Text>
      {selected && (
        <View style={styles.check}>
          <Icon source="check-circle" size={18} color={theme.colors.onPrimary} />
        </View>
      )}
    </Tap>
  );

  return (
    <View style={styles.block}>
      <View style={styles.grid}>
        {suggestedAmounts.map((amount) =>
          tile(String(amount), formatRupees(amount, language), !other && value === amount, () => {
            setOther(false);
            onChange(amount);
          }),
        )}
        {tile('other', t('give.other'), other, () => setOther(true))}
      </View>
      {other && (
        <TextInput
          mode="outlined"
          label={t('give.otherAmount')}
          keyboardType="number-pad"
          left={<TextInput.Affix text="₹" />}
          value={value ? String(value) : ''}
          onChangeText={(typed) => onChange(Number(typed.replace(/\D/g, '')) || 0)}
          error={!!error}
          autoFocus
        />
      )}
      {error && (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    height: 64,
    borderRadius: radius.tile,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  check: { position: 'absolute', top: 6, right: 8 },
});
