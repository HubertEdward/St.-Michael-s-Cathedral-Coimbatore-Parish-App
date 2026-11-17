import { zodResolver } from '@hookform/resolvers/zod';
import {
  DEMO_PIN,
  OFFICE_DEMO_PHONES,
  parish,
  resetPinSchema,
  signInSchema,
  useOfficeSetUp,
  useOfficeSignIn,
  type ResetPinInput,
  type SignInInput,
} from '@parish/core';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Text, useTheme } from 'react-native-paper';

import { FormField } from './FormField';
import { errorText } from './errors';

/**
 * The office app's front door: the parish priest and the office staff sign in with their phone number and
 * PIN. Someone the parish priest has just added to the team signs in the first time with the setup code he
 * gave them, and chooses their PIN; the code also sets a new PIN after a forgotten one.
 */
export function SignIn() {
  const theme = useTheme();
  const [settingUp, setSettingUp] = useState(false);

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.page}>
      <Card mode="outlined" style={styles.card}>
        <Card.Title title={`${parish.name.en} · Parish office`} subtitle={settingUp ? 'Sign in with a setup code' : 'Sign in'} titleVariant="titleLarge" />
        <Card.Content style={styles.content}>
          {settingUp ? <SetUp onBack={() => setSettingUp(false)} /> : <PhoneAndPin onSetUp={() => setSettingUp(true)} />}
        </Card.Content>
      </Card>
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <Text variant="titleSmall">Sample sign-in</Text>
          <Text variant="bodyMedium">
            {`Parish priest: ${OFFICE_DEMO_PHONES.priest}, PIN ${DEMO_PIN}\nOffice staff: ${OFFICE_DEMO_PHONES.staff}, PIN ${DEMO_PIN}`}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            These work where the sample data is loaded (npm run backend:samples). The parish priest can do everything. Office staff
            can do everything except remove a family from the parish or change the office team.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

function PhoneAndPin({ onSetUp }: { onSetUp: () => void }) {
  const signIn = useOfficeSignIn();
  const { control, handleSubmit } = useForm<SignInInput>({ resolver: zodResolver(signInSchema), defaultValues: { phone: '', pin: '' } });
  const submit = handleSubmit((values) => signIn.mutateAsync([values]).catch(() => undefined));
  return (
    <>
      <FormField control={control} name="phone" label="Phone number" keyboardType="phone-pad" onSubmit={submit} />
      <FormField control={control} name="pin" label="PIN" secret onSubmit={submit} />
      {signIn.isError && <HelperText type="error">{errorText(signIn.error.message)}</HelperText>}
      <Button mode="contained" icon="login" loading={signIn.isPending} onPress={submit}>
        Sign in
      </Button>
      <Button icon="key-outline" onPress={onSetUp}>
        First time, or forgot your PIN? Use a setup code
      </Button>
    </>
  );
}

function SetUp({ onBack }: { onBack: () => void }) {
  const setUp = useOfficeSetUp();
  const { control, handleSubmit } = useForm<ResetPinInput>({
    resolver: zodResolver(resetPinSchema),
    defaultValues: { phone: '', code: '', pin: '', confirm: '' },
  });
  const submit = handleSubmit((values) => setUp.mutateAsync([values]).catch(() => undefined));
  return (
    <>
      <Text variant="bodyMedium">
        The parish priest gives each new member of the office team a 6-digit setup code, valid for a day. He can give a new one if you
        forget your PIN. Enter it with your phone number, and choose the PIN you will sign in with.
      </Text>
      <FormField control={control} name="phone" label="Phone number" keyboardType="phone-pad" onSubmit={submit} />
      <FormField control={control} name="code" label="Setup code" keyboardType="number-pad" onSubmit={submit} />
      <FormField control={control} name="pin" label="New PIN" secret onSubmit={submit} />
      <FormField control={control} name="confirm" label="Type the PIN again" secret onSubmit={submit} />
      {setUp.isError && <HelperText type="error">{errorText(setUp.error.message)}</HelperText>}
      <View style={styles.row}>
        <Button onPress={onBack}>Back</Button>
        <Button mode="contained" icon="check" loading={setUp.isPending} onPress={submit}>
          Save PIN and sign in
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: { padding: 24, gap: 16, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  card: { width: '100%', maxWidth: 440 },
  content: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
