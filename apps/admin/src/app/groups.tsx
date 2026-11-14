import { useGroups, type GroupKind } from '@parish/core';
import { useState } from 'react';
import { Button, SegmentedButtons } from 'react-native-paper';

import { Page } from '@/components/Page';
import { GroupCard, useGroupEditing } from '@/components/groups/GroupCard';
import { GroupDialog } from '@/components/groups/GroupDialog';
import { OfficerDialog } from '@/components/groups/OfficerDialog';

const kinds = ['liturgical', 'association', 'formation'] as const satisfies GroupKind[];
const icon: Record<(typeof kinds)[number], string> = { liturgical: 'church', association: 'account-group-outline', formation: 'book-open-variant' };

/** Ministries, associations and faith formation: add any group, such as the youth wing or children's catechism, and who leads it. */
export default function Groups() {
  const groups = useGroups().data ?? [];
  const [kind, setKind] = useState<(typeof kinds)[number]>('association');
  const { editing, setEditing, adding, setAdding } = useGroupEditing();

  return (
    <Page
      title="Groups and ministries"
      description="Liturgical ministries, associations such as the youth wing or the Legion of Mary, and faith formation such as children’s catechism. Parishioners see each group with its director and office-bearers; liturgical ministries also appear in the duty rosters."
      actions={
        <Button mode="contained" icon="plus" onPress={() => setEditing('new')}>
          New group
        </Button>
      }>
      <SegmentedButtons
        value={kind}
        onValueChange={(v) => setKind(v as typeof kind)}
        buttons={[
          { value: 'liturgical', label: 'Liturgical ministries', icon: icon.liturgical },
          { value: 'association', label: 'Associations', icon: icon.association },
          { value: 'formation', label: 'Faith formation', icon: icon.formation },
        ]}
      />
      {groups
        .filter((g) => g.kind === kind)
        .map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            groups={groups}
            icon={icon[kind]}
            onEdit={() => setEditing(group)}
            onAddPerson={() => setAdding(group)}
          />
        ))}
      <GroupDialog
        visible={!!editing}
        group={editing === 'new' ? undefined : editing}
        kinds={[kind, ...kinds.filter((k) => k !== kind)]}
        onDismiss={() => setEditing(undefined)}
      />
      <OfficerDialog group={adding} onDismiss={() => setAdding(undefined)} />
    </Page>
  );
}
