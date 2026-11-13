import { zodResolver } from '@hookform/resolvers/zod';
import { memberInputSchema, relationships, useAddFamilyMember, type MemberInput } from '@parish/core';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Snackbar, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ChoiceChips';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/design/GradientButton';
import { SentForApproval } from '@/components/family/SentForApproval';
import { translateError } from '@/components/translateError';

const empty: MemberInput = { name: '', relationship: 'son', birthDate: '' };

/** Add a family member without their own phone, such as a child or an elder; the parish office approves it. */
export default function AddMember() {
  const { t } = useTranslation();
  const theme = useTheme();
  const add = useAddFamilyMember();
  const [sent, setSent] = useState(false);
  const { control, handleSubmit, formState } = useForm<MemberInput>({ resolver: zodResolver(memberInputSchema), defaultValues: empty });

  if (sent) return <SentForApproval body={t('account.memberSent')} />;

  return (
    <Screen>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('account.addIntro')}
      </Text>
      <FormField control={control} name="name" label={t('account.memberName')} />
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
      <FormField control={control} name="birthDate" label={t('account.birthDate')} keyboardType="numbers-and-punctuation" />
      <GradientButton
        label={t('account.sendForApproval')}
        icon="send"
        loading={formState.isSubmitting}
        onPress={handleSubmit(async (values) => {
          await add.mutateAsync([values]);
          setSent(true);
        })}
      />
      <Snackbar visible={add.isError} onDismiss={() => add.reset()}>
        {translateError(t, add.error?.message)}
      </Snackbar>
    </Screen>
  );
}
