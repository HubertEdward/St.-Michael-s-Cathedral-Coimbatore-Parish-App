import { parish, resetPinSchema, useResetPin } from '@parish/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';
import { Display } from '@/components/design/Display';
import { GradientButton } from '@/components/design/GradientButton';
import { IconBadge } from '@/components/design/IconBadge';
import { PinInput } from '@/components/family/PinInput';
import { translateError } from '@/components/translateError';

/** Choose a new PIN with the one-day reset code the parish office gives in person or on a call. */
export default function ForgotPin() {
  const { t } = useTranslation();
  const theme = useTheme();
  const resetPin = useResetPin();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();

  const submit = async () => {
    const input = { phone, code, pin, confirm };
    const parsed = resetPinSchema.safeParse(input);
    if (!parsed.success) {
      setError(translateError(t, parsed.error.issues[0]?.message));
      return;
    }
    setError(undefined);
    try {
      await resetPin.mutateAsync([input]);
      router.replace('/account');
    } catch (e) {
      setError(translateError(t, (e as Error).message));
    }
  };

  return (
    <Screen>
      <View style={styles.head}>
        <IconBadge icon="lock-reset" size={64} color={theme.colors.primary} background={theme.colors.primaryContainer} />
        <Display size={34}>{t('account.forgotTitle')}</Display>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('account.forgotBody')}
        </Text>
        <Button mode="outlined" icon="phone" onPress={() => void Linking.openURL(`tel:${parish.phone}`)}>
          {t('account.callOffice', { phone: parish.phoneDisplay })}
        </Button>
      </View>

      <View style={styles.form}>
        <TextInput
          mode="outlined"
          label={t('account.phone')}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          left={<TextInput.Icon icon="phone" />}
        />
        <View style={styles.field}>
          <Text variant="labelLarge">{t('account.resetCode')}</Text>
          <PinInput value={code} onChange={setCode} label={t('account.resetCode')} />
        </View>
        <View style={styles.field}>
          <Text variant="labelLarge">{t('account.newPin')}</Text>
          <PinInput value={pin} onChange={setPin} label={t('account.newPin')} secure />
        </View>
        <View style={styles.field}>
          <Text variant="labelLarge">{t('account.confirmPin')}</Text>
          <PinInput value={confirm} onChange={setConfirm} label={t('account.confirmPin')} secure />
        </View>
        <HelperText type="error" visible={!!error} style={styles.error}>
          {error}
        </HelperText>
        <GradientButton label={t('account.setNewPin')} icon="lock-check" onPress={() => void submit()} loading={resetPin.isPending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 10, alignItems: 'flex-start', marginTop: 8 },
  form: { gap: 12 },
  field: { gap: 8 },
  error: { paddingHorizontal: 0 },
});
