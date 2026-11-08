import { zodResolver } from '@hookform/resolvers/zod';
import { certificateInputSchema, certificateKinds, useSubmitCertificateRequest, type CertificateInput } from '@stmichaels/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ChoiceChips';
import { FormField } from '@/components/FormField';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { translateError } from '@/components/translateError';

const empty: CertificateInput = {
  kind: 'baptism',
  personName: '',
  sacramentDate: '',
  fatherName: '',
  motherName: '',
  purpose: '',
  requesterName: '',
  phone: '',
};

export default function CertificateRequestScreen() {
  const { t } = useTranslation();
  const submit = useSubmitCertificateRequest();
  const [saved, setSaved] = useState(false);
  const { control, handleSubmit, reset, formState } = useForm<CertificateInput>({
    resolver: zodResolver(certificateInputSchema),
    defaultValues: empty,
  });

  const onSubmit = handleSubmit(async (values) => {
    await submit.mutateAsync([values]);
    reset(empty);
    setSaved(true);
  });

  if (saved) {
    return (
      <Screen>
        <Notice text={t('certificate.submitted')} icon="check-circle-outline" />
        <Button mode="contained" onPress={() => router.replace('/requests')}>
          {t('more.myRequests')}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="bodyLarge">{t('certificate.intro')}</Text>
      <Controller
        control={control}
        name="kind"
        render={({ field }) => (
          <ChoiceChips
            label={t('certificate.kind')}
            options={certificateKinds.map((kind) => ({ value: kind, label: t(`certificate.kinds.${kind}`) }))}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <FormField control={control} name="personName" label={t('certificate.personName')} />
      <FormField
        control={control}
        name="sacramentDate"
        label={t('certificate.sacramentDate')}
        keyboardType="numbers-and-punctuation"
      />
      <FormField control={control} name="fatherName" label={t('certificate.fatherName')} />
      <FormField control={control} name="motherName" label={t('certificate.motherName')} />
      <FormField control={control} name="purpose" label={t('certificate.purpose')} />
      <FormField control={control} name="requesterName" label={t('certificate.yourName')} />
      <FormField control={control} name="phone" label={t('certificate.phone')} keyboardType="phone-pad" />
      <Button mode="contained" contentStyle={{ height: 56 }} loading={formState.isSubmitting} onPress={onSubmit}>
        {t('common.submit')}
      </Button>
      <Snackbar visible={submit.isError} onDismiss={() => submit.reset()}>
        {translateError(t, submit.error?.message)}
      </Snackbar>
    </Screen>
  );
}
