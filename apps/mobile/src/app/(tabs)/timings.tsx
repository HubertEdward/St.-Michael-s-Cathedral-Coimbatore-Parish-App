import {
  addDays,
  formatDate,
  formatTime,
  parish,
  parishClock,
  servicesOn,
  toMinutes,
  useServices,
  weekdayName,
  weekdayOf,
  type Service,
} from '@parish/core';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { Display } from '@/components/design/Display';
import { Eyebrow } from '@/components/design/Eyebrow';
import { Panel } from '@/components/design/Panel';
import { Tap } from '@/components/design/Tap';
import { radius } from '@/components/design/tokens';
import { useNow } from '@/hooks';
import { useLanguage, useLocalized } from '@/i18n';

/** The week ahead: pick a day, see its Masses as large times; confession and adoration below. */
export default function Timings() {
  const { t } = useTranslation();
  const language = useLanguage();
  const clock = parishClock(useNow());
  const services = useServices();
  const week = Array.from({ length: 7 }, (_, offset) => addDays(clock.date, offset));
  const [selected, setSelected] = useState(clock.date);
  const day = week.includes(selected) ? selected : clock.date;

  return (
    <Screen title={t('tabs.timings')} eyebrow={t('timings.eyebrow')} onRefresh={() => services.refetch()}>
      <DayPicker week={week} selected={day} today={clock.date} onSelect={setSelected} />
      <QueryState query={services}>
        {(list) => {
          const masses = servicesOn(list, weekdayOf(day), 'mass');
          const nextId =
            day === clock.date ? masses.find((s) => toMinutes(s.time) > clock.minutes)?.id : undefined;
          const others = list.filter((s) => s.kind !== 'mass');
          return (
            <>
              <Display size={30}>
                {day === clock.date ? t('common.today') : formatDate(day, language)}
              </Display>
              {masses.length === 0 ? (
                <Text variant="bodyLarge">{t('timings.noMass')}</Text>
              ) : (
                <View key={day} style={styles.grid}>
                  {masses.map((s, index) => (
                    <Animated.View key={s.id} entering={FadeIn.duration(200)} style={styles.cell}>
                      <MassTile
                        service={s}
                        next={s.id === nextId}
                        past={day === clock.date && toMinutes(s.time) <= clock.minutes}
                      />
                    </Animated.View>
                  ))}
                </View>
              )}

              <Eyebrow style={styles.section}>{t('timings.otherServices')}</Eyebrow>
              {others.length === 0 ? (
                <Notice text={t('timings.otherServicesPending')} icon="clock-alert-outline" />
              ) : (
                <Panel>
                  {others.map((s) => (
                    <View key={s.id} style={styles.otherRow}>
                      <Text variant="bodyMedium" style={styles.otherDay}>
                        {weekdayName(s.day, language)}
                      </Text>
                      <Text variant="titleMedium">
                        {formatTime(s.time, language)} · {t(`service.kind.${s.kind}`)}
                      </Text>
                    </View>
                  ))}
                </Panel>
              )}
            </>
          );
        }}
      </QueryState>
      <Notice text={t('timings.lastChecked', { date: formatDate(parish.lastChecked, language) })} icon="calendar-check" />
    </Screen>
  );
}

function DayPicker({ week, selected, today, onSelect }: { week: string[]; selected: string; today: string; onSelect: (date: string) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useLanguage();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.days}>
      {week.map((date) => {
        const active = date === selected;
        const name = date === today ? t('common.today') : weekdayName(weekdayOf(date), language).slice(0, language === 'en' ? 3 : undefined);
        return (
          <Tap
            key={date}
            onPress={() => onSelect(date)}
            accessibilityRole="tab"
            selected={active}
            accessibilityLabel={formatDate(date, language)}
            style={[
              styles.day,
              active
                ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                : { backgroundColor: theme.dark ? theme.colors.elevation.level2 : '#FFFFFF', borderColor: theme.colors.outlineVariant },
            ]}>
            <Text variant="labelMedium" numberOfLines={1} style={{ color: active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>
              {name}
            </Text>
            <Text variant="headlineSmall" style={[styles.dayNumber, { color: active ? theme.colors.onPrimary : theme.colors.onSurface }]}>
              {Number(date.slice(8, 10))}
            </Text>
          </Tap>
        );
      })}
    </ScrollView>
  );
}

function MassTile({ service, next, past }: { service: Service; next: boolean; past: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useLanguage();
  const text = useLocalized();
  const details = [service.language ? t(`service.language.${service.language}`) : null, service.place ? text(service.place) : null].filter(Boolean);
  return (
    <Panel
      style={[
        styles.tile,
        next && { borderColor: theme.colors.primary, borderWidth: 2 },
        past && { opacity: 0.5 },
      ]}>
      {next && (
        <View style={[styles.nextBadge, { backgroundColor: theme.colors.primary }]}>
          <Text variant="labelSmall" style={{ color: theme.colors.onPrimary }}>
            {t('home.nextMass')}
          </Text>
        </View>
      )}
      <Display size={34} color={theme.colors.primary}>
        {formatTime(service.time, language)}
      </Display>
      {details.length > 0 ? (
        <View style={styles.detail}>
          <Icon source={service.place ? 'map-marker-outline' : 'translate'} size={16} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flexShrink: 1 }}>
            {details.join(' · ')}
          </Text>
        </View>
      ) : (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('service.kind.mass')}
        </Text>
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -16 },
  days: { paddingHorizontal: 16, gap: 10 },
  day: { width: 64, paddingVertical: 10, borderRadius: radius.tile, borderWidth: 1, alignItems: 'center', gap: 2 },
  dayNumber: { fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { flexGrow: 1, flexBasis: '45%' },
  tile: { gap: 6, minHeight: 112, justifyContent: 'center' },
  nextBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  section: { marginTop: 8 },
  otherRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  otherDay: { width: 112 },
});
