import { parishClock } from '@parish/core';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Tap } from '@/components/design/Tap';
import { gold } from '@/components/design/tokens';
import { languageNames, languages, useLanguage, useLanguageState } from '@/i18n';

/** "Good evening" by the hour at the church, and a one-tap language switch. */
export function HomeTopBar() {
  const { t } = useTranslation();
  const language = useLanguage();
  const { choose } = useLanguageState();
  const { minutes } = parishClock();
  const greeting = minutes < 12 * 60 ? t('home.morning') : minutes < 17 * 60 ? t('home.afternoon') : t('home.evening');
  const other = languages.find((l) => l !== language);
  const icon = minutes < 12 * 60 ? 'weather-sunset-up' : minutes < 17 * 60 ? 'white-balance-sunny' : 'weather-night';

  return (
    <View style={styles.row}>
      <View style={styles.greeting}>
        <Icon source={icon} size={20} color={gold} />
        <Text variant="titleMedium" style={styles.white}>
          {greeting}
        </Text>
      </View>
      {other && (
        <Tap onPress={() => void choose(other)} style={styles.pill} accessibilityLabel={languageNames[other]}>
          <Icon source="translate" size={16} color="#FFFFFF" />
          <Text variant="labelLarge" style={styles.white}>
            {languageNames[other]}
          </Text>
        </Tap>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  white: { color: '#FFFFFF' },
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
