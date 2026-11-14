import { zodResolver } from '@hookform/resolvers/zod';
import {
  councilSeats,
  groupRoles,
  officerInputSchema,
  useAddOfficer,
  useFamilies,
  useGroups,
  type OfficerInput,
  type ParishGroup,
} from '@parish/core';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Chip, List, Searchbar, Text, useTheme } from 'react-native-paper';

import { Choice } from '@/components/Choice';
import { FormDialog } from '@/components/FormDialog';
import { FormField } from '@/components/FormField';

import { roleLabel, seatLabel } from './labels';

interface Props {
  group: ParishGroup | undefined;
  onDismiss: () => void;
}

/**
 * Give someone a post in a group: pick a registered parishioner (their name and phone come with
 * them), or type the name of someone who is not, such as a priest or a sister.
 */
export function OfficerDialog({ group, onDismiss }: Props) {
  const theme = useTheme();
  const add = useAddOfficer();
  const families = useFamilies().data ?? [];
  const anbiyams = (useGroups().data ?? []).filter((g) => g.kind === 'anbiyam');
  const roles = group ? groupRoles[group.kind] : [];
  const council = group?.kind === 'council';
  const blank = (g: ParishGroup | undefined): OfficerInput => ({
    role: g ? (groupRoles[g.kind][0] ?? 'member') : 'member',
    name: '',
    phone: '',
    seat: g?.kind === 'council' ? 'elected' : undefined,
  });
  const { control, handleSubmit, reset, setValue, watch } = useForm<OfficerInput>({ resolver: zodResolver(officerInputSchema), defaultValues: blank(group) });
  const [query, setQuery] = useState('');
  // A fresh form each time the dialog opens for a group.
  const openFor = group?.id;
  useEffect(() => {
    if (openFor) {
      reset(blank(group));
      setQuery('');
    }
  }, [openFor]);

  const seat = watch('seat');
  const memberId = watch('memberId');

  // Registered parishioners; for an Anbiyam, the people of its own families.
  const people = families
    .filter((f) => f.status === 'approved' && (group?.kind !== 'anbiyam' || f.anbiyamId === group.id))
    .flatMap((f) => f.members.filter((m) => m.status === 'approved').map((m) => ({ member: m, family: f })));
  const q = query.trim().toLowerCase();
  const matches = q ? people.filter(({ member, family }) => `${member.name} ${family.name}`.toLowerCase().includes(q)).slice(0, 6) : [];

  const onSave = handleSubmit(async (values) => {
    if (!group) return;
    await add.mutateAsync([group.id, values]);
    onDismiss();
  });

  return (
    <FormDialog visible={!!group} title={group ? `Add to ${group.name.en}` : ''} onDismiss={onDismiss} onSave={onSave} saving={add.isPending}>
      <Controller
        control={control}
        name="role"
        render={({ field }) => <Choice label="Post" options={roles.map((r) => ({ value: r, label: roleLabel[r] }))} value={field.value} onChange={field.onChange} />}
      />
      {roles.length > 1 && (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Each post except Member has one holder; adding someone to it replaces the current holder.
        </Text>
      )}
      {council && (
        <Controller
          control={control}
          name="seat"
          render={({ field }) => (
            <Choice label="Seat on the council" options={councilSeats.map((s) => ({ value: s, label: seatLabel[s] }))} value={field.value} onChange={field.onChange} />
          )}
        />
      )}
      {council && seat === 'anbiyam' && (
        <Controller
          control={control}
          name="representsId"
          render={({ field }) => (
            <Choice label="Representing" options={anbiyams.map((a) => ({ value: a.id, label: a.name.en }))} value={field.value} onChange={field.onChange} />
          )}
        />
      )}

      <Searchbar placeholder={group?.kind === 'anbiyam' ? 'Find someone in this Anbiyam' : 'Find a parishioner'} value={query} onChangeText={setQuery} />
      {matches.map(({ member, family }) => (
        <List.Item
          key={member.id}
          title={member.name}
          description={`${family.name}${member.phone ? ` · ${member.phone}` : ''}`}
          left={(props) => <List.Icon {...props} icon={member.id === memberId ? 'check-circle' : 'account-outline'} />}
          onPress={() => {
            setValue('name', member.name);
            setValue('phone', member.phone ?? '');
            setValue('memberId', member.id);
            setQuery('');
          }}
        />
      ))}
      {memberId ? (
        <Chip icon="account-check" onClose={() => setValue('memberId', undefined)} style={styles.linked}>
          {`Registered parishioner: ${watch('name')}`}
        </Chip>
      ) : null}
      <View style={styles.row}>
        <View style={styles.grow}>
          <FormField control={control} name="name" label="Name" hint={memberId ? undefined : 'Pick from the search, or type a name'} />
        </View>
        <View style={styles.grow}>
          <FormField control={control} name="phone" label="Phone (optional)" />
        </View>
      </View>
    </FormDialog>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  grow: { flexGrow: 1, flexBasis: 220 },
  linked: { alignSelf: 'flex-start' },
});
