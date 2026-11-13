import { phoneSchema, useSignIn } from '@parish/core';
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
import { OtpInput } from '@/components/family/OtpInput';
import { translateError } from '@/components/translateError';

/**
 * Sign in with a phone number and a one-time code. In the preview no SMS is sent and any six
 * digits are accepted; Phase 2 sends a real code through Supabase.
 */
export default function SignIn() {
  const { t } = useTranslation();
  const theme = useTheme();
  const signIn = useSignIn();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();
  const [step, setStep] = useState<'phone' | 'code'>('phone');

  const sendCode = () => {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(translateError(t, parsed.error.issues[0]?.message));
      return;
    }
    setError(undefined);
    setStep('code');
  };

  const verify = async () => {
    await signIn.mutateAsync([phone]);
    router.replace('/account');
  };

  return (
    <Screen>
      <View style={styles.head}>
        <IconBadge icon={step === 'phone' ? 'cellphone-key' : 'message-lock'} size={64} color={theme.colors.primary} background={theme.colors.primaryContainer} />
        <Display size={34}>{step === 'phone' ? t('account.signInTitle') : t('account.codeTitle')}</Display>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {step === 'phone' ? t('account.signInBody') : t('account.codeBody', { phone })}
        </Text>
      </View>

      {step === 'phone' ? (
        <View style={styles.form}>
          <View>
            <TextInput
              mode="outlined"
              label={t('account.phone')}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              left={<TextInput.Icon icon="phone" />}
              error={!!error}
              autoFocus
            />
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          </View>
          <GradientButton label={t('account.sendCode')} icon="message-arrow-right" onPress={sendCode} />
        </View>
      ) : (
        <View style={styles.form}>
          <OtpInput onComplete={() => void verify()} />
          <Button onPress={() => setStep('phone')}>{t('account.changeNumber')}</Button>
        </View>
      )}

      <Notice text={t('account.preview')} icon="flask-outline" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 10, alignItems: 'flex-start', marginTop: 8 },
  form: { gap: 12 },
});
