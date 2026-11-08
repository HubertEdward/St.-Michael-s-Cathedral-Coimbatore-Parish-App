import {
  daysUntil,
  parish,
  parishClock,
  rosaryFor,
  upcomingServices,
  useAnnouncements,
  useServices,
} from '@stmichaels/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { ServiceLine } from '@/components/ServiceLine';
import { callOffice, openDirections } from '@/components/open';
import { useDayLabel, useNow } from '@/hooks';
import { useLocalized } from '@/i18n';

export default function Home() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const text = useLocalized();
  const dayLabel = useDayLabel();
  const now = useNow();
  const services = useServices();
  const announcements = useAnnouncements();
  const feastIn = daysUntil(parish.feast.month, parish.feast.day, now);
  const rosary = rosaryFor(parishClock(now).weekday);

  return (
    <View style={styles.page}>
      <View style={[styles.hero, { backgroundColor: theme.colors.primary, paddingTop: insets.top + 20 }]}>
        <Text variant="titleMedium" style={{ color: theme.colors.onPrimary, opacity: 0.85 }}>
          {t('home.greeting')}
        </Text>
        <Text variant="headlineMedium" style={[styles.heroTitle, { color: theme.colors.onPrimary }]}>
          {text(parish.name)}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onPrimary, opacity: 0.85 }}>
          {text(parish.place)}
        </Text>
      </View>

      <Screen onRefresh={() => Promise.all([services.refetch(), announcements.refetch()])}>
        <Card mode="contained" style={{ backgroundColor: theme.colors.primaryContainer }}>
          <Card.Content style={styles.gap}>
            <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              {t('home.nextMass')}
            </Text>
            <QueryState query={services}>
              {(list) => {
                const [next, ...later] = upcomingServices(list, now, { limit: 4 });
                if (!next) return <Text variant="bodyMedium">{t('home.noUpcoming')}</Text>;
                return (
                  <View style={styles.gap}>
                    <View>
                      <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer }}>
                        {dayLabel(next.date)}
                      </Text>
                      <ServiceLine service={next.service} emphasis />
                    </View>
                    {later.length > 0 && <Divider />}
                    {later.map((u) => (
                      <View key={`${u.date}-${u.service.id}`} style={styles.laterRow}>
                        <Text variant="bodyMedium" style={styles.laterDay}>
                          {dayLabel(u.date)}
                        </Text>
                        <ServiceLine service={u.service} />
                      </View>
                    ))}
                  </View>
                );
              }}
            </QueryState>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => router.navigate('/timings')}>{t('common.seeAll')}</Button>
          </Card.Actions>
        </Card>

        <View style={styles.actions}>
          <Button mode="contained-tonal" icon="phone" style={styles.action} contentStyle={styles.actionContent} onPress={callOffice}>
            {t('home.call')}
          </Button>
          <Button mode="contained-tonal" icon="map-marker" style={styles.action} contentStyle={styles.actionContent} onPress={openDirections}>
            {t('home.directions')}
          </Button>
          <Button
            mode="contained-tonal"
            icon="candle"
            style={styles.action}
            contentStyle={styles.actionContent}
            onPress={() => router.push('/requests/intention')}>
            {t('home.intention')}
          </Button>
          <Button
            mode="contained-tonal"
            icon="hands-pray"
            style={styles.action}
            contentStyle={styles.actionContent}
            onPress={() => router.push('/prayers')}>
            {t('home.prayers')}
          </Button>
        </View>

        <Card mode="outlined">
          <Card.Title
            title={text(parish.feast.name)}
            subtitle={feastIn === 0 ? t('home.feastToday') : t('home.feastIn', { count: feastIn })}
            titleNumberOfLines={2}
            titleVariant="titleMedium"
            subtitleVariant="bodyMedium"
          />
        </Card>

        <Card mode="outlined" onPress={() => router.push('/prayers')}>
          <Card.Title
            title={t('home.rosaryToday')}
            subtitle={text(rosary.name)}
            titleVariant="titleMedium"
            subtitleVariant="bodyMedium"
          />
        </Card>

        <View style={styles.sectionHeader}>
          <Text variant="titleLarge">{t('home.announcements')}</Text>
          <Button onPress={() => router.navigate('/news')}>{t('common.seeAll')}</Button>
        </View>
        <QueryState query={announcements}>
          {(list) =>
            list.slice(0, 3).map((a) => (
              <Card
                key={a.id}
                mode="elevated"
                onPress={() => router.push({ pathname: '/announcement/[id]', params: { id: a.id } })}>
                <Card.Content style={styles.gap}>
                  <Text variant="titleMedium">{text(a.title)}</Text>
                  <Text variant="bodyMedium" numberOfLines={2}>
                    {text(a.body)}
                  </Text>
                </Card.Content>
              </Card>
            ))
          }
        </QueryState>

        <Notice text={t('common.preview')} />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 20, gap: 2 },
  heroTitle: { fontWeight: '700' },
  gap: { gap: 8 },
  laterRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  laterDay: { width: 132 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  action: { flexGrow: 1, flexBasis: '45%' },
  actionContent: { height: 56 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
