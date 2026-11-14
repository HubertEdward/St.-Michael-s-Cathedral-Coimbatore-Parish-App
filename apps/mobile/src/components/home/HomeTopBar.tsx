import { parishClock, useMyMessages } from '@parish/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Tap } from '@/components/design/Tap';
import { gold, maxTextScale } from '@/components/design/tokens';
import { languageNames, languages, useLanguage, useLanguageState } from '@/i18n';

/** "Good evening" by the hour at the church, and a one-tap language switch. */
export function HomeTopBar() {
  const { t } = useTranslation();
  const language = useLanguage();
  const { choose } = useLanguageState();
  // Null until the person is in the parish; then the bell shows, with the number of new messages.
  const messages = useMyMessages().data;
  const unread = messages?.unread ?? 0;
  const inParish = messages != null;
  const { minutes } = parishClock();
  const greeting = minutes < 12 * 60 ? t('home.morning') : minutes < 17 * 60 ? t('home.afternoon') : t('home.evening');
  const other = languages.find((l) => l !== language);
  const icon = minutes < 12 * 60 ? 'weather-sunset-up' : minutes < 17 * 60 ? 'white-balance-sunny' : 'weather-night';

  return (
    <View style={styles.row}>
      <View style={styles.greeting}>
        <Icon source={icon} size={20} color={gold} />
        <Text variant="titleMedium" numberOfLines={1} maxFontSizeMultiplier={maxTextScale.label} style={styles.greetingText}>
          {greeting}
        </Text>
      </View>
      <View style={styles.actions}>
        {other && (
          <Tap onPress={() => void choose(other)} style={styles.pill} accessibilityLabel={languageNames[other]}>
            <Icon source="translate" size={16} color="#FFFFFF" />
            <Text variant="labelLarge" maxFontSizeMultiplier={maxTextScale.label} style={styles.white}>
              {languageNames[other]}
            </Text>
          </Tap>
        )}
        {inParish && (
          <Tap onPress={() => router.push('/messages')} style={styles.round} accessibilityLabel={unread > 0 ? `${t('messages.title')}, ${t('messages.newCount', { count: unread })}` : t('messages.title')}>
            <Icon source={unread > 0 ? 'bell-ring' : 'bell-outline'} size={22} color="#FFFFFF" />
            {unread > 0 && (
              <View style={styles.badge}>
                <Text variant="labelSmall" maxFontSizeMultiplier={maxTextScale.label} style={styles.badgeText}>
                  {unread > 9 ? '9+' : unread}
                </Text>
              </View>
            )}
          </Tap>
        )}
        <Tap onPress={() => router.push('/account')} style={styles.round} accessibilityLabel={t('account.myFamily')}>
          <Icon source="account-circle-outline" size={22} color="#FFFFFF" />
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  // The greeting gives way (and ends in "…") so the language and account buttons always fit.
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, minWidth: 0 },
  greetingText: { color: '#FFFFFF', flexShrink: 1 },
  white: { color: '#FFFFFF' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#3A0710', fontWeight: '700' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
