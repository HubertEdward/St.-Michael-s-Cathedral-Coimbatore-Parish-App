import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { View, type KeyboardTypeOptions } from 'react-native';
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
  /** A PIN: hidden as it is typed, with a number keypad. */
  secret?: boolean;
  keyboardType?: KeyboardTypeOptions;
  /** Called when Enter is pressed in a single-line field. */
  onSubmit?: () => void;
}

export function FormField<T extends FieldValues>({ control, name, label, hint, multiline, grow, secret, keyboardType, onSubmit }: Props<T>) {
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
            secureTextEntry={secret}
            keyboardType={secret ? 'number-pad' : keyboardType}
            onSubmitEditing={multiline ? undefined : onSubmit}
          />
          <HelperText type={fieldState.error ? 'error' : 'info'} visible={!!fieldState.error || !!hint}>
            {fieldState.error ? errorText(fieldState.error.message) : hint}
          </HelperText>
        </View>
      )}
    />
  );
}
