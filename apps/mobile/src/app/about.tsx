import { clergy, history, parish } from '@stmichaels/core';
import { Card, List, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { useLocalized } from '@/i18n';

export default function About() {
  const { t } = useTranslation();
  const text = useLocalized();
  return (
    <Screen>
      <Text variant="headlineSmall">{text(parish.name)}</Text>
      <Text variant="bodyLarge">{text(parish.diocese)}</Text>
      <Notice text={t('about.feast')} icon="star-four-points-outline" />

      <Card mode="outlined">
        <Card.Title title={t('about.clergy')} titleVariant="titleMedium" />
        {clergy.map((member) => (
          <List.Item
            key={member.role}
            title={member.name ?? t('about.toBeConfirmed')}
            description={t(`about.role.${member.role}`)}
            titleNumberOfLines={2}
            left={(props) => <List.Icon {...props} icon="account-tie" />}
          />
        ))}
      </Card>

      <Text variant="titleLarge">{text(history.title)}</Text>
      {history.paragraphs.map((paragraph, index) => (
        <Text key={index} variant="bodyLarge">
          {text(paragraph)}
        </Text>
      ))}
    </Screen>
  );
}
