import { parish, prayers, type Prayer } from '@parish/core';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Display } from '@/components/design/Display';
import { ParallaxScreen } from '@/components/design/ParallaxScreen';
import { useLanguage, useLocalized } from '@/i18n';

export default function PrayerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const text = useLocalized();
  const prayer = prayers.find((p) => p.id === id);

  if (!prayer) {
    return (
      <Screen>
        <Text variant="bodyLarge">{t('common.notFound')}</Text>
      </Screen>
    );
  }

  // The prayer to the patron opens on the patron's picture.
  if (prayer.id === parish.patronPrayer) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ParallaxScreen
          back
          images={[parish.images.patron.source]}
          imagePosition="top"
          height={460}
          eyebrow={t('about.patron')}
          title={text(prayer.title)}>
          <PrayerText prayer={prayer} />
        </ParallaxScreen>
      </>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: text(prayer.title) }} />
      <Display size={32}>{text(prayer.title)}</Display>
      <PrayerText prayer={prayer} />
    </Screen>
  );
}

function PrayerText({ prayer }: { prayer: Prayer }) {
  const { t } = useTranslation();
  const text = useLocalized();
  const language = useLanguage();
  return (
    <>
      <Text variant="bodyLarge" style={{ fontSize: 20, lineHeight: 34 }} selectable>
        {text(prayer.text)}
      </Text>
      {language === 'ta' && !prayer.text.ta && <Notice text={t('prayers.tamilPending')} />}
    </>
  );
}
