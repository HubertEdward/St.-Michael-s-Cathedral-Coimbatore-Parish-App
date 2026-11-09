import { zodResolver } from '@hookform/resolvers/zod';
import {
  debitDays,
  formatDate,
  formatRupees,
  nextDebitOn,
  parishClock,
  subscriptionInputSchema,
  type SubscriptionInput,
} from '@parish/core';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ChoiceChips';
import { FormField } from '@/components/FormField';
import { Eyebrow } from '@/components/design/Eyebrow';
import { Panel } from '@/components/design/Panel';
import { translateError } from '@/components/translateError';
import { useLanguage } from '@/i18n';

import { AmountPicker } from './AmountPicker';
import { PurposePicker } from './PurposePicker';

const defaults: SubscriptionInput = { amount: 500, purpose: 'parish', debitDay: 5, name: '', phone: '' };

/** "₹500 every month on day 5, starting Fri, 5 Dec" */
export function useSummary(): (input: Pick<SubscriptionInput, 'amount' | 'debitDay'>) => string {
  const { t } = useTranslation();
  const language = useLanguage();
  return ({ amount, debitDay }) =>
    t('give.summary', {
      amount: formatRupees(amount || 0, language),
      day: debitDay,
      date: formatDate(nextDebitOn(debitDay, parishClock().date), language),
    });
}

/** Choose an amount, a purpose and a debit day, then review in the AutoPay sheet. */
export function SetupForm({ onReview }: { onReview: (input: SubscriptionInput) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const summary = useSummary();
  const { control, handleSubmit } = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionInputSchema),
    defaultValues: defaults,
  });
  const [amount, debitDay] = useWatch({ control, name: ['amount', 'debitDay'] });

  return (
    <View style={styles.form}>
      <Eyebrow>{t('give.amount')}</Eyebrow>
      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <AmountPicker
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error ? translateError(t, fieldState.error.message) : undefined}
          />
        )}
      />

      <Eyebrow>{t('give.purpose')}</Eyebrow>
      <Controller
        control={control}
        name="purpose"
        render={({ field }) => <PurposePicker value={field.value} onChange={field.onChange} />}
      />

      <Eyebrow>{t('give.day')}</Eyebrow>
      <Controller
        control={control}
        name="debitDay"
        render={({ field }) => (
          <ChoiceChips
            options={debitDays.map((day) => ({ value: String(day), label: t('give.dayOption', { day }) }))}
            value={String(field.value)}
            onChange={(day) => field.onChange(Number(day))}
          />
        )}
      />

      <Eyebrow>{t('give.yourDetails')}</Eyebrow>
      <View>
        <FormField control={control} name="name" label={t('give.yourName')} />
        <FormField control={control} name="phone" label={t('give.phone')} keyboardType="phone-pad" />
      </View>

      <Panel style={{ backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primaryContainer }}>
        <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
          {summary({ amount, debitDay })}
        </Text>
        <Button mode="contained" icon="cellphone-check" contentStyle={styles.button} onPress={handleSubmit(onReview)}>
          {t('give.setUp')}
        </Button>
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  button: { height: 56 },
});
