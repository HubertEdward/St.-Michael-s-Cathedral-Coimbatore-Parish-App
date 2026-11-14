import { formatDate, parishDateTime, useAnswerJoinRequest, useDeleteMessage, useGroupMessages, useSendOfficeMessage, type ParishGroup } from '@parish/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, IconButton, List, Text, TextInput, useTheme } from 'react-native-paper';

import { FormDialog } from '@/components/FormDialog';
import { errorText } from '@/components/errors';

import { roleLabel } from './labels';

const sentOn = (iso: string) => {
  const { date, time } = parishDateTime(iso);
  return `${formatDate(date, 'en')}, ${time}`;
};

/** In a group's card: requests to join, the latest messages to the group, and sending one as the parish office. */
export function OfficeMessages({ group }: { group: ParishGroup }) {
  const theme = useTheme();
  const messages = useGroupMessages(group.id).data ?? [];
  const send = useSendOfficeMessage();
  const remove = useDeleteMessage();
  const answer = useAnswerJoinRequest();
  const [writing, setWriting] = useState(false);
  const [body, setBody] = useState('');
  const [showAll, setShowAll] = useState(false);
  const requests = group.officers.filter((o) => o.pending);
  const shown = showAll ? messages : messages.slice(0, 2);

  const onSend = async () => {
    await send.mutateAsync([group.id, body]);
    setBody('');
    setWriting(false);
  };

  return (
    <View style={styles.block}>
      {requests.map((r) => (
        <List.Item
          key={r.id}
          title={`${r.name} asks to join`}
          description={r.phone}
          left={(props) => <List.Icon {...props} icon="account-clock-outline" color={theme.colors.primary} />}
          right={() => (
            <View style={styles.row}>
              <Button compact onPress={() => answer.mutate([group.id, r.id, false])}>
                Decline
              </Button>
              <Button compact mode="contained-tonal" onPress={() => answer.mutate([group.id, r.id, true])}>
                Approve
              </Button>
            </View>
          )}
        />
      ))}

      <View style={styles.header}>
        <Text variant="labelLarge">{messages.length === 0 ? 'No messages sent yet' : `Messages (${messages.length})`}</Text>
        <Button compact icon="send" onPress={() => setWriting(true)}>
          Send a message
        </Button>
      </View>
      {shown.map((m) => (
        <List.Item
          key={m.id}
          title={m.body}
          titleNumberOfLines={3}
          description={`${m.senderRole === 'office' ? 'Parish office' : `${m.sender}, ${roleLabel[m.senderRole]}`} · ${sentOn(m.sentAt)}`}
          left={(props) => <List.Icon {...props} icon="message-text-outline" />}
          right={() => <IconButton icon="delete-outline" accessibilityLabel="Delete message" onPress={() => remove.mutate([m.id])} />}
        />
      ))}
      {messages.length > 2 && (
        <Button compact onPress={() => setShowAll(!showAll)} style={styles.left}>
          {showAll ? 'Show fewer' : `Show all ${messages.length}`}
        </Button>
      )}

      <FormDialog visible={writing} title={`Message to ${group.name.en}`} onDismiss={() => setWriting(false)} onSave={() => void onSend()} saving={send.isPending}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {group.kind === 'anbiyam'
            ? 'Every approved member of the families in this Anbiyam receives it, from the parish office.'
            : 'Everyone listed in this group receives it, from the parish office.'}
        </Text>
        <TextInput mode="outlined" multiline numberOfLines={5} label="Message" value={body} onChangeText={setBody} />
        {send.isError && <HelperText type="error">{errorText(send.error.message)}</HelperText>}
      </FormDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 8, gap: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  left: { alignSelf: 'flex-start' },
});
