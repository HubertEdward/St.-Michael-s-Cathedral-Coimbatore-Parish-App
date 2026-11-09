import { formatRupees, type Subscription } from '@parish/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Display } from '@/components/design/Display';
import { Tap } from '@/components/design/Tap';
import { crimson, gold, radius } from '@/components/design/tokens';
import { useLanguage } from '@/i18n';

/** Invites a monthly offering, or thanks the person who already gives. */
export function SupportBanner({ subscription }: { subscription?: Subscription }) {
  const { t } = useTranslation();
  const language = useLanguage();
  const title = subscription ? t('home.supportThanks') : t('home.supportTitle');
  const body = subscription
    ? t('home.supportAmount', { amount: formatRupees(subscription.amount, language) })
    : t('home.supportBody');
  return (
    <Tap onPress={() => router.navigate('/give')} style={styles.card} accessibilityLabel={title}>
      <LinearGradient colors={crimson} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.icon}>
        <Icon source={subscription ? 'heart' : 'hand-heart'} size={28} color={gold} />
      </View>
      <View style={styles.text}>
        <Display size={24} color="#FFFFFF">
          {title}
        </Display>
        <Text variant="bodyMedium" style={styles.body}>
          {body}
        </Text>
      </View>
      <Icon source="chevron-right" size={28} color={gold} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(226,184,92,0.16)',
  },
  text: { flex: 1, gap: 4 },
  body: { color: 'rgba(255,255,255,0.85)' },
});
