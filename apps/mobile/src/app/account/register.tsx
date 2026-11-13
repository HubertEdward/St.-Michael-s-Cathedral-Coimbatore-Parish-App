import { zodResolver } from '@hookform/resolvers/zod';
import { familyInputSchema, useRegisterFamily, type FamilyInput } from '@parish/core';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Snackbar, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/design/GradientButton';
import { SentForApproval } from '@/components/family/SentForApproval';
import { translateError } from '@/components/translateError';

const empty: FamilyInput = { familyName: '', headName: '', address: '', anbiyam: '' };

/** Register a new family, with the signed-in person as its head. */
export default function RegisterFamily() {
  const { t } = useTranslation();
  const theme = useTheme();
  const register = useRegisterFamily();
  const [sent, setSent] = useState(false);
  const { control, handleSubmit, formState } = useForm<FamilyInput>({ resolver: zodResolver(familyInputSchema), defaultValues: empty });

  if (sent) return <SentForApproval body={t('account.registerSent')} />;

  return (
    <Screen>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('account.registerIntro')}
      </Text>
      <FormField control={control} name="familyName" label={t('account.familyName')} hint={t('account.familyNameHint')} />
      <FormField control={control} name="headName" label={t('account.headName')} />
      <FormField control={control} name="address" label={t('account.address')} multiline />
      <FormField control={control} name="anbiyam" label={t('account.anbiyam')} hint={t('account.anbiyamHint')} />
      <GradientButton
        label={t('account.sendForApproval')}
        icon="send"
        loading={formState.isSubmitting}
        onPress={handleSubmit(async (values) => {
          await register.mutateAsync([values]);
          setSent(true);
        })}
      />
      <Snackbar visible={register.isError} onDismiss={() => register.reset()}>
        {translateError(t, register.error?.message)}
      </Snackbar>
    </Screen>
  );
}
