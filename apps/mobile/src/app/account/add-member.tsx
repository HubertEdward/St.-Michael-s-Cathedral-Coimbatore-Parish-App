import { useAddFamilyMember } from '@parish/core';
import { useState } from 'react';
import { Snackbar, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';
import { MemberForm } from '@/components/family/MemberForm';
import { noDetails } from '@/components/family/MemberDetailsFields';
import { SentForApproval } from '@/components/family/SentForApproval';
import { translateError } from '@/components/translateError';

/** Add a family member without their own phone, such as a child or an elder; the parish office approves it. */
export default function AddMember() {
  const { t } = useTranslation();
  const theme = useTheme();
  const add = useAddFamilyMember();
  const [sent, setSent] = useState(false);

  if (sent) return <SentForApproval body={t('account.memberSent')} />;

  return (
    <Screen>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('account.addIntro')} {t('member.detailsIntro')}
      </Text>
      <MemberForm
        defaultValues={{ name: '', relationship: 'son', ...noDetails }}
        submitLabel={t('account.sendForApproval')}
        submitIcon="send"
        onSubmit={async (values) => {
          await add.mutateAsync([values]);
          setSent(true);
        }}
      />
      <Snackbar visible={add.isError} onDismiss={() => add.reset()}>
        {translateError(t, add.error?.message)}
      </Snackbar>
    </Screen>
  );
}
