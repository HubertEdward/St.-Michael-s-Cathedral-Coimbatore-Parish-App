import { zodResolver } from '@hookform/resolvers/zod';
import {
  formatTime,
  serviceInputSchema,
  servicesOn,
  useDeleteService,
  useSaveService,
  useServices,
  weekdayName,
  type Service,
  type ServiceInput,
  type Weekday,
} from '@stmichaels/core';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';

import { Choice } from '@/components/Choice';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FormDialog } from '@/components/FormDialog';
import { FormField } from '@/components/FormField';
import { Page } from '@/components/Page';
import { errorText } from '@/components/errors';

const days: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const kindLabel = { mass: 'Mass', confession: 'Confession', adoration: 'Adoration', novena: 'Novena' } as const;
const languageLabel = { ta: 'Tamil', en: 'English', ml: 'Malayalam' } as const;
const empty: ServiceInput = { kind: 'mass', day: 0, time: '', language: undefined, place: '', note: '' };

const toInput = (s: Service): ServiceInput => ({
  kind: s.kind,
  day: s.day,
  time: s.time,
  language: s.language,
  place: s.place?.en ?? '',
  note: s.note?.en ?? '',
});

export default function Timetable() {
  const theme = useTheme();
  const services = useServices();
  const save = useSaveService();
  const remove = useDeleteService();
  const [editing, setEditing] = useState<{ id?: string } | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const { control, handleSubmit, reset } = useForm<ServiceInput>({ resolver: zodResolver(serviceInputSchema), defaultValues: empty });

  const open = (service?: Service) => {
    reset(service ? toInput(service) : empty);
    setEditing({ id: service?.id });
  };
  const onSave = handleSubmit(async (values) => {
    await save.mutateAsync([values, editing?.id]);
    setEditing(null);
  });

  return (
    <Page
      title="Mass timetable"
      description="The weekly schedule shown in the app. Times are Coimbatore time, 24-hour."
      actions={
        <Button mode="contained" icon="plus" onPress={() => open()}>
          Add service
        </Button>
      }>
      <View style={styles.grid}>
        {days.map((day) => (
          <Card key={day} mode="outlined" style={styles.day}>
            <Card.Title title={weekdayName(day, 'en')} titleVariant="titleMedium" />
            <Card.Content style={{ gap: 4 }}>
              {servicesOn(services.data ?? [], day).map((s) => (
                <View key={s.id} style={styles.line}>
                  <Text variant="bodyLarge" style={styles.time}>
                    {formatTime(s.time, 'en')}
                  </Text>
                  <Text variant="bodyMedium" style={styles.details}>
                    {[kindLabel[s.kind], s.language && languageLabel[s.language], s.place?.en, s.note?.en].filter(Boolean).join(' · ')}
                  </Text>
                  <IconButton icon="pencil-outline" size={18} accessibilityLabel="Edit" onPress={() => open(s)} />
                  <IconButton icon="delete-outline" size={18} accessibilityLabel="Delete" onPress={() => setDeleting(s)} />
                </View>
              ))}
            </Card.Content>
          </Card>
        ))}
      </View>

      <FormDialog
        visible={!!editing}
        title={editing?.id ? 'Edit service' : 'Add service'}
        onDismiss={() => setEditing(null)}
        onSave={onSave}
        saving={save.isPending}>
        <Controller
          control={control}
          name="kind"
          render={({ field }) => (
            <Choice
              label="Service"
              options={(Object.keys(kindLabel) as (keyof typeof kindLabel)[]).map((k) => ({ value: k, label: kindLabel[k] }))}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="day"
          render={({ field }) => (
            <Choice label="Day" options={days.map((d) => ({ value: d, label: weekdayName(d, 'en') }))} value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="language"
          render={({ field }) => (
            <Choice
              label="Language"
              options={[
                { value: 'none', label: 'Not stated' },
                ...(Object.keys(languageLabel) as (keyof typeof languageLabel)[]).map((l) => ({ value: l, label: languageLabel[l] })),
              ]}
              value={field.value ?? 'none'}
              onChange={(v) => field.onChange(v === 'none' ? undefined : v)}
            />
          )}
        />
        <View style={styles.fields}>
          <FormField grow control={control} name="time" label="Time (HH:mm)" hint="e.g. 06:30 or 17:30" />
          <FormField grow control={control} name="place" label="Place (if not the cathedral)" />
        </View>
        <FormField control={control} name="note" label="Note" />
        {save.isError && <Text style={{ color: theme.colors.error }}>{errorText(save.error.message)}</Text>}
      </FormDialog>

      <ConfirmDialog
        visible={!!deleting}
        message={deleting ? `Delete the ${formatTime(deleting.time, 'en')} ${weekdayName(deleting.day, 'en')} service?` : ''}
        onConfirm={() => deleting && remove.mutate([deleting.id])}
        onDismiss={() => setDeleting(null)}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  day: { flexGrow: 1, flexBasis: 320 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { width: 80, fontWeight: '600' },
  details: { flex: 1 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
