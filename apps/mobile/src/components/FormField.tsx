import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { TamilTextInput } from './tamil/TamilTextInput';
import { translateError } from './translateError';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numbers-and-punctuation';
  /** Free text people may write in Tamil: they can type it in English letters. */
  tamil?: boolean;
}

/** A Paper text input bound to react-hook-form, showing translated validation errors. */
export function FormField<T extends FieldValues>({ control, name, label, hint, multiline, keyboardType, tamil }: Props<T>) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View>
          {tamil ? (
            <TamilTextInput
              label={label}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              multiline={multiline}
            />
          ) : (
            <TextInput
              mode="outlined"
              label={label}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              multiline={multiline}
              keyboardType={keyboardType}
            />
          )}
          <HelperText type={fieldState.error ? 'error' : 'info'} visible={!!fieldState.error || !!hint}>
            {fieldState.error ? translateError(t, fieldState.error.message) : hint}
          </HelperText>
        </View>
      )}
    />
  );
}
