import { useRef, useState, type RefObject } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { StyleSheet, View, type TextInput as NativeTextInput } from 'react-native';
import { HelperText, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { translateError } from './translateError';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
}

/**
 * A date typed as day, month and year, the way it is written on certificates in India. It holds
 * "YYYY-MM-DD", or '' while all three boxes are empty; a part-filled date fails validation.
 */
export function DateField<T extends FieldValues>({ control, name, label, hint }: Props<T>) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View>
          <DateParts label={label} value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} error={!!fieldState.error} />
          <HelperText type={fieldState.error ? 'error' : 'info'} visible={!!fieldState.error || !!hint}>
            {fieldState.error ? translateError(t, fieldState.error.message) : hint}
          </HelperText>
        </View>
      )}
    />
  );
}

type Parts = { day: string; month: string; year: string };

const split = (value: string): Parts => {
  const [year = '', month = '', day = ''] = value ? value.split('-') : [];
  return { day, month, year };
};

const join = ({ day, month, year }: Parts) =>
  day || month || year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : '';

function DateParts({
  label,
  value,
  onChange,
  onBlur,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: boolean;
}) {
  const { t } = useTranslation();
  const [parts, setParts] = useState(() => split(value));
  const monthRef = useRef<NativeTextInput>(null);
  const yearRef = useRef<NativeTextInput>(null);

  const update = (key: keyof Parts, text: string, next?: RefObject<NativeTextInput | null>) => {
    const digits = text.replace(/\D/g, '');
    const changed = { ...parts, [key]: digits };
    setParts(changed);
    onChange(join(changed));
    if (next && digits.length === 2) next.current?.focus();
  };

  const box = (key: keyof Parts, length: number, ref?: RefObject<NativeTextInput | null>, next?: RefObject<NativeTextInput | null>) => (
    <TextInput
      ref={ref}
      mode="outlined"
      label={t(`member.${key}`)}
      value={parts[key]}
      onChangeText={(text) => update(key, text, next)}
      onBlur={onBlur}
      error={error}
      keyboardType="number-pad"
      maxLength={length}
      style={key === 'year' ? styles.year : styles.flex}
    />
  );

  return (
    <View style={styles.block}>
      <Text variant="titleSmall">{label}</Text>
      <View style={styles.row}>
        {box('day', 2, undefined, monthRef)}
        {box('month', 2, monthRef, yearRef)}
        {box('year', 4, yearRef)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 4 },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  year: { flex: 1.5 },
});
