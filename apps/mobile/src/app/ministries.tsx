import { ministries, type MinistryKind } from '@parish/core';
import { Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { useLocalized } from '@/i18n';

const kinds: MinistryKind[] = ['liturgical', 'association', 'formation', 'anbiyam'];

export default function Ministries() {
  const { t } = useTranslation();
  const text = useLocalized();
  return (
    <Screen>
      <Notice text={t('ministries.sample')} />
      {kinds.map((kind) => (
        <Card key={kind} mode="outlined">
          <Card.Title title={t(`ministries.kind.${kind}`)} titleVariant="titleMedium" />
          <Card.Content style={{ gap: 12 }}>
            {ministries
              .filter((m) => m.kind === kind)
              .map((m) => (
                <Text key={m.id} variant="bodyMedium">
                  <Text variant="titleSmall">{text(m.name)}</Text>
                  {'\n'}
                  {text(m.description)}
                </Text>
              ))}
          </Card.Content>
        </Card>
      ))}
    </Screen>
  );
}
