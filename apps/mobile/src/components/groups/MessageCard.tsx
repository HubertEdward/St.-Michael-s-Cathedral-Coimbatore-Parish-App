import { formatTime, parishDateTime, type GroupMessage } from '@parish/core';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Panel } from '@/components/design/Panel';
import { useDayLabel } from '@/hooks';
import { useLanguage } from '@/i18n';

interface Props {
  message: GroupMessage;
  /** The group's name, when the list mixes groups. */
  groupName?: string;
  unread?: boolean;
}

/** One message to a group: who sent it, in which post, when, and what it says. */
export function MessageCard({ message, groupName, unread }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useLanguage();
  const dayLabel = useDayLabel();
  const { date, time } = parishDateTime(message.sentAt);
  const role = message.senderRole === 'office' ? null : t(`groups.role.${message.senderRole}`);

  return (
    <Panel style={[styles.card, unread && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
      <View style={styles.top}>
        {groupName ? (
          <Text variant="labelLarge" style={[styles.flex, { color: theme.colors.primary }]}>
            {groupName}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {dayLabel(date)} · {formatTime(time, language)}
        </Text>
      </View>
      <Text variant="bodyLarge">{message.body}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {message.senderRole === 'office' ? t('messages.office') : `${message.sender}, ${role}`}
      </Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
});
