import { zodResolver } from '@hookform/resolvers/zod';
import {
  settingsInputSchema,
  useResetDemoData,
  useSettings,
  useUpdateSettings,
  type ParishSettings,
  type SettingsInput,
} from '@parish/core';
import { useForm } from 'react-hook-form';
import { Button, Card, Text } from 'react-native-paper';

import { FormField } from '@/components/FormField';
import { OfficeTeam } from '@/components/OfficeTeam';
import { Page } from '@/components/Page';
import { errorText } from '@/components/errors';

export default function Settings() {
  const settings = useSettings();
  const reset = useResetDemoData();
  return (
    <Page title="Settings">
      <OfficeTeam />
      {settings.data && <IntentionSettings settings={settings.data} />}
      <Card mode="outlined">
        <Card.Title title="Demo data" titleVariant="titleMedium" />
        <Card.Content style={{ gap: 8 }}>
          <Text variant="bodyMedium">
            In this Phase 1 preview, everything you change is saved only in this browser. On the demo page, the parishioner app
            beside this one shares the same data and shows your changes straight away. Across devices, that arrives with the
            backend in Phase 2.
          </Text>
          <Text variant="bodyMedium">Resetting restores the sample timetable, announcements, events and requests.</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined" icon="restore" loading={reset.isPending} onPress={() => reset.mutate()}>
            Reset demo data
          </Button>
        </Card.Actions>
      </Card>
    </Page>
  );
}

/** How long before each Mass the parishioner app stops taking intentions for it. */
function IntentionSettings({ settings }: { settings: ParishSettings }) {
  const update = useUpdateSettings();
  const { control, handleSubmit, formState } = useForm<SettingsInput, unknown, ParishSettings>({
    resolver: zodResolver(settingsInputSchema),
    values: { intentionCutoffMinutes: String(settings.intentionCutoffMinutes) },
  });
  return (
    <Card mode="outlined">
      <Card.Title title="Mass intentions" titleVariant="titleMedium" />
      <Card.Content style={{ gap: 8 }}>
        <Text variant="bodyMedium">
          Parishioners can request an intention for a Mass until this many minutes before it begins. After that, the Mass is no
          longer offered in the app. For example, 60 is one hour and 1440 is one day; 0 keeps intentions open until the Mass starts.
        </Text>
        <FormField control={control} name="intentionCutoffMinutes" label="Close intentions this many minutes before Mass" />
        {update.isError && <Text style={{ color: 'red' }}>{errorText(update.error?.message)}</Text>}
        {update.isSuccess && !formState.isDirty && <Text variant="bodyMedium">Saved.</Text>}
      </Card.Content>
      <Card.Actions>
        <Button
          mode="contained"
          icon="content-save"
          loading={formState.isSubmitting}
          onPress={handleSubmit(async (values) => {
            await update.mutateAsync([values]);
          })}>
          Save
        </Button>
      </Card.Actions>
    </Card>
  );
}
