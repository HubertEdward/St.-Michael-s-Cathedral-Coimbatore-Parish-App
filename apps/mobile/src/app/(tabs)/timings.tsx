import { addDays, formatDate, parish, parishClock, servicesOn, useServices, weekdayName, weekdayOf } from '@parish/core';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { ServiceLine } from '@/components/ServiceLine';
import { useNow } from '@/hooks';
import { useLanguage } from '@/i18n';

/** The weekly timetable, starting from today. */
export default function Timings() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useLanguage();
  const today = parishClock(useNow()).date;
  const services = useServices();
  const week = Array.from({ length: 7 }, (_, offset) => addDays(today, offset));

  return (
    <Screen onRefresh={() => services.refetch()}>
      <QueryState query={services}>
        {(list) => {
          const others = list.filter((s) => s.kind !== 'mass');
          return (
            <>
              <Text variant="titleLarge">{t('timings.masses')}</Text>
              {week.map((date) => {
                const day = weekdayOf(date);
                const masses = servicesOn(list, day, 'mass');
                const isToday = date === today;
                return (
                  <Card
                    key={date}
                    mode={isToday ? 'contained' : 'outlined'}
                    style={isToday ? { backgroundColor: theme.colors.primaryContainer } : undefined}>
                    <Card.Content style={styles.gap}>
                      <Text variant="titleMedium">
                        {weekdayName(day, language)}
                        {isToday ? ` · ${t('common.today')}` : ''}
                      </Text>
                      {masses.map((s) => (
                        <ServiceLine key={s.id} service={s} />
                      ))}
                    </Card.Content>
                  </Card>
                );
              })}

              <Text variant="titleLarge">{t('timings.otherServices')}</Text>
              {others.length === 0 ? (
                <Notice text={t('timings.otherServicesPending')} icon="clock-alert-outline" />
              ) : (
                <Card mode="outlined">
                  <Card.Content style={styles.gap}>
                    {others.map((s) => (
                      <View key={s.id} style={styles.otherRow}>
                        <Text variant="bodyMedium" style={styles.otherDay}>
                          {weekdayName(s.day, language)}
                        </Text>
                        <ServiceLine service={s} />
                      </View>
                    ))}
                  </Card.Content>
                </Card>
              )}
            </>
          );
        }}
      </QueryState>
      <Notice text={t('timings.lastChecked', { date: formatDate(parish.lastChecked, language) })} icon="calendar-check" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 6 },
  otherRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  otherDay: { width: 112 },
});
