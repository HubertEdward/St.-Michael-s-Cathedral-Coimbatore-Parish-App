import { zodResolver } from '@hookform/resolvers/zod';
import {
  officeUserInputSchema,
  formatDate,
  parishDateTime,
  useAddOfficeUser,
  useIssueOfficeCode,
  useOfficeAccount,
  useOfficeUsers,
  useRemoveOfficeUser,
  type OfficeRole,
  type OfficeUserInput,
  type SetupCode,
} from '@parish/core';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, HelperText, IconButton, List, Portal, Text } from 'react-native-paper';

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
  const issue = useIssueOfficeCode();
  // The setup code just made, shown once for the parish priest to pass on.
  const [code, setCode] = useState<SetupCode & { name: string }>();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<(typeof team)[number]>();
  const isPriest = me?.role === 'priest';

  return (
    <Card mode="outlined">
      <Card.Title title="Office team" titleVariant="titleMedium" />
      <Card.Content style={styles.content}>
        <Text variant="bodyMedium">
          {isPriest
            ? 'People who can sign in to this office app. Add someone with their phone number, and give them the setup code shown: they sign in with it once and choose their own PIN. If they forget it, give them a new code with the key button. Office staff can do everything except remove a family from the parish or change this team.'
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
                <View style={styles.actions}>
                  <IconButton
                    icon="key-outline"
                    accessibilityLabel={`New setup code for ${user.name}`}
                    onPress={() => void issue.mutateAsync([user.id]).then((issued) => setCode({ ...issued, name: user.name }))}
                  />
                  <IconButton icon="account-remove-outline" accessibilityLabel={`Take ${user.name} off the team`} onPress={() => setRemoving(user)} />
                </View>
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
      <AddDialog visible={adding} onDismiss={() => setAdding(false)} onAdded={setCode} />
      <CodeDialog code={code} onDismiss={() => setCode(undefined)} />
      <ConfirmDialog
        visible={!!removing}
        message={`Take ${removing?.name} off the office team? They can no longer sign in to the office app.`}
        confirmLabel="Take off the team"
        onConfirm={() => removing && remove.mutate([removing.id])}
        onDismiss={() => setRemoving(undefined)}
      />
    </Card>
  );
}

function AddDialog({ visible, onDismiss, onAdded }: { visible: boolean; onDismiss: () => void; onAdded: (code: SetupCode & { name: string }) => void }) {
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
    const added = await add.mutateAsync([values]);
    close();
    onAdded(added);
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

/** The setup code to pass on, by phone or in person; it is shown only now. */
function CodeDialog({ code, onDismiss }: { code: (SetupCode & { name: string }) | undefined; onDismiss: () => void }) {
  const until = code ? parishDateTime(code.expiresAt) : undefined;
  return (
    <Portal>
      <Dialog visible={!!code} onDismiss={onDismiss} style={{ maxWidth: 480, alignSelf: 'center', width: '90%' }}>
        <Dialog.Title>{`Setup code for ${code?.name ?? ''}`}</Dialog.Title>
        <Dialog.Content style={{ gap: 8 }}>
          <Text variant="displaySmall" selectable style={{ letterSpacing: 6 }}>
            {code?.code}
          </Text>
          <Text variant="bodyMedium">
            {`Give it to them yourself. On the office app's sign-in page they choose "Use a setup code", enter their phone number and this code, and choose their PIN. It works once, until ${until ? `${formatDate(until.date, 'en')}, ${until.time}` : ''}.`}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Done</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row' },
  content: { gap: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
