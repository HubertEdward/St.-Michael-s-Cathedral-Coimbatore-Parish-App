import {
  formatDate,
  monthName,
  parishDateTime,
  useFamilies,
  useSetFamilyStatus,
  useSetMemberStatus,
  type FamilyMember,
  type FamilyWithMembers,
  type MembershipStatus,
  type Relationship,
} from '@parish/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Chip, Searchbar, SegmentedButtons, Text, useTheme } from 'react-native-paper';

import { Page } from '@/components/Page';

const relationshipLabel: Record<Relationship, string> = {
  head: 'Head of family',
  spouse: 'Spouse',
  son: 'Son',
  daughter: 'Daughter',
  father: 'Father',
  mother: 'Mother',
  sibling: 'Brother or sister',
  other: 'Other relative',
};

const statusLabel: Record<MembershipStatus, string> = { pending: 'Awaiting approval', approved: 'Approved', declined: 'Declined' };

type Tab = 'requests' | 'families';

/** "2 Aug 2026" */
const birthDay = (date: string) => `${Number(date.slice(8, 10))} ${monthName(date, 'en')} ${date.slice(0, 4)}`;

const requestedOn = (iso: string) => formatDate(parishDateTime(iso).date, 'en');

/** Family registrations and membership requests from the app, for the parish priest or office to approve; and the family directory. */
export default function Families() {
  const theme = useTheme();
  const families = useFamilies();
  const setFamily = useSetFamilyStatus();
  const setMember = useSetMemberStatus();
  const [tab, setTab] = useState<Tab>('requests');
  const [query, setQuery] = useState('');
  const list = families.data ?? [];

  const newFamilies = list.filter((f) => f.status === 'pending');
  const joinRequests = list
    .filter((f) => f.status === 'approved')
    .flatMap((family) => family.members.filter((m) => m.status === 'pending').map((member) => ({ family, member })));
  const waiting = newFamilies.length + joinRequests.length;

  const directory = list
    .filter((f) => f.status === 'approved')
    .filter((f) => {
      const q = query.trim().toLowerCase();
      return !q || [f.name, f.code, f.address, f.anbiyam ?? '', ...f.members.map((m) => m.name)].some((v) => v.toLowerCase().includes(q));
    });
  const people = directory.reduce((sum, f) => sum + f.members.filter((m) => m.status === 'approved').length, 0);

  return (
    <Page
      title="Families"
      description="Families register in the app and relatives ask to join them. Check each against the parish register, then approve or decline.">
      <View style={styles.row}>
        <Stat value={String(waiting)} label="Waiting for approval" color={theme.colors.primaryContainer} />
        <Stat value={String(list.filter((f) => f.status === 'approved').length)} label="Registered families" color={theme.colors.secondaryContainer} />
        <Stat value={String(people)} label="Approved members" color={theme.colors.tertiaryContainer} />
      </View>

      <SegmentedButtons
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        buttons={[
          { value: 'requests', label: `Requests (${waiting})`, icon: 'account-clock' },
          { value: 'families', label: 'Family directory', icon: 'home-group' },
        ]}
      />

      {tab === 'requests' ? (
        <>
          {waiting === 0 && <Text variant="bodyLarge">No requests are waiting.</Text>}
          {newFamilies.map((family) => {
            const head = family.members.find((m) => m.relationship === 'head');
            return (
              <Card key={family.id} mode="outlined">
                <Card.Title
                  title={`New family · ${family.name}`}
                  subtitle={`Registered ${requestedOn(family.createdAt)} by ${head?.name ?? 'unknown'}${head?.phone ? `, ${head.phone}` : ''}`}
                  titleVariant="titleMedium"
                  left={(props) => <Avatar.Icon {...props} icon="home-plus" />}
                />
                <Card.Content style={styles.gap}>
                  <Text variant="bodyMedium">{family.address}</Text>
                  {family.anbiyam && <Text variant="bodyMedium">Anbiyam: {family.anbiyam}</Text>}
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Family code {family.code} becomes usable once approved.
                  </Text>
                </Card.Content>
                <Card.Actions>
                  <Button onPress={() => setFamily.mutate([family.id, 'declined'])}>Decline</Button>
                  <Button mode="contained" icon="check" onPress={() => setFamily.mutate([family.id, 'approved'])}>
                    Approve family
                  </Button>
                </Card.Actions>
              </Card>
            );
          })}
          {joinRequests.map(({ family, member }) => (
            <JoinRequest key={member.id} family={family} member={member} onDecide={(status) => setMember.mutate([member.id, status])} />
          ))}
        </>
      ) : (
        <>
          <Searchbar placeholder="Search by family, member, code or Anbiyam" value={query} onChangeText={setQuery} />
          {directory.map((family) => (
            <Card key={family.id} mode="outlined">
              <Card.Title
                title={family.name}
                subtitle={`${family.code} · ${family.address}${family.anbiyam ? ` · ${family.anbiyam}` : ''}`}
                titleVariant="titleMedium"
                left={(props) => <Avatar.Icon {...props} icon="home-heart" />}
              />
              <Card.Content style={styles.members}>
                {family.members.map((m) => (
                  <Chip key={m.id} compact icon={m.status === 'pending' ? 'clock-outline' : m.phone ? 'cellphone' : 'account'}>
                    {`${m.name} · ${relationshipLabel[m.relationship]}${m.status === 'pending' ? ' · awaiting approval' : ''}`}
                  </Chip>
                ))}
              </Card.Content>
            </Card>
          ))}
        </>
      )}
    </Page>
  );
}

function JoinRequest({ family, member, onDecide }: { family: FamilyWithMembers; member: FamilyMember; onDecide: (status: MembershipStatus) => void }) {
  const theme = useTheme();
  const head = family.members.find((m) => m.relationship === 'head');
  const how = member.addedBy ? `Added by ${member.addedBy}` : `Asked to join${member.phone ? ` from ${member.phone}` : ''}`;
  return (
    <Card mode="outlined">
      <Card.Title
        title={`${member.name} · ${relationshipLabel[member.relationship]}`}
        subtitle={`${how} on ${requestedOn(member.createdAt)}`}
        titleVariant="titleMedium"
        left={(props) => <Avatar.Icon {...props} icon="account-plus" />}
      />
      <Card.Content style={styles.gap}>
        <Text variant="bodyMedium">
          Wants to join the {family.name} ({family.code}){head ? `, head: ${head.name}` : ''}.
        </Text>
        {member.birthDate && <Text variant="bodyMedium">Date of birth: {birthDay(member.birthDate)}</Text>}
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Status: {statusLabel[member.status]}
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => onDecide('declined')}>Decline</Button>
        <Button mode="contained" icon="check" onPress={() => onDecide('approved')}>
          Approve member
        </Button>
      </Card.Actions>
    </Card>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <Card mode="contained" style={[styles.stat, { backgroundColor: color }]}>
      <Card.Content>
        <Text variant="displaySmall">{value}</Text>
        <Text variant="titleMedium">{label}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  stat: { flexGrow: 1, flexBasis: 220 },
  gap: { gap: 4 },
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
