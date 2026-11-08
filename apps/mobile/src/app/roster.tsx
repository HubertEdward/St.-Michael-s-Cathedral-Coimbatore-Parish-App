import { formatTime, ministries, parishClock, useRoster, useServices } from '@stmichaels/core';
import { useState } from 'react';
import { Card, List, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ChoiceChips';
import { Notice } from '@/components/Notice';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { useDayLabel } from '@/hooks';
import { useLanguage, useLocalized } from '@/i18n';

/** Upcoming duties for ushers, lectors, servers and choir, filterable by ministry. */
export default function Roster() {
  const { t } = useTranslation();
  const text = useLocalized();
  const language = useLanguage();
  const dayLabel = useDayLabel();
  const roster = useRoster();
  const services = useServices();
  const [ministry, setMinistry] = useState('all');
  const today = parishClock(new Date()).date;

  const options = [
    { value: 'all', label: t('roster.all') },
    ...ministries.filter((m) => m.kind === 'liturgical').map((m) => ({ value: m.id, label: text(m.name) })),
  ];

  return (
    <Screen onRefresh={() => roster.refetch()}>
      <ChoiceChips options={options} value={ministry} onChange={setMinistry} scroll />
      <QueryState query={roster}>
        {(entries) => {
          const shown = entries.filter((e) => e.date >= today && (ministry === 'all' || e.ministryId === ministry));
          if (shown.length === 0) return <Text variant="bodyMedium">{t('roster.empty')}</Text>;
          const dates = [...new Set(shown.map((e) => e.date))];
          return dates.map((date) => (
            <Card key={date} mode="outlined">
              <Card.Title title={dayLabel(date)} titleVariant="titleMedium" />
              {shown
                .filter((e) => e.date === date)
                .map((e) => {
                  const service = services.data?.find((s) => s.id === e.serviceId);
                  const m = ministries.find((x) => x.id === e.ministryId);
                  return (
                    <List.Item
                      key={e.id}
                      title={e.memberName}
                      description={[service ? formatTime(service.time, language) : null, m ? text(m.name) : null]
                        .filter(Boolean)
                        .join(' · ')}
                      left={(props) => <List.Icon {...props} icon="account-clock-outline" />}
                    />
                  );
                })}
            </Card>
          ));
        }}
      </QueryState>
      <Notice text={t('common.preview')} />
    </Screen>
  );
}
