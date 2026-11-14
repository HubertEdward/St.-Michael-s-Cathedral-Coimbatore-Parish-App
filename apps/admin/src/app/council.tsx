import { useGroups } from '@parish/core';
import { Button, Card, Text, useTheme } from 'react-native-paper';

import { Page } from '@/components/Page';
import { GroupCard, useGroupEditing } from '@/components/groups/GroupCard';
import { GroupDialog } from '@/components/groups/GroupDialog';
import { OfficerDialog } from '@/components/groups/OfficerDialog';

/** The parish's councils: who sits on them, in which post, and how they came to hold their seat. */
export default function Council() {
  const theme = useTheme();
  const groups = useGroups().data ?? [];
  const { editing, setEditing, adding, setAdding } = useGroupEditing();
  const councils = groups.filter((g) => g.kind === 'council');
  const anbiyams = groups.filter((g) => g.kind === 'anbiyam');

  return (
    <Page
      title="Parish council"
      description="Parishioners see the councils, their office-bearers and their members under Council, Anbiyams and groups."
      actions={
        <Button mode="contained" icon="plus" onPress={() => setEditing('new')}>
          New council or committee
        </Button>
      }>
      <Card mode="contained" style={{ backgroundColor: theme.colors.secondaryContainer }}>
        <Card.Content style={{ gap: 6 }}>
          <Text variant="titleSmall">How the councils are made up</Text>
          <Text variant="bodyMedium">
            The Parish Pastoral Council advises the parish priest on the life and mission of the parish (Canon 536). He presides; the
            assistant priests and a sister of the religious community sit by office; each Anbiyam sends a representative; others are elected
            or nominated by the parish priest, for example from the youth, the associations and catechism. It chooses a vice-president,
            secretary, joint secretary and treasurer, and serves a fixed term.
          </Text>
          <Text variant="bodyMedium">
            The Parish Finance Council (Canon 537) helps the parish priest look after the parish’s property, accounts and budget. Every
            parish must have one. Add committees such as a feast committee in the same way.
          </Text>
        </Card.Content>
      </Card>

      {councils.map((council) => {
        const represented = new Set(council.officers.filter((o) => o.seat === 'anbiyam').map((o) => o.representsId));
        const missing = represented.size > 0 ? anbiyams.filter((a) => !represented.has(a.id)) : [];
        return (
          <GroupCard
            key={council.id}
            group={council}
            groups={groups}
            icon="account-tie-outline"
            onEdit={() => setEditing(council)}
            onAddPerson={() => setAdding(council)}>
            {missing.length > 0 && (
              <Text variant="bodyMedium" style={{ color: theme.colors.error, marginTop: 8 }}>
                {`No representative yet from: ${missing.map((a) => a.name.en).join(', ')}`}
              </Text>
            )}
          </GroupCard>
        );
      })}

      <GroupDialog visible={!!editing} group={editing === 'new' ? undefined : editing} kinds={['council']} onDismiss={() => setEditing(undefined)} />
      <OfficerDialog group={adding} onDismiss={() => setAdding(undefined)} />
    </Page>
  );
}
