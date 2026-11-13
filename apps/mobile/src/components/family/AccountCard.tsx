import { useAccount, useMyFamily } from '@parish/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { IconBadge } from '@/components/design/IconBadge';
import { Panel } from '@/components/design/Panel';

import { MembershipPill } from './MembershipPill';

/** On More: your family at a glance, or an invitation to sign in and register it. */
export function AccountCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const account = useAccount();
  const mine = useMyFamily();
  const family = mine.data?.family;

  const title = family ? family.name : account.data ? t('account.finishTitle') : t('account.cardTitle');
  const body = family
    ? `${family.code} · ${t('account.members', { count: family.members.length })}`
    : account.data
      ? t('account.finishBody')
      : t('account.cardBody');

  return (
    <Panel onPress={() => router.push(account.data ? '/account' : '/account/sign-in')} accessibilityLabel={title} style={styles.row}>
      <IconBadge icon={family ? 'home-heart' : 'account-circle'} size={52} color={theme.colors.onPrimary} background={theme.colors.primary} />
      <View style={styles.text}>
        <Text variant="titleMedium">{title}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {body}
        </Text>
        {family && family.status !== 'approved' && <MembershipPill status={family.status} />}
      </View>
      <Icon source="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  text: { flex: 1, gap: 4 },
});
