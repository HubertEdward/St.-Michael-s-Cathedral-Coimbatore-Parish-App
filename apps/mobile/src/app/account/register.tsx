import { zodResolver } from '@hookform/resolvers/zod';
import { familyInputSchema, useGroups, useRegisterFamily, type FamilyInput } from '@parish/core';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Snackbar, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ChoiceChips';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/design/GradientButton';
import { SentForApproval } from '@/components/family/SentForApproval';
import { translateError } from '@/components/translateError';
import { useLocalized } from '@/i18n';

const empty: FamilyInput = { familyName: '', headName: '', address: '', preferredAnbiyamId: '' };

/** Ask the parish priest to take a new family into the parish, with the signed-in person as its head. */
export default function RegisterFamily() {
  const { t } = useTranslation();
  const theme = useTheme();
  const register = useRegisterFamily();
  const text = useLocalized();
  const anbiyams = (useGroups().data ?? []).filter((g) => g.kind === 'anbiyam');
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
      {anbiyams.length > 0 && (
        <Controller
          control={control}
          name="preferredAnbiyamId"
          render={({ field }) => (
            <View style={{ gap: 6 }}>
              <ChoiceChips
                label={t('account.preferredAnbiyam')}
                options={[...anbiyams.map((a) => ({ value: a.id, label: text(a.name) })), { value: '', label: t('account.notSure') }]}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('account.preferredAnbiyamHint')}
              </Text>
            </View>
          )}
        />
      )}
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
