import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import { errorText } from './errors';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  multiline?: boolean;
  /** Share a row with other fields (in a wrapping row container). */
  grow?: boolean;
}

export function FormField<T extends FieldValues>({ control, name, label, hint, multiline, grow }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View style={grow ? { flexGrow: 1, flexBasis: 220 } : undefined}>
          <TextInput
            mode="outlined"
            dense
            label={label}
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={!!fieldState.error}
            multiline={multiline}
            numberOfLines={multiline ? 4 : undefined}
          />
          <HelperText type={fieldState.error ? 'error' : 'info'} visible={!!fieldState.error || !!hint}>
            {fieldState.error ? errorText(fieldState.error.message) : hint}
          </HelperText>
        </View>
      )}
    />
  );
}
