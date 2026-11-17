import { zodResolver } from '@hookform/resolvers/zod';
import {
  createAccountSchema,
  DEMO_PIN,
  OFFICE_DEMO_PHONES,
  parish,
  signInSchema,
  useOfficeChoosePin,
  useOfficeSignIn,
  type CreateAccountInput,
  type SignInInput,
} from '@parish/core';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Text, useTheme } from 'react-native-paper';

import { FormField } from './FormField';
import { errorText } from './errors';

/**
 * The office app's front door: the parish priest and the office staff sign in with their phone number
 * and PIN. Someone the parish priest has just added to the team chooses their PIN here the first time.
 */
export function SignIn() {
  const theme = useTheme();
  const [choosing, setChoosing] = useState<string>();

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.page}>
      <Card mode="outlined" style={styles.card}>
        <Card.Title title={`${parish.name.en} · Parish office`} subtitle={choosing ? 'Choose your PIN' : 'Sign in'} titleVariant="titleLarge" />
        <Card.Content style={styles.content}>
          {choosing ? <ChoosePin phone={choosing} onBack={() => setChoosing(undefined)} /> : <PhoneAndPin onFirstTime={setChoosing} />}
        </Card.Content>
      </Card>
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <Text variant="titleSmall">Preview sign-in</Text>
          <Text variant="bodyMedium">
            {`Parish priest: ${OFFICE_DEMO_PHONES.priest}, PIN ${DEMO_PIN}\nOffice staff: ${OFFICE_DEMO_PHONES.staff}, PIN ${DEMO_PIN}`}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            The parish priest can do everything. Office staff can do everything except remove a family from the parish or change
            the office team.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

function PhoneAndPin({ onFirstTime }: { onFirstTime: (phone: string) => void }) {
  const signIn = useOfficeSignIn();
  const { control, handleSubmit, getValues } = useForm<SignInInput>({ resolver: zodResolver(signInSchema), defaultValues: { phone: '', pin: '' } });
  const submit = handleSubmit((values) =>
    signIn.mutateAsync([values]).catch((error: Error) => {
      if (error.message === 'noPin') onFirstTime(getValues('phone'));
    }),
  );
  return (
    <>
      <FormField control={control} name="phone" label="Phone number" keyboardType="phone-pad" onSubmit={submit} />
      <FormField control={control} name="pin" label="PIN" secret onSubmit={submit} />
      {signIn.isError && signIn.error.message !== 'noPin' && <HelperText type="error">{errorText(signIn.error.message)}</HelperText>}
      <Button mode="contained" icon="login" loading={signIn.isPending} onPress={submit}>
        Sign in
      </Button>
      <Text variant="bodySmall">Forgot your PIN? Ask the parish priest to take you off the office team and add you again; you then choose a new one.</Text>
    </>
  );
}

function ChoosePin({ phone, onBack }: { phone: string; onBack: () => void }) {
  const choose = useOfficeChoosePin();
  const { control, handleSubmit } = useForm<CreateAccountInput>({ resolver: zodResolver(createAccountSchema), defaultValues: { phone, pin: '', confirm: '' } });
  const submit = handleSubmit((values) => choose.mutateAsync([values]).catch(() => undefined));
  return (
    <>
      <Text variant="bodyMedium">{`The parish priest added ${phone} to the office team. Choose a 6-digit PIN to sign in with from now on.`}</Text>
      <FormField control={control} name="pin" label="New PIN" secret onSubmit={submit} />
      <FormField control={control} name="confirm" label="Type the PIN again" secret onSubmit={submit} />
      {choose.isError && <HelperText type="error">{errorText(choose.error.message)}</HelperText>}
      <View style={styles.row}>
        <Button onPress={onBack}>Back</Button>
        <Button mode="contained" icon="check" loading={choose.isPending} onPress={submit}>
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
