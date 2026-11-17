import { useAnswerJoinRequest, useAskToJoinGroup, useGroupAccess, useSendGroupMessage } from '@parish/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, HelperText, Snackbar, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ChoiceChips';
import { Notice } from '@/components/Notice';
import { Eyebrow } from '@/components/design/Eyebrow';
import { GradientButton } from '@/components/design/GradientButton';
import { Panel } from '@/components/design/Panel';
import { TamilTextInput } from '@/components/tamil/TamilTextInput';
import { finishTamilText } from '@/components/tamil/typingPreferences';
import { translateError } from '@/components/translateError';

import { MessageCard } from './MessageCard';

/**
 * A group's messages and news articles, for its members; for its office-bearers, a box to send one and the requests to
 * join; for other parishioners, a button to ask to join. Shows nothing to anyone not in the parish.
 */
export function GroupMessages({ groupId }: { groupId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const access = useGroupAccess(groupId);
  const send = useSendGroupMessage();
  const join = useAskToJoinGroup();
  const answer = useAnswerJoinRequest();
  const [kind, setKind] = useState<'message' | 'news'>('message');
  const [title, setTitle] = useState('');
  const [needsTitle, setNeedsTitle] = useState(false);
  const [body, setBody] = useState('');
  const [sentTo, setSentTo] = useState<number>();
  const a = access.data;
  if (!a) return null;

  const news = kind === 'news';
  const onSend = async () => {
    if (news && !title.trim()) return setNeedsTitle(true);
    setNeedsTitle(false);
    try {
      await send.mutateAsync([groupId, { title: news ? finishTamilText(title, true) : undefined, body: finishTamilText(body, true) }]);
      setSentTo(a.recipients);
      setTitle('');
      setBody('');
      setKind('message');
    } catch {
      // The error shows under the box.
    }
  };

  return (
    <>
      {a.canJoin &&
        (a.pending ? (
          <Notice icon="clock-outline" text={t('messages.joinPending')} />
        ) : (
          <View style={styles.gap}>
            <GradientButton label={t('messages.join')} icon="account-plus" loading={join.isPending} onPress={() => join.mutate([groupId])} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('messages.joinHint')}
            </Text>
          </View>
        ))}

      {a.post && (
        <Panel style={styles.gap}>
          <Eyebrow>{t('messages.sendTitle')}</Eyebrow>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('messages.sendHint', { role: t(`groups.role.${a.post}`), count: a.recipients })}
          </Text>
          <ChoiceChips
            options={[
              { value: 'message', label: t('messages.kindMessage') },
              { value: 'news', label: t('messages.kindNews') },
            ]}
            value={kind}
            onChange={setKind}
          />
          {news && <TamilTextInput placeholder={t('messages.headline')} value={title} onChangeText={setTitle} />}
          {news && needsTitle && <HelperText type="error">{t('messages.needsHeadline')}</HelperText>}
          <TamilTextInput
            multiline
            numberOfLines={news ? 8 : 4}
            placeholder={news ? t('messages.articlePlaceholder') : t('messages.placeholder')}
            value={body}
            onChangeText={setBody}
          />
          {send.isError && <HelperText type="error">{translateError(t, send.error.message)}</HelperText>}
          <GradientButton label={t('messages.send')} icon="send" loading={send.isPending} disabled={body.trim() === ''} onPress={() => void onSend()} />
        </Panel>
      )}

      {a.requests.length > 0 && (
        <Panel style={styles.gap}>
          <Eyebrow>{t('messages.requests')}</Eyebrow>
          {a.requests.map((r, index) => (
            <View key={r.id}>
              {index > 0 && <Divider />}
              <View style={styles.request}>
                <Text variant="titleMedium" style={styles.flex}>
                  {r.name}
                </Text>
                <Button onPress={() => answer.mutate([groupId, r.id, false])}>{t('messages.decline')}</Button>
                <Button mode="contained" onPress={() => answer.mutate([groupId, r.id, true])}>
                  {t('messages.approve')}
                </Button>
              </View>
            </View>
          ))}
        </Panel>
      )}

      {(a.member || a.post) && (
        <View style={styles.gap}>
          <Eyebrow>{t('messages.groupMessages')}</Eyebrow>
          {a.messages.length === 0 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('messages.noGroupMessages')}
            </Text>
          )}
          {a.messages.map((m) => (
            <MessageCard key={m.id} message={m} />
          ))}
        </View>
      )}

      <Snackbar visible={sentTo !== undefined} onDismiss={() => setSentTo(undefined)} duration={3000}>
        {t('messages.sent', { count: sentTo ?? 0 })}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 10 },
  request: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 120 },
});
