import { useGroups, useMarkMessagesRead, useMyMessages } from '@parish/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ChoiceChips';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { MessageCard } from '@/components/groups/MessageCard';
import { useLocalized } from '@/i18n';

/** Messages from the person's Anbiyam and groups, newest first; opening the screen marks them read. */
export default function Messages() {
  const { t } = useTranslation();
  const theme = useTheme();
  const text = useLocalized();
  const mine = useMyMessages();
  const groups = useGroups().data ?? [];
  const { mutate: markRead } = useMarkMessagesRead();
  const [group, setGroup] = useState('all');
  // What was new when the screen opened stays highlighted while it is open.
  const [readBefore, setReadBefore] = useState<string>();
  const data = mine.data;
  useEffect(() => {
    if (data && data.unread > 0) {
      setReadBefore((before) => before ?? data.lastRead);
      markRead([]);
    }
  }, [data, markRead]);

  if (mine.isPending) return <Screen>{null}</Screen>;
  if (!mine.data) {
    return (
      <Screen>
        <Text variant="bodyLarge">{t('messages.signIn')}</Text>
        <Button mode="contained" icon="login" onPress={() => router.push('/account')}>
          {t('account.signIn')}
        </Button>
      </Screen>
    );
  }

  const name = (id: string) => {
    const g = groups.find((x) => x.id === id);
    return g ? text(g.name) : '';
  };
  const ids = [...new Set(mine.data.messages.map((m) => m.groupId))];
  const shown = mine.data.messages.filter((m) => group === 'all' || m.groupId === group);
  const cutoff = readBefore ?? mine.data.lastRead;

  return (
    <Screen onRefresh={() => mine.refetch()}>
      {ids.length > 1 && (
        <ChoiceChips options={[{ value: 'all', label: t('messages.all') }, ...ids.map((id) => ({ value: id, label: name(id) }))]} value={group} onChange={setGroup} scroll />
      )}
      {shown.length === 0 && (
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('messages.empty')}
        </Text>
      )}
      {shown.map((m) => (
        <MessageCard key={m.id} message={m} groupName={name(m.groupId)} unread={m.sentAt > cutoff} />
      ))}
      <Notice icon="bell-ring-outline" text={t('messages.preview')} />
    </Screen>
  );
}
