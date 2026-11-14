import { zodResolver } from '@hookform/resolvers/zod';
import { groupInputSchema, useSaveGroup, type GroupInput, type GroupKind, type ParishGroup } from '@parish/core';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Choice } from '@/components/Choice';
import { FormDialog } from '@/components/FormDialog';
import { FormField } from '@/components/FormField';

import { kindLabel } from './labels';

const toInput = (kind: GroupKind, group?: ParishGroup): GroupInput => ({
  kind: group?.kind ?? kind,
  name: group?.name.en ?? '',
  nameTa: group?.name.ta ?? '',
  description: group?.description.en ?? '',
  descriptionTa: group?.description.ta ?? '',
  area: group?.area?.en ?? '',
  areaTa: group?.area?.ta ?? '',
  meets: group?.meets?.en ?? '',
  meetsTa: group?.meets?.ta ?? '',
  termFrom: group?.term?.from ?? '',
  termTo: group?.term?.to ?? '',
});

interface Props {
  visible: boolean;
  onDismiss: () => void;
  /** The group to edit; a new one when absent. */
  group?: ParishGroup;
  /** The kind of a new group, or the kinds to choose from. */
  kinds: GroupKind[];
}

/** Add or edit a group, with each text in English and (optionally) Tamil. */
export function GroupDialog({ visible, onDismiss, group, kinds }: Props) {
  const save = useSaveGroup();
  const { control, handleSubmit, reset, watch } = useForm<GroupInput>({ resolver: zodResolver(groupInputSchema), defaultValues: toInput(kinds[0]!, group) });
  useEffect(() => {
    if (visible) reset(toInput(kinds[0]!, group));
  }, [visible, group, kinds, reset]);
  const kind = watch('kind');

  const onSave = handleSubmit(async (values) => {
    await save.mutateAsync([values, group?.id]);
    onDismiss();
  });

  const pair = (en: keyof GroupInput, ta: keyof GroupInput, label: string, multiline = false) => (
    <View style={styles.row}>
      <FormField grow control={control} name={en} label={`${label} (English)`} multiline={multiline} />
      <FormField grow control={control} name={ta} label={`${label} (Tamil)`} multiline={multiline} />
    </View>
  );

  return (
    <FormDialog visible={visible} title={group ? `Edit ${group.name.en}` : `New ${kindLabel[kinds[0]!].toLowerCase()}`} onDismiss={onDismiss} onSave={onSave} saving={save.isPending}>
      {kinds.length > 1 && !group && (
        <Controller
          control={control}
          name="kind"
          render={({ field }) => <Choice label="Kind" options={kinds.map((k) => ({ value: k, label: kindLabel[k] }))} value={field.value} onChange={field.onChange} />}
        />
      )}
      {pair('name', 'nameTa', 'Name')}
      {pair('description', 'descriptionTa', 'About it', true)}
      {kind === 'anbiyam' && pair('area', 'areaTa', 'Streets or area')}
      {pair('meets', 'meetsTa', 'When and where it meets')}
      {kind === 'council' && (
        <View style={styles.row}>
          <FormField grow control={control} name="termFrom" label="Term from (YYYY-MM-DD)" />
          <FormField grow control={control} name="termTo" label="Term to (YYYY-MM-DD)" />
        </View>
      )}
    </FormDialog>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
