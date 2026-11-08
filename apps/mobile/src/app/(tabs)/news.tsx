import {
  formatDate,
  formatTime,
  monthName,
  parishDateTime,
  useAnnouncements,
  useEvents,
  type Announcement,
  type ParishEvent,
} from '@parish/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { useNow } from '@/hooks';
import { useLanguage, useLocalized } from '@/i18n';

type Tab = 'announcements' | 'events';

export default function News() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('announcements');
  const announcements = useAnnouncements();
  const events = useEvents();
  const now = useNow();

  return (
    <Screen onRefresh={() => (tab === 'announcements' ? announcements.refetch() : events.refetch())}>
      <SegmentedButtons
        value={tab}
        onValueChange={(value) => setTab(value as Tab)}
        buttons={[
          { value: 'announcements', label: t('news.announcements'), icon: 'bullhorn-outline' },
          { value: 'events', label: t('news.events'), icon: 'calendar' },
        ]}
      />
      {tab === 'announcements' ? (
        <QueryState query={announcements}>
          {(list) =>
            list.length === 0 ? (
              <Text variant="bodyMedium">{t('news.noAnnouncements')}</Text>
            ) : (
              list.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
            )
          }
        </QueryState>
      ) : (
        <QueryState query={events}>
          {(list) => {
            const upcoming = list.filter((e) => Date.parse(e.startsAt) >= now.getTime() - 3 * 3_600_000);
            return upcoming.length === 0 ? (
              <Text variant="bodyMedium">{t('news.noEvents')}</Text>
            ) : (
              upcoming.map((e) => <EventCard key={e.id} event={e} />)
            );
          }}
        </QueryState>
      )}
    </Screen>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const { t } = useTranslation();
  const text = useLocalized();
  const language = useLanguage();
  return (
    <Card mode="elevated" onPress={() => router.push({ pathname: '/announcement/[id]', params: { id: announcement.id } })}>
      <Card.Content style={styles.gap}>
        <View style={styles.meta}>
          {announcement.pinned && (
            <Chip compact icon="pin">
              {t('news.pinned')}
            </Chip>
          )}
          <Text variant="bodySmall">{formatDate(parishDateTime(announcement.publishedAt).date, language)}</Text>
        </View>
        <Text variant="titleMedium">{text(announcement.title)}</Text>
        <Text variant="bodyMedium" numberOfLines={3}>
          {text(announcement.body)}
        </Text>
      </Card.Content>
    </Card>
  );
}

function EventCard({ event }: { event: ParishEvent }) {
  const theme = useTheme();
  const text = useLocalized();
  const language = useLanguage();
  const { date, time } = parishDateTime(event.startsAt);
  return (
    <Card mode="outlined" onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}>
      <Card.Content style={styles.eventRow}>
        <View style={[styles.dateBlock, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer }}>
            {Number(date.slice(8, 10))}
          </Text>
          <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>
            {monthName(date, language)}
          </Text>
        </View>
        <View style={styles.eventText}>
          <Text variant="titleMedium">{text(event.title)}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {[formatDate(date, language), formatTime(time, language), event.place ? text(event.place) : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  dateBlock: { width: 64, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  eventText: { flex: 1, gap: 2 },
});
