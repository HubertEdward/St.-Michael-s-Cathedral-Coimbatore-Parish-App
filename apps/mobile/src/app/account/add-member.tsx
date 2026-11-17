import { zodResolver } from '@hookform/resolvers/zod';
import { membersInputSchema, useAddFamilyMembers, type MemberInput } from '@parish/core';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Snackbar, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/design/GradientButton';
import { MemberEntries } from '@/components/family/MemberEntries';
import { newMember } from '@/components/family/MemberForm';
import { SentForApproval } from '@/components/family/SentForApproval';
import { translateError } from '@/components/translateError';

const schema = z.object({ members: membersInputSchema.min(1, 'required') });

/** Add one or more family members without their own phone, such as children or elders; the parish office approves them. */
export default function AddMembers() {
  const { t } = useTranslation();
  const theme = useTheme();
  const add = useAddFamilyMembers();
  const [sent, setSent] = useState(0);
  const form = useForm<{ members: MemberInput[] }>({ resolver: zodResolver(schema), defaultValues: { members: [newMember] } });

  if (sent > 0) return <SentForApproval body={t('account.membersSent', { count: sent })} />;

  return (
    <Screen>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('account.addIntro')} {t('member.detailsIntro')}
      </Text>
      <FormProvider {...form}>
        <MemberEntries keepOne />
      </FormProvider>
      <GradientButton
        label={t('account.sendForApproval')}
        icon="send"
        loading={form.formState.isSubmitting}
        onPress={form.handleSubmit(async ({ members }) => {
          await add.mutateAsync([members]);
          setSent(members.length);
        })}
      />
      <Snackbar visible={add.isError} onDismiss={() => add.reset()}>
        {translateError(t, add.error?.message)}
      </Snackbar>
    </Screen>
  );
}
