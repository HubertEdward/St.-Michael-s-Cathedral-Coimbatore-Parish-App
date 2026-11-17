import { useFamilies, useGroups, useSetFamilyAnbiyam, type FamilyWithMembers, type ParishGroup } from '@parish/core';
import { useState } from 'react';
import { Button, Card, Chip, Dialog, List, Portal, Searchbar, Text, useTheme } from 'react-native-paper';

import { Choice } from '@/components/Choice';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Page } from '@/components/Page';
import { GroupCard, Row, useGroupEditing } from '@/components/groups/GroupCard';
import { GroupDialog } from '@/components/groups/GroupDialog';
import { OfficerDialog } from '@/components/groups/OfficerDialog';

/** Anbiyams (Basic Christian Communities): place each family in the Anbiyam of its home, and keep each one's head, secretary and treasurer. */
export default function Anbiyams() {
  const theme = useTheme();
  const groups = useGroups().data ?? [];
  const families = (useFamilies().data ?? []).filter((f) => f.status === 'approved');
  const assign = useSetFamilyAnbiyam();
  const { editing, setEditing, adding, setAdding } = useGroupEditing();
  const [placing, setPlacing] = useState<ParishGroup>();
  const [takingOut, setTakingOut] = useState<FamilyWithMembers>();
  const anbiyams = groups.filter((g) => g.kind === 'anbiyam');
  const waiting = families.filter((f) => !f.anbiyamId);
  const nameOf = (id: string | undefined) => anbiyams.find((a) => a.id === id)?.name.en;

  return (
    <Page
      title="Anbiyams"
      description="Each family belongs to the Anbiyam of the area its home is in. Place each family in its Anbiyam here, move it when it moves house, or take it out; the family then sees its Anbiyam, its office-bearers and its messages in the app."
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
                label={`Family of ${f.name} (${f.code}), ${f.address}${preferred ? `. The family suggested ${preferred.name.en}.` : ''}`}
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
                <Chip key={f.id} compact icon="home-heart" onClose={() => setTakingOut(f)} closeIcon="close" accessibilityLabel={`Family of ${f.name}`}>
                  {`${f.name} · ${f.code}`}
                </Chip>
              ))}
              <Chip compact icon="home-plus-outline" mode="outlined" onPress={() => setPlacing(anbiyam)}>
                Add a family
              </Chip>
            </Row>
          </GroupCard>
        );
      })}

      <GroupDialog visible={!!editing} group={editing === 'new' ? undefined : editing} kinds={['anbiyam']} onDismiss={() => setEditing(undefined)} />
      <OfficerDialog group={adding} onDismiss={() => setAdding(undefined)} />
      <PlaceFamilyDialog
        anbiyam={placing}
        families={families}
        anbiyamName={nameOf}
        onPick={(family) => placing && assign.mutate([family.id, placing.id])}
        onDismiss={() => setPlacing(undefined)}
      />
      <ConfirmDialog
        visible={!!takingOut}
        message={`Take the family of ${takingOut?.name} out of ${nameOf(takingOut?.anbiyamId)}? It waits for an Anbiyam again, and its members give up any post they held in this one.`}
        confirmLabel="Take out"
        onConfirm={() => takingOut && assign.mutate([takingOut.id, null])}
        onDismiss={() => setTakingOut(undefined)}
      />
    </Page>
  );
}

interface PlaceProps {
  anbiyam: ParishGroup | undefined;
  families: FamilyWithMembers[];
  anbiyamName: (id: string | undefined) => string | undefined;
  onPick: (family: FamilyWithMembers) => void;
  onDismiss: () => void;
}

/** Find a family by its head, a member, its code or its address, and place it in this Anbiyam (moving it from another, if need be). */
function PlaceFamilyDialog({ anbiyam, families, anbiyamName, onPick, onDismiss }: PlaceProps) {
  const [query, setQuery] = useState('');
  const close = () => {
    setQuery('');
    onDismiss();
  };
  const q = query.trim().toLowerCase();
  const candidates = families
    .filter((f) => f.anbiyamId !== anbiyam?.id)
    .filter((f) => !q || [f.name, f.code, f.address, ...f.members.map((m) => m.name)].some((v) => v.toLowerCase().includes(q)))
    .slice(0, 8);

  return (
    <Portal>
      <Dialog visible={!!anbiyam} onDismiss={close} style={{ maxWidth: 560, width: '92%', alignSelf: 'center' }}>
        <Dialog.Title>{`Add a family to ${anbiyam?.name.en ?? ''}`}</Dialog.Title>
        <Dialog.Content style={{ gap: 8 }}>
          {anbiyam?.area && <Text variant="bodyMedium">{`Area: ${anbiyam.area.en}`}</Text>}
          <Searchbar placeholder="Search by family, member, code or address" value={query} onChangeText={setQuery} />
          {candidates.length === 0 && <Text variant="bodyMedium">No other approved family matches.</Text>}
          {candidates.map((f) => {
            const current = anbiyamName(f.anbiyamId);
            return (
              <List.Item
                key={f.id}
                title={`Family of ${f.name} · ${f.code}`}
                description={`${f.address}${current ? ` · now in ${current}; adding moves it here` : ' · waiting for an Anbiyam'}`}
                descriptionNumberOfLines={2}
                left={(props) => <List.Icon {...props} icon={current ? 'home-switch-outline' : 'home-plus-outline'} />}
                onPress={() => {
                  onPick(f);
                  close();
                }}
              />
            );
          })}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={close}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
