import { churchPhotos, isEvening, parish, parishClock, useAnnouncements, useEvents, useMySubscriptions, useServices } from '@parish/core';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Candle } from '@/components/Candle';
import { Notice } from '@/components/Notice';
import { QueryState } from '@/components/QueryState';
import { ParallaxScreen } from '@/components/design/ParallaxScreen';
import { SectionTitle } from '@/components/design/SectionTitle';
import { FeatureCards } from '@/components/home/FeatureCards';
import { HomeTopBar } from '@/components/home/HomeTopBar';
import { NextMassCard } from '@/components/home/NextMassCard';
import { QuickActions } from '@/components/home/QuickActions';
import { SupportBanner } from '@/components/home/SupportBanner';
import { StoryRow } from '@/components/stories/StoryRow';
import { useNow } from '@/hooks';
import { useLocalized } from '@/i18n';

export default function Home() {
  const { t } = useTranslation();
  const text = useLocalized();
  const clock = parishClock(useNow());
  const services = useServices();
  const announcements = useAnnouncements();
  const events = useEvents();
  const mine = useMySubscriptions();
  const giving = mine.data?.find((s) => s.status !== 'cancelled');
  // In the evening the lit-up church leads; by day, the photos in the profile's order.
  const photos = churchPhotos.map((p) => p.source);
  const images = isEvening(clock) && parish.images.night ? [parish.images.night.source, ...photos] : photos;

  return (
    <ParallaxScreen
      images={images}
      imagePosition="top"
      height={500}
      topBar={<HomeTopBar />}
      eyebrow={t('home.greeting')}
      title={text(parish.name)}
      subtitle={text(parish.place)}
      onRefresh={() => void Promise.all([services.refetch(), announcements.refetch(), events.refetch()])}
      floating={<QueryState query={services}>{(list) => <NextMassCard services={list} />}</QueryState>}>
      <SectionTitle title={t('home.stories')} action={t('common.seeAll')} onAction={() => router.push('/news')} />
      <StoryRow />
      <QuickActions />
      <FeatureCards clock={clock} />
      <Candle />
      <SupportBanner subscription={giving} />
      <Notice text={t('common.preview')} />
    </ParallaxScreen>
  );
}
