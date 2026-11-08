import { sacraments } from '@parish/core';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { callOffice } from '@/components/open';
import { useLocalized } from '@/i18n';

export default function SacramentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const text = useLocalized();
  const sacrament = sacraments.find((s) => s.id === id);

  if (!sacrament) {
    return (
      <Screen>
        <Text variant="bodyLarge">{t('common.notFound')}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: text(sacrament.name) }} />
      <Text variant="bodyLarge">{text(sacrament.summary)}</Text>
      <Card mode="outlined">
        <Card.Title title={t('sacraments.steps')} titleVariant="titleMedium" />
        <Card.Content style={{ gap: 8 }}>
          {sacrament.steps.map((step, index) => (
            <Text key={index} variant="bodyMedium">
              {index + 1}. {text(step)}
            </Text>
          ))}
        </Card.Content>
      </Card>
      {sacrament.documents.length > 0 && (
        <Card mode="outlined">
          <Card.Title title={t('sacraments.documents')} titleVariant="titleMedium" />
          <Card.Content style={{ gap: 8 }}>
            {sacrament.documents.map((doc, index) => (
              <Text key={index} variant="bodyMedium">
                • {text(doc)}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}
      <Notice text={t('sacraments.guidance')} />
      <Button mode="contained" icon="phone" contentStyle={{ height: 56 }} onPress={callOffice}>
        {t('sacraments.callOffice')}
      </Button>
    </Screen>
  );
}
