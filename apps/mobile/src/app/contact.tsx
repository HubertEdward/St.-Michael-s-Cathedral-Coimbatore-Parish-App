import { parish } from '@parish/core';
import { Button, Card, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';
import { callOffice, emailOffice, openDirections, openWebsite } from '@/components/open';
import { useLocalized } from '@/i18n';

export default function Contact() {
  const { t } = useTranslation();
  const text = useLocalized();
  return (
    <Screen>
      <Card mode="outlined">
        <List.Item
          title={t('contact.address')}
          description={text(parish.address)}
          descriptionNumberOfLines={3}
          left={(props) => <List.Icon {...props} icon="map-marker" />}
          onPress={openDirections}
        />
        <List.Item
          title={t('contact.phone')}
          description={parish.phoneDisplay}
          left={(props) => <List.Icon {...props} icon="phone" />}
          onPress={callOffice}
        />
        <List.Item
          title={t('contact.email')}
          description={parish.email}
          left={(props) => <List.Icon {...props} icon="email-outline" />}
          onPress={emailOffice}
        />
        {parish.website && (
          <List.Item
            title={t('contact.website')}
            description={parish.website.replace(/^https?:\/\//, '')}
            left={(props) => <List.Icon {...props} icon="web" />}
            onPress={openWebsite}
          />
        )}
      </Card>
      <Button mode="contained" icon="map-marker-radius" contentStyle={{ height: 56 }} onPress={openDirections}>
        {t('contact.directions')}
      </Button>
    </Screen>
  );
}
