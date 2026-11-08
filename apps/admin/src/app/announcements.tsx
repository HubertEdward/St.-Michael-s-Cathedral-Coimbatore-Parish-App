import { zodResolver } from '@hookform/resolvers/zod';
import {
  announcementInputSchema,
  formatDate,
  parishDateTime,
  useAnnouncements,
  useDeleteAnnouncement,
  useSaveAnnouncement,
  type Announcement,
  type AnnouncementInput,
} from '@stmichaels/core';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Button, Card, Chip, IconButton, Switch, Text } from 'react-native-paper';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FormDialog } from '@/components/FormDialog';
import { FormField } from '@/components/FormField';
import { Page } from '@/components/Page';

const empty: AnnouncementInput = { title: { en: '', ta: '' }, body: { en: '', ta: '' }, pinned: false };

export default function Announcements() {
  const announcements = useAnnouncements();
  const save = useSaveAnnouncement();
  const remove = useDeleteAnnouncement();
  const [editing, setEditing] = useState<{ id?: string } | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const { control, handleSubmit, reset } = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementInputSchema),
    defaultValues: empty,
  });

  const open = (a?: Announcement) => {
    reset(a ? { title: { en: a.title.en, ta: a.title.ta ?? '' }, body: { en: a.body.en, ta: a.body.ta ?? '' }, pinned: a.pinned } : empty);
    setEditing({ id: a?.id });
  };
  const onSave = handleSubmit(async (values) => {
    await save.mutateAsync([values, editing?.id]);
    setEditing(null);
  });

  return (
    <Page
      title="Announcements"
      description="Shown in the app's News tab. Pinned announcements stay on top. Tamil is optional; English is shown when it is empty."
      actions={
        <Button mode="contained" icon="plus" onPress={() => open()}>
          New announcement
        </Button>
      }>
      {announcements.data?.map((a) => (
        <Card key={a.id} mode="outlined">
          <Card.Title
            title={a.title.en}
            subtitle={`${formatDate(parishDateTime(a.publishedAt).date, 'en')}${a.title.ta ? ` · ${a.title.ta}` : ' · No Tamil text'}`}
            titleVariant="titleMedium"
            right={() => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {a.pinned && <Chip compact icon="pin">Pinned</Chip>}
                <IconButton icon="pencil-outline" accessibilityLabel="Edit" onPress={() => open(a)} />
                <IconButton icon="delete-outline" accessibilityLabel="Delete" onPress={() => setDeleting(a)} />
              </View>
            )}
          />
          <Card.Content>
            <Text variant="bodyMedium" numberOfLines={3}>
              {a.body.en}
            </Text>
          </Card.Content>
        </Card>
      ))}

      <FormDialog
        visible={!!editing}
        title={editing?.id ? 'Edit announcement' : 'New announcement'}
        onDismiss={() => setEditing(null)}
        onSave={onSave}
        saving={save.isPending}>
        <FormField control={control} name="title.en" label="Title (English)" />
        <FormField control={control} name="title.ta" label="Title (Tamil, optional)" />
        <FormField control={control} name="body.en" label="Text (English)" multiline />
        <FormField control={control} name="body.ta" label="Text (Tamil, optional)" multiline />
        <Controller
          control={control}
          name="pinned"
          render={({ field }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Switch value={field.value} onValueChange={field.onChange} />
              <Text variant="bodyLarge">Pin to the top</Text>
            </View>
          )}
        />
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
