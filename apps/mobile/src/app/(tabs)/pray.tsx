import { parish, parishClock, prayers, rosaryFor } from '@parish/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Divider, Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Candle } from '@/components/Candle';
import { Notice } from '@/components/Notice';
import { RosaryCounter } from '@/components/RosaryCounter';
import { IconBadge } from '@/components/design/IconBadge';
import { Panel } from '@/components/design/Panel';
import { ParallaxScreen } from '@/components/design/ParallaxScreen';
import { SectionTitle } from '@/components/design/SectionTitle';
import { Tap } from '@/components/design/Tap';
import { useLanguage, useLocalized } from '@/i18n';

/** The prayer corner: today's Rosary bead by bead, a candle to light, and the prayers. */
export default function Pray() {
  const { t } = useTranslation();
  const theme = useTheme();
  const text = useLocalized();
  const language = useLanguage();
  const rosary = rosaryFor(parishClock().weekday);

  return (
    <ParallaxScreen
      images={[parish.images.patron.source]}
      imagePosition="top"
      height={360}
      eyebrow={t('pray.eyebrow')}
      title={t('pray.title')}
      subtitle={t('pray.subtitle')}>
      <RosaryCounter rosary={rosary} />
      <Candle />
      <SectionTitle title={t('more.prayers')} />
      <Panel style={styles.list}>
        {prayers.map((p, index) => (
          <View key={p.id}>
            {index > 0 && <Divider />}
            <Tap
              onPress={() => router.push({ pathname: '/prayers/[id]', params: { id: p.id } })}
              style={styles.row}
              accessibilityLabel={text(p.title)}>
              <IconBadge
                icon={p.id === parish.patronPrayer ? 'shield-cross' : 'book-cross'}
                size={40}
                color={theme.colors.primary}
                background={theme.colors.primaryContainer}
              />
              <Text variant="titleMedium" style={styles.title}>
                {text(p.title)}
              </Text>
              <Icon source="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
            </Tap>
          </View>
        ))}
      </Panel>
      {language === 'ta' && <Notice text={t('prayers.tamilPending')} />}
    </ParallaxScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 6, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  title: { flex: 1 },
});
