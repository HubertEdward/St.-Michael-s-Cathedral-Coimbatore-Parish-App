import { daysUntil, parish, rosaryFor, type ParishClock } from '@parish/core';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Display } from '@/components/design/Display';
import { Eyebrow } from '@/components/design/Eyebrow';
import { Tap } from '@/components/design/Tap';
import { gold, photoScrim, radius } from '@/components/design/tokens';
import { useLocalized } from '@/i18n';

const WIDTH = 248;
const GAP = 12;

/** Swipeable picture cards: the patron and feast, today's Rosary, a Mass intention. */
export function FeatureCards({ clock }: { clock: ParishClock }) {
  const { t } = useTranslation();
  const text = useLocalized();
  const feastIn = daysUntil(parish.feast.month, parish.feast.day, clock.date);
  const rosary = rosaryFor(clock.weekday);
  const patronHref: Href = parish.patronPrayer
    ? { pathname: '/prayers/[id]', params: { id: parish.patronPrayer } }
    : '/about';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={WIDTH + GAP}
      decelerationRate="fast"
      style={styles.bleed}
      contentContainerStyle={styles.row}>
      <FeatureCard
        href={patronHref}
        eyebrow={feastIn === 0 ? t('home.feastToday') : t('home.feastIn', { count: feastIn })}
        title={text(parish.feast.name)}
        footer={t('home.patronPrayer')}
        background={
          <>
            <Image source={parish.images.patron.source} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill} />
            <LinearGradient colors={photoScrim} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
          </>
        }
      />
      <FeatureCard
        href="/prayers"
        icon="hands-pray"
        eyebrow={t('home.rosaryToday')}
        title={text(rosary.name)}
        footer={t('home.rosaryHint')}
        background={
          <LinearGradient colors={['#14284A', '#2E4F86', '#5B7FB8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        }
      />
      <FeatureCard
        href="/requests/intention"
        icon="candle"
        eyebrow={t('home.intention')}
        title={t('home.intentionTitle')}
        footer={t('home.intentionHint')}
        background={
          <LinearGradient colors={['#3B2A00', '#7A5A10', '#B98E2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        }
      />
    </ScrollView>
  );
}

interface CardProps {
  href: Href;
  eyebrow: string;
  title: string;
  footer: string;
  icon?: string;
  background: ReactNode;
}

function FeatureCard({ href, eyebrow, title, footer, icon, background }: CardProps) {
  return (
    <Tap onPress={() => router.push(href)} style={styles.card} accessibilityLabel={title}>
      {background}
      {icon && (
        <View style={styles.icon}>
          <Icon source={icon} size={30} color={gold} />
        </View>
      )}
      <View style={styles.text}>
        <Eyebrow color={gold}>{eyebrow}</Eyebrow>
        <Display size={28} color="#FFFFFF" numberOfLines={3}>
          {title}
        </Display>
        <View style={styles.footer}>
          <Text variant="labelLarge" style={styles.footerText}>
            {footer}
          </Text>
          <Icon source="arrow-right" size={18} color="#FFFFFF" />
        </View>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -16 },
  row: { paddingHorizontal: 16, gap: GAP },
  card: { width: WIDTH, height: 300, borderRadius: radius.card, overflow: 'hidden', justifyContent: 'flex-end' },
  icon: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  text: { padding: 18, gap: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  footerText: { color: 'rgba(255,255,255,0.9)' },
});
