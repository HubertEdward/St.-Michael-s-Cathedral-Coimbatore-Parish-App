import { zodResolver } from '@hookform/resolvers/zod';
import {
  eventInputSchema,
  formatDate,
  formatTime,
  parishDateTime,
  useDeleteEvent,
  useEvents,
  useSaveEvent,
  type EventInput,
  type ParishEvent,
} from '@stmichaels/core';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Button, Card, IconButton, Text } from 'react-native-paper';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FormDialog } from '@/components/FormDialog';
import { FormField } from '@/components/FormField';
import { Page } from '@/components/Page';

const empty: EventInput = { title: { en: '', ta: '' }, description: { en: '', ta: '' }, date: '', time: '', place: '' };

const toInput = (e: ParishEvent): EventInput => {
  const { date, time } = parishDateTime(e.startsAt);
  return {
    title: { en: e.title.en, ta: e.title.ta ?? '' },
    description: { en: e.description.en, ta: e.description.ta ?? '' },
    date,
    time,
    place: e.place?.en ?? '',
  };
};

export default function Events() {
  const events = useEvents();
  const save = useSaveEvent();
  const remove = useDeleteEvent();
  const [editing, setEditing] = useState<{ id?: string } | null>(null);
  const [deleting, setDeleting] = useState<ParishEvent | null>(null);
  const { control, handleSubmit, reset } = useForm<EventInput>({ resolver: zodResolver(eventInputSchema), defaultValues: empty });

  const open = (e?: ParishEvent) => {
    reset(e ? toInput(e) : empty);
    setEditing({ id: e?.id });
  };
  const onSave = handleSubmit(async (values) => {
    await save.mutateAsync([values, editing?.id]);
    setEditing(null);
  });

  return (
    <Page
      title="Events"
      description="Parish events and feasts shown in the app. Past events are hidden from parishioners automatically."
      actions={
        <Button mode="contained" icon="plus" onPress={() => open()}>
          New event
        </Button>
      }>
      {events.data?.map((e) => {
        const { date, time } = parishDateTime(e.startsAt);
        return (
          <Card key={e.id} mode="outlined">
            <Card.Title
              title={e.title.en}
              subtitle={[formatDate(date, 'en'), date.slice(0, 4), formatTime(time, 'en'), e.place?.en].filter(Boolean).join(' · ')}
              titleVariant="titleMedium"
              right={() => (
                <View style={{ flexDirection: 'row' }}>
                  <IconButton icon="pencil-outline" accessibilityLabel="Edit" onPress={() => open(e)} />
                  <IconButton icon="delete-outline" accessibilityLabel="Delete" onPress={() => setDeleting(e)} />
                </View>
              )}
            />
            <Card.Content>
              <Text variant="bodyMedium" numberOfLines={2}>
                {e.description.en}
              </Text>
            </Card.Content>
          </Card>
        );
      })}

      <FormDialog
        visible={!!editing}
        title={editing?.id ? 'Edit event' : 'New event'}
        onDismiss={() => setEditing(null)}
        onSave={onSave}
        saving={save.isPending}>
        <FormField control={control} name="title.en" label="Title (English)" />
        <FormField control={control} name="title.ta" label="Title (Tamil, optional)" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <FormField grow control={control} name="date" label="Date (YYYY-MM-DD)" />
          <FormField grow control={control} name="time" label="Time (HH:mm)" />
        </View>
        <FormField control={control} name="place" label="Place" />
        <FormField control={control} name="description.en" label="Description (English)" multiline />
        <FormField control={control} name="description.ta" label="Description (Tamil, optional)" multiline />
      </FormDialog>

      <ConfirmDialog
        visible={!!deleting}
        message={`Delete “${deleting?.title.en ?? ''}”?`}
        onConfirm={() => deleting && remove.mutate([deleting.id])}
        onDismiss={() => setDeleting(null)}
      />
    </Page>
  );
}
