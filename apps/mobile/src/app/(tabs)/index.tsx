import { formatDate, parish, parishClock, parishDateTime, useAnnouncements, useMySubscriptions, useServices } from '@parish/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { QueryState } from '@/components/QueryState';
import { Panel } from '@/components/design/Panel';
import { ParallaxScreen } from '@/components/design/ParallaxScreen';
import { SectionTitle } from '@/components/design/SectionTitle';
import { FeatureCards } from '@/components/home/FeatureCards';
import { NextMassCard } from '@/components/home/NextMassCard';
import { QuickActions } from '@/components/home/QuickActions';
import { SupportBanner } from '@/components/home/SupportBanner';
import { useNow } from '@/hooks';
import { useLanguage, useLocalized } from '@/i18n';

export default function Home() {
  const { t } = useTranslation();
  const theme = useTheme();
  const text = useLocalized();
  const language = useLanguage();
  const clock = parishClock(useNow());
  const services = useServices();
  const announcements = useAnnouncements();
  const mine = useMySubscriptions();
  const hero = parish.images.church ?? parish.images.patron;
  const giving = mine.data?.find((s) => s.status !== 'cancelled');

  return (
    <ParallaxScreen
      image={hero.source}
      imagePosition="top"
      height={440}
      eyebrow={t('home.greeting')}
      title={text(parish.name)}
      subtitle={text(parish.place)}
      onRefresh={() => void Promise.all([services.refetch(), announcements.refetch()])}
      floating={<QueryState query={services}>{(list) => <NextMassCard services={list} clock={clock} />}</QueryState>}>
      <QuickActions />
      <FeatureCards clock={clock} />
      <SupportBanner subscription={giving} />

      <SectionTitle title={t('home.announcements')} action={t('common.seeAll')} onAction={() => router.navigate('/news')} />
      <QueryState query={announcements}>
        {(list) =>
          list.slice(0, 3).map((a, index) => (
            <Animated.View key={a.id} entering={FadeInDown.delay(index * 90).springify()}>
              <Panel onPress={() => router.push({ pathname: '/announcement/[id]', params: { id: a.id } })}>
                <View style={styles.meta}>
                  {a.pinned && <Icon source="pin" size={16} color={theme.colors.secondary} />}
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatDate(parishDateTime(a.publishedAt).date, language)}
                  </Text>
                </View>
                <Text variant="titleMedium">{text(a.title)}</Text>
                <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant }}>
                  {text(a.body)}
                </Text>
              </Panel>
            </Animated.View>
          ))
        }
      </QueryState>

      <Notice text={t('common.preview')} />
    </ParallaxScreen>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
