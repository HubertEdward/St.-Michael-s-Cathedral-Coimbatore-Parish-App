import {
  formatDate,
  formatRupees,
  givingPurposes,
  monthlyTotal,
  nextDebitOn,
  parishClock,
  pastDebits,
  useSubscriptions,
  type GivingPurpose,
  type SubscriptionStatus,
} from '@parish/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, DataTable, SegmentedButtons, Text, useTheme } from 'react-native-paper';

import { Page } from '@/components/Page';

const purposeLabel: Record<GivingPurpose, string> = {
  parish: 'Parish needs',
  restoration: 'Cathedral restoration',
  charity: 'Help for the poor',
};

const statusLabel: Record<SubscriptionStatus, string> = { active: 'Active', paused: 'Paused', cancelled: 'Cancelled' };

type Filter = 'current' | 'all';

/** Monthly offerings by UPI AutoPay: who gives, how much, for what, and what the month brings in. */
export default function Subscriptions() {
  const theme = useTheme();
  const subscriptions = useSubscriptions();
  const [filter, setFilter] = useState<Filter>('current');
  const today = parishClock().date;
  const list = subscriptions.data ?? [];
  const active = list.filter((s) => s.status === 'active');
  const shown = list.filter((s) => filter === 'all' || s.status !== 'cancelled');
  const received = list.reduce((sum, s) => sum + pastDebits(s, today).filter((d) => d.slice(0, 7) === today.slice(0, 7)).length * s.amount, 0);

  const statusColor: Record<SubscriptionStatus, string> = {
    active: theme.colors.tertiaryContainer,
    paused: theme.colors.secondaryContainer,
    cancelled: theme.colors.surfaceVariant,
  };

  return (
    <Page
      title="Monthly offerings"
      description="Parishioners who give every month by UPI AutoPay. Demo data: no money moves until the parish's receiving account is set up.">
      <View style={styles.row}>
        <Stat label="Committed each month" value={formatRupees(monthlyTotal(list), 'en')} color={theme.colors.primaryContainer} />
        <Stat label="Active supporters" value={String(active.length)} color={theme.colors.secondaryContainer} />
        <Stat label="Received this month" value={formatRupees(received, 'en')} color={theme.colors.tertiaryContainer} />
      </View>

      <View style={styles.row}>
        {givingPurposes.map((purpose) => (
          <Card key={purpose} mode="outlined" style={styles.purpose}>
            <Card.Content>
              <Text variant="titleMedium">{purposeLabel[purpose]}</Text>
              <Text variant="headlineSmall">{formatRupees(monthlyTotal(list.filter((s) => s.purpose === purpose)), 'en')}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                a month from {active.filter((s) => s.purpose === purpose).length} active
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        buttons={[
          { value: 'current', label: 'Active and paused' },
          { value: 'all', label: 'All, with cancelled' },
        ]}
      />

      <Card mode="outlined">
        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={styles.name}>Supporter</DataTable.Title>
            <DataTable.Title numeric>Amount</DataTable.Title>
            <DataTable.Title style={styles.wide}>For</DataTable.Title>
            <DataTable.Title style={styles.wide}>Next debit</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
          </DataTable.Header>
          {shown.map((s) => (
            <DataTable.Row key={s.id}>
              <DataTable.Cell style={styles.name}>
                <View>
                  <Text variant="bodyMedium">{s.name}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {s.phone}
                  </Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell numeric>{formatRupees(s.amount, 'en')}</DataTable.Cell>
              <DataTable.Cell style={styles.wide}>{purposeLabel[s.purpose]}</DataTable.Cell>
              <DataTable.Cell style={styles.wide}>
                {s.status === 'active' ? formatDate(nextDebitOn(s.debitDay, s.startsOn > today ? s.startsOn : today), 'en') : '—'}
              </DataTable.Cell>
              <DataTable.Cell>
                <Chip compact style={{ backgroundColor: statusColor[s.status] }}>
                  {statusLabel[s.status]}
                </Chip>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card>
    </Page>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card mode="contained" style={[styles.stat, { backgroundColor: color }]}>
      <Card.Content>
        <Text variant="displaySmall">{value}</Text>
        <Text variant="titleMedium">{label}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  stat: { flexGrow: 1, flexBasis: 240 },
  purpose: { flexGrow: 1, flexBasis: 220 },
  name: { flex: 2 },
  wide: { flex: 1.5 },
});
