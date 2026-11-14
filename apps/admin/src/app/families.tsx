import {
  formatDate,
  monthName,
  parishDateTime,
  useFamilies,
  useIssuePinReset,
  useGroups,
  useRemoveFamily,
  useSetFamilyAnbiyam,
  removalReasons,
  type RemovalReason,
  useSetFamilyStatus,
  useSetMemberStatus,
  type FamilyMember,
  type FamilyWithMembers,
  type MembershipStatus,
  type Relationship,
} from '@parish/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Chip, Dialog, Portal, Searchbar, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';

import { Choice } from '@/components/Choice';
import { Page } from '@/components/Page';
import { dayMonthYear, removalLabel } from '@/components/groups/labels';

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

type Tab = 'requests' | 'families' | 'left';

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
  const [reset, setReset] = useState<{ member: FamilyMember; code: string; expiresAt: string }>();
  const issueReset = useIssuePinReset();
  const resetPin = async (member: FamilyMember) => setReset({ member, ...(await issueReset.mutateAsync([member.phone!])) });
  const list = families.data ?? [];
  const anbiyams = (useGroups().data ?? []).filter((g) => g.kind === 'anbiyam');
  const anbiyamName = (id: string | undefined) => anbiyams.find((a) => a.id === id)?.name.en;
  const assign = useSetFamilyAnbiyam();
  const removeFamily = useRemoveFamily();
  const [moving, setMoving] = useState<FamilyWithMembers>();
  const [removing, setRemoving] = useState<FamilyWithMembers>();
  const [reason, setReason] = useState<RemovalReason>('movedAway');
  const [note, setNote] = useState('');
  const left = list.filter((f) => f.status === 'removed');

  const newFamilies = list.filter((f) => f.status === 'pending');
  const joinRequests = list
    .filter((f) => f.status === 'approved')
    .flatMap((family) => family.members.filter((m) => m.status === 'pending').map((member) => ({ family, member })));
  const waiting = newFamilies.length + joinRequests.length;

  const directory = list
    .filter((f) => f.status === 'approved')
    .filter((f) => {
      const q = query.trim().toLowerCase();
      return !q || [f.name, f.code, f.address, anbiyamName(f.anbiyamId) ?? '', ...f.members.map((m) => m.name)].some((v) => v.toLowerCase().includes(q));
    });
  const people = directory.reduce((sum, f) => sum + f.members.filter((m) => m.status === 'approved').length, 0);

  return (
    <Page
      title="Families"
      description="Families ask in the app to join the parish, and relatives ask to join their families. Check each against the parish register, then approve or decline. Remove a family that has left the parish, for example after moving out of the area.">
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
          { value: 'left', label: `Left the parish (${left.length})`, icon: 'home-export-outline' },
        ]}
      />

      {tab === 'requests' ? (
        <>
          {waiting === 0 && <Text variant="bodyLarge">No requests are waiting.</Text>}
          {newFamilies.map((family) => (
            <NewFamily
              key={family.id}
              family={family}
              anbiyams={anbiyams.map((a) => ({ value: a.id, label: a.name.en }))}
              onDecline={() => setFamily.mutate([family.id, 'declined'])}
              onApprove={async (anbiyamId) => {
                await setFamily.mutateAsync([family.id, 'approved']);
                if (anbiyamId) await assign.mutateAsync([family.id, anbiyamId]);
              }}
            />
          ))}
          {joinRequests.map(({ family, member }) => (
            <JoinRequest key={member.id} family={family} member={member} onDecide={(status) => setMember.mutate([member.id, status])} />
          ))}
        </>
      ) : tab === 'left' ? (
        <>
          {left.length === 0 && <Text variant="bodyLarge">No family has left the parish.</Text>}
          {left.map((family) => (
            <Card key={family.id} mode="outlined">
              <Card.Title
                title={family.name}
                subtitle={`${family.code} · ${family.address}`}
                titleVariant="titleMedium"
                left={(props) => <Avatar.Icon {...props} icon="home-export-outline" />}
              />
              {family.removal && (
                <Card.Content style={styles.gap}>
                  <Text variant="bodyMedium">
                    {`Removed on ${dayMonthYear(family.removal.on)}: ${removalLabel[family.removal.reason]}${family.removal.note ? `. ${family.removal.note}` : ''}`}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {family.members.map((m) => m.name).join(', ')}
                  </Text>
                </Card.Content>
              )}
              <Card.Actions>
                <Button icon="home-import-outline" onPress={() => setFamily.mutate([family.id, 'approved'])}>
                  Take back into the parish
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </>
      ) : (
        <>
          <Searchbar placeholder="Search by family, member, code or Anbiyam" value={query} onChangeText={setQuery} />
          {directory.map((family) => (
            <Card key={family.id} mode="outlined">
              <Card.Title
                title={family.name}
                subtitle={`${family.code} · ${family.address}`}
                titleVariant="titleMedium"
                left={(props) => <Avatar.Icon {...props} icon="home-heart" />}
              />
              <Card.Content style={styles.members}>
                <Chip compact icon="home-city-outline" mode="outlined" onPress={() => setMoving(family)}>
                  {anbiyamName(family.anbiyamId) ?? 'No Anbiyam yet: place the family'}
                </Chip>
                {family.members.map((m) => (
                  <Chip key={m.id} compact icon={m.status === 'pending' ? 'clock-outline' : m.phone ? 'cellphone' : 'account'}>
                    {`${m.name} · ${relationshipLabel[m.relationship]}${m.status === 'pending' ? ' · awaiting approval' : ''}`}
                  </Chip>
                ))}
              </Card.Content>
              <Card.Actions style={styles.resets}>
                {family.members
                  .filter((m) => m.phone)
                  .map((m) => (
                    <Button key={m.id} compact icon="lock-reset" onPress={() => void resetPin(m)}>
                      {`Reset PIN · ${m.name.split(' ')[0]}`}
                    </Button>
                  ))}
                <Button compact icon="home-export-outline" onPress={() => setRemoving(family)}>
                  Remove from parish
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </>
      )}
      <Portal>
        <Dialog visible={!!moving} onDismiss={() => setMoving(undefined)} style={styles.dialog}>
          <Dialog.Title>{`Anbiyam of the ${moving?.name}`}</Dialog.Title>
          <Dialog.Content>
            <Choice
              options={anbiyams.map((a) => ({ value: a.id, label: a.name.en }))}
              value={moving?.anbiyamId}
              onChange={(id) => {
                if (moving) assign.mutate([moving.id, id]);
                setMoving(undefined);
              }}
            />
          </Dialog.Content>
        </Dialog>
        <Dialog visible={!!removing} onDismiss={() => setRemoving(undefined)} style={styles.dialog}>
          <Dialog.Title>{`Remove the ${removing?.name} from the parish?`}</Dialog.Title>
          <Dialog.Content style={styles.gap}>
            <Text variant="bodyMedium">
              The family keeps its record and code, and appears under Left the parish. It leaves its Anbiyam, and its members leave any
              posts they hold. They see that they are no longer registered and can ask to join again.
            </Text>
            <Choice label="Reason" options={removalReasons.map((r) => ({ value: r, label: removalLabel[r] }))} value={reason} onChange={setReason} />
            <TextInput mode="outlined" dense label="Note (optional), e.g. Moved to Chennai" value={note} onChangeText={setNote} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRemoving(undefined)}>Cancel</Button>
            <Button
              mode="contained"
              icon="home-export-outline"
              onPress={() => {
                if (removing) removeFamily.mutate([removing.id, { reason, note }]);
                setRemoving(undefined);
                setNote('');
              }}>
              Remove family
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={!!reset} onDismiss={() => setReset(undefined)} style={styles.dialog}>
          <Dialog.Icon icon="lock-reset" />
          <Dialog.Title style={styles.center}>Reset code for {reset?.member.name}</Dialog.Title>
          <Dialog.Content style={styles.gap}>
            <Text variant="displayMedium" style={[styles.center, styles.code]}>
              {reset ? `${reset.code.slice(0, 3)} ${reset.code.slice(3)}` : ''}
            </Text>
            <Text variant="bodyMedium">
              Give this code only to {reset?.member.name} in person, or call them back on {reset?.member.phone} before reading it out. They
              enter it in the app under Sign in → Forgot your PIN, with a new PIN of their choice.
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              It works once, until {reset ? parishDateTime(reset.expiresAt).time : ''} tomorrow. A new code replaces this one.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReset(undefined)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Page>
  );
}

/** A family asking to join the parish (or to return to it), with the Anbiyam to place it in once approved. */
function NewFamily({
  family,
  anbiyams,
  onApprove,
  onDecline,
}: {
  family: FamilyWithMembers;
  anbiyams: { value: string; label: string }[];
  onApprove: (anbiyamId: string | undefined) => void;
  onDecline: () => void;
}) {
  const theme = useTheme();
  const head = family.members.find((m) => m.relationship === 'head');
  const [anbiyamId, setAnbiyamId] = useState(family.preferredAnbiyamId);
  const preferred = anbiyams.find((a) => a.value === family.preferredAnbiyamId);
  return (
    <Card mode="outlined">
      <Card.Title
        title={`${family.removal ? 'Returning family' : 'New family'} · ${family.name}`}
        subtitle={`Asked ${requestedOn(family.createdAt)} by ${head?.name ?? 'unknown'}${head?.phone ? `, ${head.phone}` : ''}`}
        titleVariant="titleMedium"
        left={(props) => <Avatar.Icon {...props} icon={family.removal ? 'home-import-outline' : 'home-plus'} />}
      />
      <Card.Content style={styles.gap}>
        <Text variant="bodyMedium">{family.address}</Text>
        {family.removal && (
          <Text variant="bodyMedium">{`Left the parish on ${dayMonthYear(family.removal.on)}: ${removalLabel[family.removal.reason].toLowerCase()}.`}</Text>
        )}
        <Choice
          label={preferred ? `Place in Anbiyam (the family suggested ${preferred.label})` : 'Place in Anbiyam (the family was not sure)'}
          options={anbiyams}
          value={anbiyamId}
          onChange={setAnbiyamId}
        />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Family code {family.code} becomes usable once approved. You can also place the family later under Anbiyams.
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={onDecline}>Decline</Button>
        <Button mode="contained" icon="check" onPress={() => onApprove(anbiyamId)}>
          Approve family
        </Button>
      </Card.Actions>
    </Card>
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
  resets: { flexWrap: 'wrap', justifyContent: 'flex-start' },
  dialog: { maxWidth: 480, alignSelf: 'center' },
  center: { textAlign: 'center' },
  code: { fontVariant: ['tabular-nums'], letterSpacing: 4 },
});
