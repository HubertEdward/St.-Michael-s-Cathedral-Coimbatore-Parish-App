import { useAccount, useMyFamily, useSignOut, type FamilyMember } from '@parish/core';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { Share, StyleSheet, View } from 'react-native';
import { Button, Divider, Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Display } from '@/components/design/Display';
import { Eyebrow } from '@/components/design/Eyebrow';
import { GradientButton } from '@/components/design/GradientButton';
import { Panel } from '@/components/design/Panel';
import { Tap } from '@/components/design/Tap';
import { crimson, gold, radius } from '@/components/design/tokens';
import { MembershipPill } from '@/components/family/MembershipPill';

const avatarColors = ['#7A1626', '#1E3A66', '#7A5A10', '#1F5A4A', '#5B2A86'];

/** The signed-in person's family: its code to share, its members, and requests still waiting for the office. */
export default function MyFamily() {
  const { t } = useTranslation();
  const theme = useTheme();
  const account = useAccount();
  const mine = useMyFamily();
  const signOut = useSignOut();

  // Wait for fresh answers before redirecting: right after signing in or registering, the cached ones are stale.
  const settling = (query: { isPending: boolean; isFetching: boolean; data: unknown }) => query.isPending || (query.isFetching && !query.data);
  if (settling(account) || settling(mine)) return <Screen>{null}</Screen>;
  if (!account.data) return <Redirect href="/account/sign-in" />;
  if (!mine.data) return <Redirect href="/account/start" />;

  const { family, me } = mine.data;
  const approved = family.status === 'approved' && me.status === 'approved';
  const shareCode = () => void Share.share({ message: t('account.shareMessage', { name: family.name, code: family.code }) });

  return (
    <Screen>
      <View style={styles.card}>
        <LinearGradient colors={crimson} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.watermark}>
          <Icon source="home-heart" size={170} color="rgba(255,255,255,0.06)" />
        </View>
        <View style={styles.cardTop}>
          <Eyebrow color={gold}>{t('account.myFamily')}</Eyebrow>
          <MembershipPill status={family.status} onDark />
        </View>
        <Display size={36} color="#FFFFFF">
          {family.name}
        </Display>
        {family.anbiyam && (
          <Text variant="bodyMedium" style={styles.soft}>
            {family.anbiyam}
          </Text>
        )}
        {family.address !== '' && (
          <Text variant="bodyMedium" style={styles.soft}>
            {family.address}
          </Text>
        )}
        <Tap onPress={shareCode} style={styles.code} accessibilityLabel={t('account.shareCode')}>
          <View>
            <Text variant="labelSmall" style={styles.soft}>
              {t('account.familyCode')}
            </Text>
            <Text variant="titleLarge" style={styles.codeText}>
              {family.code}
            </Text>
          </View>
          <Icon source="share-variant" size={22} color={gold} />
        </Tap>
      </View>

      {family.status === 'pending' && <Notice icon="clock-outline" text={t('account.familyPending')} />}
      {family.status === 'approved' && me.status === 'pending' && <Notice icon="clock-outline" text={t('account.mePending')} />}
      {approved && <Notice icon="account-multiple-plus" text={t('account.codeHint')} />}

      <Panel style={styles.list}>
        <Eyebrow>{t('account.members', { count: family.members.length })}</Eyebrow>
        {family.members.map((member, index) => (
          <View key={member.id}>
            {index > 0 && <Divider />}
            <MemberRow member={member} isMe={member.id === me.id} color={avatarColors[index % avatarColors.length]} />
          </View>
        ))}
      </Panel>

      {approved && <GradientButton label={t('account.addMember')} icon="account-plus" onPress={() => router.push('/account/add-member')} />}

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('account.signedInAs', { phone: account.data.phone })}
        </Text>
        <Button
          icon="logout"
          onPress={async () => {
            await signOut.mutateAsync([]);
            router.replace('/more');
          }}>
          {t('account.signOut')}
        </Button>
      </View>
    </Screen>
  );
}

function MemberRow({ member, isMe, color }: { member: FamilyMember; isMe: boolean; color: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const initials = member.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={styles.member}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text variant="titleMedium" style={styles.initials}>
          {initials}
        </Text>
      </View>
      <View style={styles.flex}>
        <View style={styles.nameRow}>
          <Text variant="titleMedium">{member.name}</Text>
          {isMe && (
            <View style={[styles.you, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                {t('account.you')}
              </Text>
            </View>
          )}
        </View>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t(`family.relationship.${member.relationship}`)}
          {member.addedBy ? ` · ${t('account.addedBy', { name: member.addedBy })}` : ''}
        </Text>
      </View>
      {member.status !== 'approved' && <MembershipPill status={member.status} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden', padding: 22, gap: 6 },
  watermark: { position: 'absolute', right: -24, bottom: -24 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  soft: { color: 'rgba(255,255,255,0.8)' },
  code: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226,184,92,0.5)',
  },
  codeText: { color: '#FFFFFF', fontWeight: '700', letterSpacing: 2 },
  list: { gap: 0 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontWeight: '700' },
  flex: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  you: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
});
