import {
  addDays,
  formatDate,
  formatTime,
  parishClock,
  useIntentions,
  useServices,
  useSetIntentionStatus,
  type IntentionType,
  type MassIntention,
  type RequestStatus,
  type Service,
} from '@stmichaels/core';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Card, DataTable, SegmentedButtons, Text, useTheme } from 'react-native-paper';

import { Choice } from '@/components/Choice';
import { Page } from '@/components/Page';
import { StatusChip } from '@/components/StatusChip';

const typeLabel: Record<IntentionType, string> = {
  thanksgiving: 'Thanksgiving',
  departed: 'For the departed',
  healing: 'For healing',
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  special: 'Special intention',
};

type Filter = 'submitted' | 'approved' | 'all';

export default function Intentions() {
  const theme = useTheme();
  const intentions = useIntentions();
  const services = useServices();
  const setStatus = useSetIntentionStatus();
  const [filter, setFilter] = useState<Filter>('submitted');
  const serviceOf = (id: string) => services.data?.find((s) => s.id === id);
  const shown = (intentions.data ?? []).filter((i) => filter === 'all' || i.status === filter);

  return (
    <Page title="Mass intentions" description="Approve requests, then print the list the priest reads at each Mass.">
      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        buttons={[
          { value: 'submitted', label: 'New' },
          { value: 'approved', label: 'Approved' },
          { value: 'all', label: 'All' },
        ]}
      />
      <Card mode="outlined">
        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={styles.mass}>Mass</DataTable.Title>
            <DataTable.Title style={styles.wide}>Intention</DataTable.Title>
            <DataTable.Title style={styles.wide}>Requested by</DataTable.Title>
            <DataTable.Title style={styles.status}>Status</DataTable.Title>
            <DataTable.Title style={styles.actions}>Actions</DataTable.Title>
          </DataTable.Header>
          {shown.length === 0 && (
            <View style={[styles.row, { borderColor: theme.colors.outlineVariant }]}>
              <Text variant="bodyMedium">No requests here.</Text>
            </View>
          )}
          {shown.map((i) => {
            const service = serviceOf(i.serviceId);
            return (
              <View key={i.id} style={[styles.row, { borderColor: theme.colors.outlineVariant }]}>
                <View style={[styles.cell, styles.mass]}>
                  <Text variant="bodyMedium">{formatDate(i.massDate, 'en')}</Text>
                  <Text variant="bodySmall">{service ? formatTime(service.time, 'en') : 'Mass removed'}</Text>
                </View>
                <View style={[styles.cell, styles.wide]}>
                  <Text variant="bodyMedium">{i.names}</Text>
                  <Text variant="bodySmall">{typeLabel[i.type]}{i.note ? ` · ${i.note}` : ''}</Text>
                </View>
                <View style={[styles.cell, styles.wide]}>
                  <Text variant="bodyMedium">{i.requesterName}</Text>
                  <Text variant="bodySmall">{i.phone}</Text>
                </View>
                <View style={[styles.cell, styles.status]}>
                  <StatusChip status={i.status} />
                </View>
                <View style={[styles.cell, styles.actions, styles.buttons]}>
                  {nextActions(i.status).map(([status, label]) => (
                    <Button key={status} compact mode={status === 'declined' ? 'text' : 'contained-tonal'} onPress={() => setStatus.mutate([i.id, status])}>
                      {label}
                    </Button>
                  ))}
                </View>
              </View>
            );
          })}
        </DataTable>
      </Card>

      <PriestList intentions={intentions.data ?? []} services={services.data ?? []} />
    </Page>
  );
}

function nextActions(status: RequestStatus): [RequestStatus, string][] {
  switch (status) {
    case 'submitted':
      return [
        ['approved', 'Approve'],
        ['declined', 'Decline'],
      ];
    case 'approved':
      return [['completed', 'Mark offered']];
    default:
      return [];
  }
}

/** The approved intentions for one day, grouped by Mass, ready to print. */
function PriestList({ intentions, services }: { intentions: MassIntention[]; services: Service[] }) {
  const today = parishClock(new Date()).date;
  const [date, setDate] = useState(today);
  const week = Array.from({ length: 8 }, (_, i) => addDays(today, i));
  const approved = intentions.filter((i) => i.massDate === date && i.status === 'approved');
  const masses = services
    .filter((s) => approved.some((i) => i.serviceId === s.id))
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <Card mode="outlined">
      <Card.Title title="Priest’s list" subtitle="Approved intentions for one day" titleVariant="titleMedium" />
      <Card.Content style={{ gap: 12 }}>
        <Choice options={week.map((d) => ({ value: d, label: formatDate(d, 'en') }))} value={date} onChange={setDate} />
        {masses.length === 0 && <Text variant="bodyMedium">No approved intentions for this day.</Text>}
        {masses.map((s) => (
          <View key={s.id} style={{ gap: 4 }}>
            <Text variant="titleSmall">{formatTime(s.time, 'en')} Mass</Text>
            {approved
              .filter((i) => i.serviceId === s.id)
              .map((i) => (
                <Text key={i.id} variant="bodyMedium">
                  • {typeLabel[i.type]}: {i.names}
                </Text>
              ))}
          </View>
        ))}
      </Card.Content>
      {Platform.OS === 'web' && masses.length > 0 && (
        <Card.Actions>
          <Button icon="printer" mode="contained" onPress={() => printList(date, masses, approved)}>
            Print
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function printList(date: string, masses: Service[], approved: MassIntention[]) {
  const sections = masses
    .map(
      (s) =>
        `<h2>${formatTime(s.time, 'en')} Mass</h2><ul>${approved
          .filter((i) => i.serviceId === s.id)
          .map((i) => `<li>${escape(typeLabel[i.type])}: ${escape(i.names)}</li>`)
          .join('')}</ul>`,
    )
    .join('');
  const page = window.open('', '_blank');
  if (!page) return;
  page.document.write(
    `<html><head><title>Mass intentions ${date}</title><style>body{font-family:serif;margin:32px}h1{font-size:22px}h2{font-size:18px;margin-top:24px}li{font-size:16px;margin:6px 0}</style></head><body><h1>St. Michael’s Cathedral · Mass intentions · ${formatDate(date, 'en')} ${date.slice(0, 4)}</h1>${sections}</body></html>`,
  );
  page.document.close();
  page.print();
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth },
  cell: { justifyContent: 'center', paddingRight: 12 },
  mass: { flex: 1.2 },
  wide: { flex: 2 },
  status: { flex: 1 },
  actions: { flex: 2 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', justifyContent: 'flex-start' },
});
