import {
  formatDate,
  formatRupees,
  formatTime,
  monthlyTotal,
  parishDateTime,
  parishClock,
  upcomingServices,
  useCertificateRequests,
  useEvents,
  useIntentions,
  useServices,
  useSubscriptions,
} from '@parish/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Card, List, Text, useTheme } from 'react-native-paper';

import { Page } from '@/components/Page';

export default function Dashboard() {
  const theme = useTheme();
  const intentions = useIntentions();
  const certificates = useCertificateRequests();
  const services = useServices();
  const events = useEvents();
  const subscriptions = useSubscriptions();
  const now = new Date();
  const newIntentions = intentions.data?.filter((i) => i.status === 'submitted').length ?? 0;
  const newCertificates = certificates.data?.filter((c) => c.status === 'submitted').length ?? 0;
  const nextMasses = services.data ? upcomingServices(services.data, parishClock(now), { limit: 5 }) : [];
  const nextEvents = (events.data ?? []).filter((e) => Date.parse(e.startsAt) >= now.getTime()).slice(0, 5);

  return (
    <Page title="Dashboard" description="What needs attention in the parish office today.">
      <View style={styles.row}>
        <Card mode="contained" style={[styles.stat, { backgroundColor: theme.colors.primaryContainer }]} onPress={() => router.navigate('/intentions')}>
          <Card.Content>
            <Text variant="displaySmall">{newIntentions}</Text>
            <Text variant="titleMedium">New Mass intention requests</Text>
          </Card.Content>
        </Card>
        <Card mode="contained" style={[styles.stat, { backgroundColor: theme.colors.secondaryContainer }]} onPress={() => router.navigate('/certificates')}>
          <Card.Content>
            <Text variant="displaySmall">{newCertificates}</Text>
            <Text variant="titleMedium">New certificate requests</Text>
          </Card.Content>
        </Card>
        <Card mode="contained" style={[styles.stat, { backgroundColor: theme.colors.tertiaryContainer }]} onPress={() => router.navigate('/subscriptions')}>
          <Card.Content>
            <Text variant="displaySmall">{formatRupees(monthlyTotal(subscriptions.data ?? []), 'en')}</Text>
            <Text variant="titleMedium">Monthly offerings committed</Text>
          </Card.Content>
        </Card>
      </View>
      <View style={styles.row}>
        <Card mode="outlined" style={styles.half}>
          <Card.Title title="Next Masses" titleVariant="titleMedium" />
          {nextMasses.map((u) => (
            <List.Item
              key={`${u.date}-${u.service.id}`}
              title={`${formatDate(u.date, 'en')} · ${formatTime(u.service.time, 'en')}`}
              description={u.service.place?.en}
              left={(props) => <List.Icon {...props} icon="church" />}
            />
          ))}
          <Card.Actions>
            <Button onPress={() => router.navigate('/timetable')}>Edit timetable</Button>
          </Card.Actions>
        </Card>
        <Card mode="outlined" style={styles.half}>
          <Card.Title title="Upcoming events" titleVariant="titleMedium" />
          {nextEvents.map((e) => {
            const { date, time } = parishDateTime(e.startsAt);
            return (
              <List.Item
                key={e.id}
                title={e.title.en}
                description={`${formatDate(date, 'en')} · ${formatTime(time, 'en')}`}
                left={(props) => <List.Icon {...props} icon="calendar" />}
              />
            );
          })}
          <Card.Actions>
            <Button onPress={() => router.navigate('/events')}>Manage events</Button>
          </Card.Actions>
        </Card>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  stat: { flexGrow: 1, flexBasis: 260 },
  half: { flexGrow: 1, flexBasis: 360 },
});
