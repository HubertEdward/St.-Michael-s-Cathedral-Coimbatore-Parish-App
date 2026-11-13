import { createAccountSchema, DEMO_PIN, signInSchema, useCreateAccount, useSignIn } from '@parish/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Display } from '@/components/design/Display';
import { GradientButton } from '@/components/design/GradientButton';
import { IconBadge } from '@/components/design/IconBadge';
import { PinInput } from '@/components/family/PinInput';
import { translateError } from '@/components/translateError';

type Mode = 'signIn' | 'create';

/**
 * Sign in with a mobile number and a 6-digit PIN, or choose a PIN the first time. No SMS is sent:
 * the parish office approves every family and member, and resets forgotten PINs.
 */
export default function SignIn() {
  const { t } = useTranslation();
  const theme = useTheme();
  const signIn = useSignIn();
  const createAccount = useCreateAccount();
  const [mode, setMode] = useState<Mode>('signIn');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const creating = mode === 'create';

  const switchMode = () => {
    setMode(creating ? 'signIn' : 'create');
    setPin('');
    setConfirm('');
    setError(undefined);
  };

  const submit = async () => {
    const parsed = creating ? createAccountSchema.safeParse({ phone, pin, confirm }) : signInSchema.safeParse({ phone, pin });
    if (!parsed.success) {
      setError(translateError(t, parsed.error.issues[0]?.message));
      return;
    }
    setError(undefined);
    try {
      if (creating) await createAccount.mutateAsync([{ phone, pin, confirm }]);
      else await signIn.mutateAsync([{ phone, pin }]);
      router.replace('/account');
    } catch (e) {
      setError(translateError(t, (e as Error).message));
    }
  };

  return (
    <Screen>
      <View style={styles.head}>
        <IconBadge icon={creating ? 'account-key' : 'cellphone-key'} size={64} color={theme.colors.primary} background={theme.colors.primaryContainer} />
        <Display size={34}>{creating ? t('account.createTitle') : t('account.signInTitle')}</Display>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {creating ? t('account.createBody') : t('account.signInBody')}
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          mode="outlined"
          label={t('account.phone')}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          left={<TextInput.Icon icon="phone" />}
          autoFocus
        />
        <View style={styles.field}>
          <Text variant="labelLarge">{creating ? t('account.choosePin') : t('account.pin')}</Text>
          <PinInput value={pin} onChange={setPin} label={t('account.pin')} secure />
        </View>
        {creating && (
          <View style={styles.field}>
            <Text variant="labelLarge">{t('account.confirmPin')}</Text>
            <PinInput value={confirm} onChange={setConfirm} label={t('account.confirmPin')} secure />
          </View>
        )}
        <HelperText type="error" visible={!!error} style={styles.error}>
          {error}
        </HelperText>
        <GradientButton
          label={creating ? t('account.createAccount') : t('account.signIn')}
          icon={creating ? 'account-check' : 'login'}
          onPress={() => void submit()}
          loading={signIn.isPending || createAccount.isPending}
        />
        <Button onPress={switchMode}>{creating ? t('account.haveAccount') : t('account.firstTime')}</Button>
        {!creating && <Button onPress={() => router.push('/account/forgot-pin')}>{t('account.forgotPin')}</Button>}
      </View>

      <Notice text={t('account.preview', { pin: DEMO_PIN })} icon="flask-outline" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 10, alignItems: 'flex-start', marginTop: 8 },
  form: { gap: 12 },
  field: { gap: 8 },
  error: { paddingHorizontal: 0 },
});
