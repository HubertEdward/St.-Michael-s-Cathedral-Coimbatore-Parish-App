import { formatDate, parishDateTime, useAnnouncement } from '@parish/core';
import { useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { useLanguage, useLocalized } from '@/i18n';

export default function AnnouncementDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const text = useLocalized();
  const language = useLanguage();
  const query = useAnnouncement(id);

  return (
    <Screen>
      <QueryState query={query}>
        {(announcement) =>
          !announcement ? (
            <Text variant="bodyLarge">{t('common.notFound')}</Text>
          ) : (
            <>
              <Text variant="bodySmall">{formatDate(parishDateTime(announcement.publishedAt).date, language)}</Text>
              <Text variant="headlineSmall">{text(announcement.title)}</Text>
              <Text variant="bodyLarge" selectable>
                {text(announcement.body)}
              </Text>
              <Button
                mode="outlined"
                icon="share-variant"
                onPress={() => Share.share({ message: `${text(announcement.title)}\n\n${text(announcement.body)}` })}>
                {t('common.share')}
              </Button>
            </>
          )
        }
      </QueryState>
    </Screen>
  );
}
