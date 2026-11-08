import { formatDate, formatTime, parishDateTime, useEvent } from '@stmichaels/core';
import { useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';
import { Button, List, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { useLanguage, useLocalized } from '@/i18n';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const text = useLocalized();
  const language = useLanguage();
  const query = useEvent(id);

  return (
    <Screen>
      <QueryState query={query}>
        {(event) => {
          if (!event) return <Text variant="bodyLarge">{t('common.notFound')}</Text>;
          const { date, time } = parishDateTime(event.startsAt);
          const when = `${formatDate(date, language)} · ${formatTime(time, language)}`;
          return (
            <>
              <Text variant="headlineSmall">{text(event.title)}</Text>
              <List.Item title={when} left={(props) => <List.Icon {...props} icon="calendar-clock" />} />
              {event.place && (
                <List.Item title={text(event.place)} left={(props) => <List.Icon {...props} icon="map-marker-outline" />} />
              )}
              <Text variant="bodyLarge" selectable>
                {text(event.description)}
              </Text>
              <Button
                mode="outlined"
                icon="share-variant"
                onPress={() => Share.share({ message: `${text(event.title)}\n${when}\n\n${text(event.description)}` })}>
                {t('common.share')}
              </Button>
            </>
          );
        }}
      </QueryState>
    </Screen>
  );
}
