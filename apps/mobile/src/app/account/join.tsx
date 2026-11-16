import { zodResolver } from '@hookform/resolvers/zod';
import { joinFamilySchema, relationships, useRequestToJoinFamily, type JoinFamilyInput } from '@parish/core';
import { useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { Snackbar, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ChoiceChips';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/design/GradientButton';
import { MemberDetailsFields, noDetails } from '@/components/family/MemberDetailsFields';
import { SentForApproval } from '@/components/family/SentForApproval';
import { translateError } from '@/components/translateError';

const empty: JoinFamilyInput = { code: '', name: '', relationship: 'son', ...noDetails };

/** Ask to join a registered family with its family code; the parish office approves it. */
export default function JoinFamily() {
  const { t } = useTranslation();
  const theme = useTheme();
  const join = useRequestToJoinFamily();
  const [sent, setSent] = useState(false);
  const form = useForm<JoinFamilyInput>({ resolver: zodResolver(joinFamilySchema), defaultValues: empty });
  const { control, handleSubmit, formState } = form;

  if (sent) return <SentForApproval body={t('account.joinSent')} />;

  return (
    <Screen>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('account.joinIntro')}
      </Text>
      <FormField control={control} name="code" label={t('account.familyCode')} hint={t('account.familyCodeHint')} />
      <FormField tamil control={control} name="name" label={t('account.yourName')} />
      <Controller
        control={control}
        name="relationship"
        render={({ field }) => (
          <ChoiceChips
            label={t('account.relationshipToHead')}
            options={relationships.filter((r) => r !== 'head').map((r) => ({ value: r, label: t(`family.relationship.${r}`) }))}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('member.detailsIntro')}
      </Text>
      <FormProvider {...form}>
        <MemberDetailsFields />
      </FormProvider>
      <GradientButton
        label={t('account.askToJoin')}
        icon="send"
        loading={formState.isSubmitting}
        onPress={handleSubmit(async (values) => {
          await join.mutateAsync([values]);
          setSent(true);
        })}
      />
      <Snackbar visible={join.isError} onDismiss={() => join.reset()}>
        {translateError(t, join.error?.message)}
      </Snackbar>
    </Screen>
  );
}
