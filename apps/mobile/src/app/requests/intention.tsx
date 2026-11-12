import { zodResolver } from '@hookform/resolvers/zod';
import {
  formatTime,
  intentionInputSchema,
  intentionTypes,
  parishClock,
  upcomingServices,
  useServices,
  useSubmitIntention,
  type IntentionInput,
} from '@parish/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Button, HelperText, Snackbar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { GradientButton } from '@/components/design/GradientButton';
import { SuccessMark } from '@/components/design/SuccessMark';
import { ChoiceChips } from '@/components/ChoiceChips';
import { FormField } from '@/components/FormField';
import { Notice } from '@/components/Notice';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { translateError } from '@/components/translateError';
import { useDayLabel } from '@/hooks';
import { useLanguage } from '@/i18n';

const empty: IntentionInput = { type: 'thanksgiving', names: '', massDate: '', serviceId: '', requesterName: '', phone: '', note: '' };

export default function IntentionRequest() {
  const { t } = useTranslation();
  const language = useLanguage();
  const dayLabel = useDayLabel();
  const services = useServices();
  const submit = useSubmitIntention();
  const [saved, setSaved] = useState(false);
  const { control, handleSubmit, watch, setValue, reset, formState } = useForm<IntentionInput>({
    resolver: zodResolver(intentionInputSchema),
    defaultValues: empty,
  });
  const massDate = watch('massDate');

  const onSubmit = handleSubmit(async (values) => {
    await submit.mutateAsync([values]);
    reset(empty);
    setSaved(true);
  });

  if (saved) {
    return (
      <Screen>
        <SuccessMark />
        <Notice text={t('intention.submitted')} icon="check-circle-outline" />
        <Notice text={t('intention.offering')} icon="cash" />
        <GradientButton label={t('more.myRequests')} icon="inbox-full" onPress={() => router.replace('/requests')} />
        <Button onPress={() => setSaved(false)}>{t('more.intention')}</Button>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="bodyLarge">{t('intention.intro')}</Text>

      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <ChoiceChips
            label={t('intention.type')}
            options={intentionTypes.map((type) => ({ value: type, label: t(`intention.types.${type}`) }))}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <FormField control={control} name="names" label={t('intention.names')} hint={t('intention.namesHint')} multiline />

      <QueryState query={services}>
        {(list) => {
          const upcoming = upcomingServices(list, parishClock(), { days: 30, limit: 500 });
          const dates = [...new Set(upcoming.map((u) => u.date))];
          return (
            <View style={{ gap: 12 }}>
              <Controller
                control={control}
                name="massDate"
                render={({ field, fieldState }) => (
                  <View>
                    <ChoiceChips
                      label={t('intention.date')}
                      options={dates.map((date) => ({ value: date, label: dayLabel(date) }))}
                      value={field.value}
                      onChange={(date) => {
                        field.onChange(date);
                        setValue('serviceId', '');
                      }}
                      scroll
                    />
                    <HelperText type="error" visible={!!fieldState.error}>
                      {translateError(t, fieldState.error?.message)}
                    </HelperText>
                  </View>
                )}
              />
              {massDate !== '' && (
                <Controller
                  control={control}
                  name="serviceId"
                  render={({ field, fieldState }) => (
                    <View>
                      <ChoiceChips
                        label={t('intention.mass')}
                        options={upcoming
                          .filter((u) => u.date === massDate)
                          .map((u) => ({ value: u.service.id, label: formatTime(u.service.time, language) }))}
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <HelperText type="error" visible={!!fieldState.error}>
                        {translateError(t, fieldState.error?.message)}
                      </HelperText>
                    </View>
                  )}
                />
              )}
            </View>
          );
        }}
      </QueryState>

      <FormField control={control} name="requesterName" label={t('intention.yourName')} />
      <FormField control={control} name="phone" label={t('intention.phone')} keyboardType="phone-pad" />
      <FormField control={control} name="note" label={t('intention.note')} multiline />
      <Notice text={t('intention.offering')} icon="cash" />
      <GradientButton label={t('common.submit')} icon="send" loading={formState.isSubmitting} onPress={onSubmit} />
      <Snackbar visible={submit.isError} onDismiss={() => submit.reset()}>
        {translateError(t, submit.error?.message)}
      </Snackbar>
    </Screen>
  );
}
