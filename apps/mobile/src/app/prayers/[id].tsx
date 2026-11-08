import { prayers } from '@stmichaels/core';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { useLanguage, useLocalized } from '@/i18n';

export default function PrayerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const text = useLocalized();
  const language = useLanguage();
  const prayer = prayers.find((p) => p.id === id);

  if (!prayer) {
    return (
      <Screen>
        <Text variant="bodyLarge">{t('common.notFound')}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: text(prayer.title) }} />
      <Text variant="headlineSmall">{text(prayer.title)}</Text>
      <Text variant="bodyLarge" style={{ fontSize: 20, lineHeight: 32 }} selectable>
        {text(prayer.text)}
      </Text>
      {language === 'ta' && !prayer.text.ta && <Notice text={t('prayers.tamilPending')} />}
    </Screen>
  );
}
