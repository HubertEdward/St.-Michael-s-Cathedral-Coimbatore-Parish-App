import { parish, parishClock, prayers, rosaryFor } from '@parish/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Divider, Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { RosaryCounter } from '@/components/RosaryCounter';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/design/Eyebrow';
import { IconBadge } from '@/components/design/IconBadge';
import { Panel } from '@/components/design/Panel';
import { Tap } from '@/components/design/Tap';
import { useLanguage, useLocalized } from '@/i18n';

export default function Prayers() {
  const { t } = useTranslation();
  const theme = useTheme();
  const text = useLocalized();
  const language = useLanguage();
  const rosary = rosaryFor(parishClock().weekday);

  return (
    <Screen>
      <RosaryCounter rosary={rosary} />

      <Eyebrow>{t('more.prayers')}</Eyebrow>
      <Panel style={styles.list}>
        {prayers.map((p, index) => (
          <View key={p.id}>
            {index > 0 && <Divider />}
            <Tap onPress={() => router.push({ pathname: '/prayers/[id]', params: { id: p.id } })} style={styles.row} accessibilityLabel={text(p.title)}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 6, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  title: { flex: 1 },
});
