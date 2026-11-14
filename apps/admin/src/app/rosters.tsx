import { zodResolver } from '@hookform/resolvers/zod';
import {
  addDays,
  formatDate,
  formatTime,
  parishClock,
  rosterInputSchema,
  servicesOn,
  useDeleteRosterEntry,
  useGroups,
  useRoster,
  useSaveRosterEntry,
  useServices,
  weekdayOf,
  type RosterInput,
} from '@parish/core';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, List } from 'react-native-paper';

import { Choice } from '@/components/Choice';
import { FormField } from '@/components/FormField';
import { Page } from '@/components/Page';
import { errorText } from '@/components/errors';

export default function Rosters() {
  const ministries = (useGroups().data ?? []).filter((g) => g.kind === 'liturgical');
  const roster = useRoster();
  const services = useServices();
  const save = useSaveRosterEntry();
  const remove = useDeleteRosterEntry();
  const today = parishClock(new Date()).date;
  const dates = Array.from({ length: 15 }, (_, i) => addDays(today, i));
  const empty: RosterInput = { ministryId: ministries[0]?.id ?? '', date: today, serviceId: '', memberName: '' };
  const { control, handleSubmit, watch, setValue, reset } = useForm<RosterInput>({ resolver: zodResolver(rosterInputSchema), defaultValues: empty });
  const date = watch('date');
  const massesThatDay = servicesOn(services.data ?? [], weekdayOf(date), 'mass');

  const onAdd = handleSubmit(async (values) => {
    await save.mutateAsync([values]);
    reset({ ...values, memberName: '' });
  });

  const upcoming = (roster.data ?? []).filter((e) => e.date >= today);
  const byDate = [...new Set(upcoming.map((e) => e.date))];

  return (
    <Page title="Ministry rosters" description="Who serves at which Mass. Members see their duties in the app.">
      <Card mode="outlined">
        <Card.Title title="Add a duty" titleVariant="titleMedium" />
        <Card.Content style={{ gap: 12 }}>
          <Controller
            control={control}
            name="ministryId"
            render={({ field, fieldState }) => (
              <Choice
                label="Ministry"
                options={ministries.map((m) => ({ value: m.id, label: m.name.en }))}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error && errorText(fieldState.error.message)}
              />
            )}
          />
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <Choice
                label="Date"
                options={dates.map((d) => ({ value: d, label: formatDate(d, 'en') }))}
                value={field.value}
                onChange={(d) => {
                  field.onChange(d);
                  setValue('serviceId', '');
                }}
              />
            )}
          />
          <Controller
            control={control}
            name="serviceId"
            render={({ field, fieldState }) => (
              <Choice
                label="Mass"
                options={massesThatDay.map((s) => ({ value: s.id, label: formatTime(s.time, 'en') }))}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error && errorText(fieldState.error.message)}
              />
            )}
          />
          <View style={styles.addRow}>
            <FormField grow control={control} name="memberName" label="Member’s name" />
            <Button mode="contained" icon="plus" onPress={onAdd} loading={save.isPending} style={{ marginTop: 6 }}>
              Add
            </Button>
          </View>
        </Card.Content>
      </Card>

      {byDate.map((d) => (
        <Card key={d} mode="outlined">
          <Card.Title title={formatDate(d, 'en')} titleVariant="titleMedium" />
          {upcoming
            .filter((e) => e.date === d)
            .map((e) => {
              const service = services.data?.find((s) => s.id === e.serviceId);
              const ministry = ministries.find((m) => m.id === e.ministryId);
              return (
                <List.Item
                  key={e.id}
                  title={e.memberName}
                  description={[service && formatTime(service.time, 'en'), ministry?.name.en].filter(Boolean).join(' · ')}
                  left={(props) => <List.Icon {...props} icon="account-clock-outline" />}
                  right={() => <IconButton icon="delete-outline" accessibilityLabel="Remove" onPress={() => remove.mutate([e.id])} />}
                />
              );
            })}
        </Card>
      ))}
    </Page>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
});
