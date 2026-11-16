import { zodResolver } from '@hookform/resolvers/zod';
import { memberInputSchema, relationships, type MemberInput } from '@parish/core';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ChoiceChips';
import { FormField } from '@/components/FormField';
import { GradientButton } from '@/components/design/GradientButton';
import { MemberDetailsFields } from './MemberDetailsFields';

interface Props {
  defaultValues: MemberInput;
  submitLabel: string;
  submitIcon: string;
  onSubmit: (values: MemberInput) => Promise<unknown>;
}

/** A family member's name, relationship to the head and register details, to add them or correct them. */
export function MemberForm({ defaultValues, submitLabel, submitIcon, onSubmit }: Props) {
  const { t } = useTranslation();
  const form = useForm<MemberInput>({ resolver: zodResolver(memberInputSchema), defaultValues });
  const isHead = defaultValues.relationship === 'head';

  return (
    <FormProvider {...form}>
      <FormField tamil control={form.control} name="name" label={t('account.memberName')} />
      {!isHead && (
        <Controller
          control={form.control}
          name="relationship"
          render={({ field }) => (
            <ChoiceChips
              label={t('account.relationshipToHead')}
              options={relationships.filter((r) => r !== 'head').map((r) => ({ value: r, label: t(`family.relationship.${r}`) }))}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      )}
      <MemberDetailsFields />
      <GradientButton label={submitLabel} icon={submitIcon} loading={form.formState.isSubmitting} onPress={form.handleSubmit(onSubmit)} />
    </FormProvider>
  );
}
