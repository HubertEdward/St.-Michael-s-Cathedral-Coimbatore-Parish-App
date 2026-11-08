import { sacraments } from '@stmichaels/core';
import { router } from 'expo-router';
import { Card, List } from 'react-native-paper';

import { Screen } from '@/components/Screen';
import { useLocalized } from '@/i18n';

export default function Sacraments() {
  const text = useLocalized();
  return (
    <Screen>
      <Card mode="outlined">
        {sacraments.map((s) => (
          <List.Item
            key={s.id}
            title={text(s.name)}
            description={text(s.summary)}
            descriptionNumberOfLines={2}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push({ pathname: '/sacraments/[id]', params: { id: s.id } })}
          />
        ))}
      </Card>
    </Screen>
  );
}
