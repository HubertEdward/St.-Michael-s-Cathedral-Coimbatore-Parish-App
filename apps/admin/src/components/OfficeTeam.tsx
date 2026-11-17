import { zodResolver } from '@hookform/resolvers/zod';
import {
  officeUserInputSchema,
  useAddOfficeUser,
  useOfficeAccount,
  useOfficeUsers,
  useRemoveOfficeUser,
  type OfficeRole,
  type OfficeUserInput,
} from '@parish/core';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, IconButton, List, Text } from 'react-native-paper';

import { Choice } from './Choice';
import { ConfirmDialog } from './ConfirmDialog';
import { FormDialog } from './FormDialog';
import { FormField } from './FormField';
import { errorText } from './errors';

const roleLabel: Record<OfficeRole, string> = { priest: 'Parish priest', staff: 'Office staff' };

/** Who can sign in to the office app. The parish priest adds and removes people; everyone else sees the list. */
export function OfficeTeam() {
  const me = useOfficeAccount().data;
  const team = useOfficeUsers().data ?? [];
  const remove = useRemoveOfficeUser();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<(typeof team)[number]>();
  const isPriest = me?.role === 'priest';

  return (
    <Card mode="outlined">
      <Card.Title title="Office team" titleVariant="titleMedium" />
      <Card.Content style={styles.content}>
        <Text variant="bodyMedium">
          {isPriest
            ? 'People who can sign in to this office app. Add someone with their phone number; they choose their own PIN the first time they sign in. Office staff can do everything except remove a family from the parish or change this team.'
            : 'People who can sign in to this office app. The parish priest adds and removes them.'}
        </Text>
        {team.map((user) => (
          <List.Item
            key={user.id}
            title={user.id === me?.id ? `${user.name} (you)` : user.name}
            description={`${roleLabel[user.role]} · ${user.phone}${user.hasPin ? '' : ' · has not signed in yet'}`}
            left={(props) => <List.Icon {...props} icon={user.role === 'priest' ? 'account-tie' : 'account'} />}
            right={() =>
              isPriest && user.id !== me?.id ? (
                <IconButton icon="account-remove-outline" accessibilityLabel={`Take ${user.name} off the team`} onPress={() => setRemoving(user)} />
              ) : null
            }
          />
        ))}
        {remove.isError && <HelperText type="error">{errorText(remove.error.message)}</HelperText>}
      </Card.Content>
      {isPriest && (
        <Card.Actions>
          <Button mode="contained" icon="account-plus" onPress={() => setAdding(true)}>
            Add to the team
          </Button>
        </Card.Actions>
      )}
      <AddDialog visible={adding} onDismiss={() => setAdding(false)} />
      <ConfirmDialog
        visible={!!removing}
        message={`Take ${removing?.name} off the office team? They can no longer sign in. Adding them again lets them choose a new PIN.`}
        confirmLabel="Take off the team"
        onConfirm={() => removing && remove.mutate([removing.id])}
        onDismiss={() => setRemoving(undefined)}
      />
    </Card>
  );
}

function AddDialog({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const add = useAddOfficeUser();
  const { control, handleSubmit, reset } = useForm<OfficeUserInput>({
    resolver: zodResolver(officeUserInputSchema),
    defaultValues: { name: '', phone: '', role: 'staff' },
  });
  const close = () => {
    reset();
    add.reset();
    onDismiss();
  };
  const onSave = handleSubmit(async (values) => {
    await add.mutateAsync([values]);
    close();
  });
  return (
    <FormDialog visible={visible} title="Add to the office team" onDismiss={close} onSave={() => void onSave().catch(() => undefined)} saving={add.isPending}>
      <View style={styles.row}>
        <FormField control={control} name="name" label="Name" grow />
        <FormField control={control} name="phone" label="Phone number" keyboardType="phone-pad" grow />
      </View>
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <Choice
            label="Role"
            options={[
              { value: 'staff', label: roleLabel.staff },
              { value: 'priest', label: roleLabel.priest },
            ]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      {add.isError && <HelperText type="error">{errorText(add.error.message)}</HelperText>}
    </FormDialog>
  );
}

const styles = StyleSheet.create({
  content: { gap: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
