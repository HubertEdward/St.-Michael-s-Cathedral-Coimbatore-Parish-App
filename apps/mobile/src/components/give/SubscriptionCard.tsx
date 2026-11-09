import { formatDate, formatRupees, nextDebitOn, parishClock, type Subscription } from '@parish/core';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Display } from '@/components/design/Display';
import { crimson, gold, radius } from '@/components/design/tokens';
import { useLanguage } from '@/i18n';

import { purposeIcons } from './PurposePicker';

/** The monthly offering drawn like a card in a wallet. */
export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const { t } = useTranslation();
  const language = useLanguage();
  const today = parishClock().date;
  const next = nextDebitOn(subscription.debitDay, subscription.startsOn > today ? subscription.startsOn : today);
  const active = subscription.status === 'active';

  return (
    <View style={styles.card}>
      <LinearGradient colors={crimson} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.watermark}>
        <Icon source={purposeIcons[subscription.purpose]} size={180} color="rgba(255,255,255,0.06)" />
      </View>
      <View style={styles.top}>
        <View style={styles.brand}>
          <Icon source="cellphone-check" size={18} color={gold} />
          <Text variant="labelLarge" style={styles.brandText}>
            {t('give.autopay')}
          </Text>
        </View>
        <View style={[styles.status, { backgroundColor: active ? 'rgba(126,217,155,0.22)' : 'rgba(255,255,255,0.18)' }]}>
          <View style={[styles.dot, { backgroundColor: active ? '#7ED99B' : '#FFFFFF' }]} />
          <Text variant="labelMedium" style={styles.white}>
            {t(`give.status.${subscription.status}`)}
          </Text>
        </View>
      </View>
      <View>
        <View style={styles.amountRow}>
          <Display size={56} color="#FFFFFF">
            {formatRupees(subscription.amount, language)}
          </Display>
          <Text variant="titleMedium" style={styles.soft}>
            {t('give.perMonth')}
          </Text>
        </View>
        <Text variant="titleMedium" style={[styles.white, { color: gold }]}>
          {t(`give.purposes.${subscription.purpose}`)}
        </Text>
      </View>
      <View style={styles.bottom}>
        <Text variant="bodyMedium" style={styles.soft}>
          {subscription.name}
        </Text>
        {active && (
          <Text variant="labelLarge" style={styles.white}>
            {t('give.nextDebit', { date: formatDate(next, language) })}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden', padding: 22, gap: 18, minHeight: 220, justifyContent: 'space-between' },
  watermark: { position: 'absolute', right: -30, bottom: -30 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: gold, letterSpacing: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' },
  white: { color: '#FFFFFF' },
  soft: { color: 'rgba(255,255,255,0.78)' },
});
