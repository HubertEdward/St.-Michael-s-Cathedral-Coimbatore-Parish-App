import { formatTime, parishClock, toMinutes, upcomingServices, type ParishClock, type Service, type UpcomingService } from '@parish/core';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Display } from '@/components/design/Display';
import { Eyebrow } from '@/components/design/Eyebrow';
import { Panel } from '@/components/design/Panel';
import { Tap } from '@/components/design/Tap';
import { useDayLabel, useNow } from '@/hooks';
import { useLanguage, useLocalized } from '@/i18n';

import { Pulse } from './Pulse';

const DAY_MS = 86_400_000;

/** Minutes from now (at the church) until an upcoming service starts. */
function minutesUntil(upcoming: UpcomingService, clock: ParishClock): number {
  const days = Math.round((Date.parse(upcoming.date) - Date.parse(clock.date)) / DAY_MS);
  return days * 1440 + toMinutes(upcoming.service.time) - clock.minutes;
}

/** The next Mass, large, with a countdown that ticks by the second in the last hour, and the few after it as chips. */
export function NextMassCard({ services }: { services: Service[] }) {
  const now = useNow(1000);
  const clock = parishClock(now);
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useLanguage();
  const text = useLocalized();
  const dayLabel = useDayLabel();
  const [next, ...later] = upcomingServices(services, clock, { limit: 5 });

  if (!next) {
    return (
      <Panel>
        <Eyebrow>{t('home.nextMass')}</Eyebrow>
        <Text variant="bodyLarge">{t('home.noUpcoming')}</Text>
      </Panel>
    );
  }

  const minutes = minutesUntil(next, clock);
  const soon = minutes <= 60;
  const secondsLeft = minutes * 60 - now.getSeconds();
  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const countdown =
    secondsLeft <= 0
      ? t('home.startingNow')
      : minutes <= 60
        ? t('home.inClock', { time: mmss })
        : minutes < 24 * 60
          ? t('home.inHours', { hours: Math.floor(minutes / 60), minutes: minutes % 60 })
          : dayLabel(next.date);
  const details = [
    next.service.language ? t(`service.language.${next.service.language}`) : null,
    next.service.place ? text(next.service.place) : null,
  ].filter(Boolean);

  return (
    <Panel>
      <View style={styles.top}>
        <Eyebrow>{t('home.nextMass')}</Eyebrow>
        <View style={[styles.countdown, { backgroundColor: soon ? theme.colors.primary : theme.colors.primaryContainer }]}>
          {soon && <Pulse color={theme.colors.onPrimary} />}
          <Text variant="labelLarge" style={{ color: soon ? theme.colors.onPrimary : theme.colors.onPrimaryContainer, fontVariant: ['tabular-nums'] }}>
            {countdown}
          </Text>
        </View>
      </View>
      <View style={styles.main}>
        <Display size={52} color={theme.colors.primary} style={styles.time}>
          {formatTime(next.service.time, language)}
        </Display>
        <View style={styles.when}>
          <Text variant="titleMedium">{dayLabel(next.date)}</Text>
          {details.length > 0 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {details.join(' · ')}
            </Text>
          )}
        </View>
      </View>
      {later.length > 0 && (
        <>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('home.laterMasses')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {later.map((u) => (
              <Tap
                key={`${u.date}-${u.service.id}`}
                onPress={() => router.navigate('/timings')}
                style={[styles.chip, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.elevation.level1 }]}>
                <Icon source="clock-outline" size={16} color={theme.colors.primary} />
                <Text variant="labelLarge">
                  {dayLabel(u.date)} · {formatTime(u.service.time, language)}
                </Text>
              </Tap>
            ))}
          </ScrollView>
        </>
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  main: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  time: { fontVariant: ['tabular-nums'] },
  when: { flexShrink: 1, gap: 2 },
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
