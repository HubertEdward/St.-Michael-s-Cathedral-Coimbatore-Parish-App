import { useFamilies, useGroups, useSetFamilyAnbiyam } from '@parish/core';
import { Button, Card, Chip, Text, useTheme } from 'react-native-paper';

import { Choice } from '@/components/Choice';
import { Page } from '@/components/Page';
import { GroupCard, Row, useGroupEditing } from '@/components/groups/GroupCard';
import { GroupDialog } from '@/components/groups/GroupDialog';
import { OfficerDialog } from '@/components/groups/OfficerDialog';

/** Anbiyams (Basic Christian Communities): place each new family in its own, and keep each one's head, secretary and treasurer. */
export default function Anbiyams() {
  const theme = useTheme();
  const groups = useGroups().data ?? [];
  const families = (useFamilies().data ?? []).filter((f) => f.status === 'approved');
  const assign = useSetFamilyAnbiyam();
  const { editing, setEditing, adding, setAdding } = useGroupEditing();
  const anbiyams = groups.filter((g) => g.kind === 'anbiyam');
  const waiting = families.filter((f) => !f.anbiyamId);

  return (
    <Page
      title="Anbiyams"
      description="Each family belongs to the Anbiyam of its neighbourhood. Once a family is taken into the parish, place it in its Anbiyam here; the family then sees its Anbiyam and the head, secretary and treasurer in the app."
      actions={
        <Button mode="contained" icon="plus" onPress={() => setEditing('new')}>
          New Anbiyam
        </Button>
      }>
      <Card mode="outlined" style={waiting.length > 0 ? { borderColor: theme.colors.primary } : undefined}>
        <Card.Title title={`Waiting for an Anbiyam (${waiting.length})`} titleVariant="titleMedium" />
        <Card.Content style={{ gap: 16 }}>
          {waiting.length === 0 && <Text variant="bodyMedium">Every family is in an Anbiyam.</Text>}
          {waiting.map((f) => {
            const preferred = anbiyams.find((a) => a.id === f.preferredAnbiyamId);
            return (
              <Choice
                key={f.id}
                label={`${f.name} (${f.code}), ${f.address}${preferred ? `. The family suggested ${preferred.name.en}.` : ''}`}
                options={anbiyams.map((a) => ({ value: a.id, label: a.id === preferred?.id ? `${a.name.en} (suggested)` : a.name.en }))}
                value={undefined}
                onChange={(id) => assign.mutate([f.id, id])}
              />
            );
          })}
        </Card.Content>
      </Card>

      {anbiyams.map((anbiyam) => {
        const members = families.filter((f) => f.anbiyamId === anbiyam.id);
        return (
          <GroupCard
            key={anbiyam.id}
            group={anbiyam}
            groups={groups}
            icon="home-city-outline"
            onEdit={() => setEditing(anbiyam)}
            onAddPerson={() => setAdding(anbiyam)}>
            <Text variant="labelLarge" style={{ marginTop: 8 }}>
              {`${members.length} ${members.length === 1 ? 'family' : 'families'}`}
            </Text>
            <Row>
              {members.map((f) => (
                <Chip key={f.id} compact icon="home-heart">
                  {`${f.name} · ${f.code}`}
                </Chip>
              ))}
            </Row>
          </GroupCard>
        );
      })}

      <GroupDialog visible={!!editing} group={editing === 'new' ? undefined : editing} kinds={['anbiyam']} onDismiss={() => setEditing(undefined)} />
      <OfficerDialog group={adding} onDismiss={() => setAdding(undefined)} />
    </Page>
  );
}
