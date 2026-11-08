import { parishClock, prayers, rosaryFor } from '@stmichaels/core';
import { router } from 'expo-router';
import { Card, List, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { useLanguage, useLocalized } from '@/i18n';

export default function Prayers() {
  const { t } = useTranslation();
  const text = useLocalized();
  const language = useLanguage();
  const rosary = rosaryFor(parishClock(new Date()).weekday);

  return (
    <Screen>
      <Card mode="contained">
        <Card.Title
          title={t('prayers.rosary')}
          subtitle={t('prayers.rosaryToday', { name: text(rosary.name) })}
          titleVariant="titleMedium"
          subtitleVariant="bodyMedium"
        />
        <Card.Content style={{ gap: 6 }}>
          {rosary.mysteries.map((mystery, index) => (
            <Text key={mystery} variant="bodyMedium">
              {index + 1}. {mystery}
            </Text>
          ))}
        </Card.Content>
      </Card>

      <Card mode="outlined">
        {prayers.map((p) => (
          <List.Item
            key={p.id}
            title={text(p.title)}
            titleNumberOfLines={2}
            left={(props) => <List.Icon {...props} icon="book-cross" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push({ pathname: '/prayers/[id]', params: { id: p.id } })}
          />
        ))}
      </Card>
      {language === 'ta' && <Notice text={t('prayers.tamilPending')} />}
    </Screen>
  );
}
