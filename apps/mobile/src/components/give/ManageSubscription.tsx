import {
  formatDate,
  formatRupees,
  parishClock,
  pastDebits,
  subscriptionAmountSchema,
  useChangeSubscriptionAmount,
  useSetSubscriptionStatus,
  type Subscription,
} from '@parish/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Divider, Icon, Portal, Text, useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Eyebrow } from '@/components/design/Eyebrow';
import { Panel } from '@/components/design/Panel';
import { translateError } from '@/components/translateError';
import { useLanguage } from '@/i18n';

import { AmountPicker } from './AmountPicker';
import { SubscriptionCard } from './SubscriptionCard';

/** The person's monthly offering: pause or resume it, change the amount, cancel it, see past debits. */
export function ManageSubscription({ subscription }: { subscription: Subscription }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useLanguage();
  const setStatus = useSetSubscriptionStatus();
  const changeAmount = useChangeSubscriptionAmount();
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(subscription.amount);
  const [amountError, setAmountError] = useState<string>();
  const [confirmStop, setConfirmStop] = useState(false);
  const debits = pastDebits(subscription, parishClock().date);
  const active = subscription.status === 'active';

  const saveAmount = async () => {
    const parsed = subscriptionAmountSchema.safeParse(amount);
    if (!parsed.success) {
      setAmountError(translateError(t, parsed.error.issues[0]?.message));
      return;
    }
    await changeAmount.mutateAsync([subscription.id, parsed.data]);
    setAmountError(undefined);
    setEditing(false);
  };

  return (
    <View style={styles.block}>
      <Animated.View entering={FadeIn.duration(500)}>
        <SubscriptionCard subscription={subscription} />
      </Animated.View>

      <View style={styles.actions}>
        <Button
          mode="contained-tonal"
          icon={active ? 'pause' : 'play'}
          style={styles.action}
          contentStyle={styles.actionContent}
          loading={setStatus.isPending}
          onPress={() => setStatus.mutate([subscription.id, active ? 'paused' : 'active'])}>
          {active ? t('give.pause') : t('give.resume')}
        </Button>
        <Button
          mode="outlined"
          icon="pencil"
          style={styles.action}
          contentStyle={styles.actionContent}
          onPress={() => {
            setAmount(subscription.amount);
            setEditing((open) => !open);
          }}>
          {t('give.change')}
        </Button>
      </View>

      {editing && (
        <Animated.View entering={FadeInDown.springify()}>
          <Panel>
            <Eyebrow>{t('give.newAmount')}</Eyebrow>
            <AmountPicker value={amount} onChange={setAmount} error={amountError} />
            <View style={styles.editButtons}>
              <Button onPress={() => setEditing(false)}>{t('give.cancel')}</Button>
              <Button mode="contained" loading={changeAmount.isPending} onPress={saveAmount}>
                {t('give.save')}
              </Button>
            </View>
          </Panel>
        </Animated.View>
      )}

      <Panel>
        <Eyebrow>{t('give.history')}</Eyebrow>
        {debits.length === 0 ? (
          <Text variant="bodyMedium">{t('give.noPayments', { date: formatDate(subscription.startsOn, language) })}</Text>
        ) : (
          debits.map((date, index) => (
            <View key={date}>
              {index > 0 && <Divider />}
              <View style={styles.debit}>
                <Icon source="check-circle" size={22} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.flex}>
                  {formatDate(date, language)}
                </Text>
                <Text variant="titleMedium" style={styles.tabular}>
                  {formatRupees(subscription.amount, language)}
                </Text>
              </View>
            </View>
          ))
        )}
      </Panel>

      <Button textColor={theme.colors.error} onPress={() => setConfirmStop(true)}>
        {t('give.stop')}
      </Button>

      <Portal>
        <Dialog visible={confirmStop} onDismiss={() => setConfirmStop(false)}>
          <Dialog.Title>{t('give.stopTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge">{t('give.stopBody')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmStop(false)}>{t('give.keep')}</Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                setConfirmStop(false);
                setStatus.mutate([subscription.id, 'cancelled']);
              }}>
              {t('give.confirmStop')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
  actionContent: { height: 52 },
  editButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  debit: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});
