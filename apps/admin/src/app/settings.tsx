import { useResetDemoData } from '@parish/core';
import { Button, Card, Text } from 'react-native-paper';

import { Page } from '@/components/Page';

export default function Settings() {
  const reset = useResetDemoData();
  return (
    <Page title="Settings">
      <Card mode="outlined">
        <Card.Title title="Demo data" titleVariant="titleMedium" />
        <Card.Content style={{ gap: 8 }}>
          <Text variant="bodyMedium">
            In this Phase 1 preview, everything you change is saved only in this browser. The parishioner app does not see these
            changes until the shared backend arrives in Phase 2.
          </Text>
          <Text variant="bodyMedium">Resetting restores the sample timetable, announcements, events and requests.</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined" icon="restore" loading={reset.isPending} onPress={() => reset.mutate()}>
            Reset demo data
          </Button>
        </Card.Actions>
      </Card>
    </Page>
  );
}
