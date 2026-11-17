import { zodResolver } from '@hookform/resolvers/zod';
import {
  settingsInputSchema,
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
  return (
    <Page title="Settings">
      <OfficeTeam />
      {settings.data && <IntentionSettings settings={settings.data} />}
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
