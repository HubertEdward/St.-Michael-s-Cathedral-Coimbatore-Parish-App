import { officerRoles, useDeleteGroup, useRemoveOfficer, type Officer, type ParishGroup } from '@parish/core';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, HelperText, IconButton, List, Text, useTheme } from 'react-native-paper';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { errorText } from '@/components/errors';

import { dayMonthYear, roleLabel, seatLabel } from './labels';

const byRank = (a: Officer, b: Officer) => officerRoles.indexOf(a.role) - officerRoles.indexOf(b.role);

interface Props {
  group: ParishGroup;
  /** All groups, to name the Anbiyam a council member represents. */
  groups: ParishGroup[];
  icon: string;
  onEdit: () => void;
  onAddPerson: () => void;
  /** Extra content under the office-bearers, e.g. an Anbiyam's families. */
  children?: ReactNode;
}

/** A group in the office app: its details, who holds which post, and buttons to change them. */
export function GroupCard({ group, groups, icon, onEdit, onAddPerson, children }: Props) {
  const theme = useTheme();
  const removeOfficer = useRemoveOfficer();
  const deleteGroup = useDeleteGroup();
  const [confirm, setConfirm] = useState(false);

  const details = [
    group.name.ta,
    group.area?.en && `Area: ${group.area.en}`,
    group.meets?.en && `Meets: ${group.meets.en}`,
    group.term && `Term: ${dayMonthYear(group.term.from)} to ${dayMonthYear(group.term.to)}`,
  ].filter(Boolean);
  const people = [...group.officers].sort(byRank);
  const describe = (o: Officer) => {
    const represents = groups.find((g) => g.id === o.representsId);
    const seat = o.seat === 'anbiyam' && represents ? `Represents ${represents.name.en}` : o.seat ? seatLabel[o.seat] : undefined;
    return [roleLabel[o.role], seat, o.phone].filter(Boolean).join(' · ');
  };

  return (
    <Card mode="outlined">
      <Card.Title
        title={group.name.en}
        subtitle={group.description.en || undefined}
        subtitleNumberOfLines={3}
        titleVariant="titleMedium"
        left={(props) => <Avatar.Icon {...props} icon={icon} />}
        right={(props) => <IconButton {...props} icon="pencil-outline" accessibilityLabel={`Edit ${group.name.en}`} onPress={onEdit} />}
      />
      <Card.Content style={styles.content}>
        {details.map((line) => (
          <Text key={line as string} variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {line}
          </Text>
        ))}
        {people.length === 0 && <Text variant="bodyMedium">No one holds a post yet.</Text>}
        {people.map((o) => (
          <List.Item
            key={o.id}
            title={o.name}
            description={describe(o)}
            left={(props) => <List.Icon {...props} icon={o.role === 'member' ? 'account-outline' : 'account-star-outline'} />}
            right={() => <IconButton icon="close" accessibilityLabel={`Remove ${o.name}`} onPress={() => removeOfficer.mutate([group.id, o.id])} />}
            style={styles.person}
          />
        ))}
        {children}
        {deleteGroup.isError && <HelperText type="error">{errorText(deleteGroup.error?.message)}</HelperText>}
      </Card.Content>
      <Card.Actions>
        <Button icon="delete-outline" onPress={() => setConfirm(true)}>
          Delete
        </Button>
        <Button mode="contained" icon="account-plus" onPress={onAddPerson}>
          Add a person
        </Button>
      </Card.Actions>
      <ConfirmDialog
        visible={confirm}
        message={`Delete ${group.name.en}? Its posts are deleted with it.`}
        onConfirm={() => deleteGroup.mutate([group.id])}
        onDismiss={() => setConfirm(false)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: 2 },
  person: { paddingVertical: 0 },
});

/** Shared state for a page of groups: which one is being edited, and which one is getting a new person. */
export function useGroupEditing() {
  const [editing, setEditing] = useState<ParishGroup | 'new'>();
  const [adding, setAdding] = useState<ParishGroup>();
  return { editing, setEditing, adding, setAdding };
}

export const Row = ({ children }: { children: ReactNode }) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
