import { useAccount, useSignOut } from '@parish/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';
import { Display } from '@/components/design/Display';
import { Tap } from '@/components/design/Tap';
import { radius } from '@/components/design/tokens';

/** After signing in without a family: register a new family, or ask to join one. */
export default function Start() {
  const { t } = useTranslation();
  const theme = useTheme();
  const account = useAccount();
  const signOut = useSignOut();

  return (
    <Screen>
      <Display size={34}>{t('account.startTitle')}</Display>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('account.startBody')}
      </Text>
      <Choice
        href="/account/register"
        icon="home-plus"
        colors={['#7A1626', '#C2364C']}
        title={t('account.registerTitle')}
        body={t('account.registerBody')}
      />
      <Choice
        href="/account/join"
        icon="account-multiple-plus"
        colors={['#1E3A66', '#4A72B0']}
        title={t('account.joinTitle')}
        body={t('account.joinBody')}
      />
      <View style={styles.signedIn}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('account.signedInAs', { phone: account.data?.phone ?? '' })}
        </Text>
        <Button
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

function Choice({ href, icon, colors, title, body }: { href: Href; icon: string; colors: readonly [string, string]; title: string; body: string }) {
  const theme = useTheme();
  return (
    <Tap
      onPress={() => router.push(href)}
      accessibilityLabel={title}
      style={[styles.choice, { backgroundColor: theme.dark ? theme.colors.elevation.level2 : '#FFFFFF', borderColor: theme.colors.outlineVariant }]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
        <Icon source={icon} size={30} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.text}>
        <Text variant="titleLarge">{title}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {body}
        </Text>
      </View>
      <Icon source="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  choice: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth },
  icon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 4 },
  signedIn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
});
