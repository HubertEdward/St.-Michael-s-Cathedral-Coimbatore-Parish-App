import { useMyFamily, useUpdateFamilyMember } from '@parish/core';
import { router, useLocalSearchParams } from 'expo-router';
import { Snackbar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { MemberForm } from '@/components/family/MemberForm';
import { detailsOf } from '@/components/family/MemberDetailsFields';
import { translateError } from '@/components/translateError';

/** Fill in or correct a family member's register entry. */
export default function EditMember() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mine = useMyFamily();
  const update = useUpdateFamilyMember();

  return (
    <Screen>
      <QueryState query={mine}>
        {(data) => {
          const member = data?.family.members.find((m) => m.id === id);
          if (!member) return <Text variant="bodyLarge">{t('common.notFound')}</Text>;
          return (
            <MemberForm
              defaultValues={{ name: member.name, relationship: member.relationship, ...detailsOf(member) }}
              submitLabel={t('member.save')}
              submitIcon="content-save"
              onSubmit={async (values) => {
                await update.mutateAsync([member.id, values]);
                router.back();
              }}
            />
          );
        }}
      </QueryState>
      <Snackbar visible={update.isError} onDismiss={() => update.reset()}>
        {translateError(t, update.error?.message)}
      </Snackbar>
    </Screen>
  );
}
