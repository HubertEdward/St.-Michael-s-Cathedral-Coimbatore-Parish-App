import { zodResolver } from '@hookform/resolvers/zod';
import { memberInputSchema, relationships, type MemberInput } from '@parish/core';
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ChoiceChips';
import { FormField } from '@/components/FormField';
import { GradientButton } from '@/components/design/GradientButton';
import { MemberDetailsFields, noDetails } from './MemberDetailsFields';

/** A form's starting values for a family member not yet entered. */
export const newMember: MemberInput = { name: '', relationship: 'son', ...noDetails };

/**
 * One family member's name, relationship to the head and register details, inside a FormProvider whose
 * values hold MemberInput at `prefix`. The head's relationship is fixed, so it is not asked.
 */
export function MemberFields({ prefix = '', isHead = false }: { prefix?: string; isHead?: boolean }) {
  const { t } = useTranslation();
  const { control } = useFormContext();
  return (
    <>
      <FormField tamil control={control} name={`${prefix}name`} label={t('account.memberName')} />
      {!isHead && (
        <Controller
          control={control}
          name={`${prefix}relationship`}
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
      <MemberDetailsFields prefix={prefix} />
    </>
  );
}

interface Props {
  defaultValues: MemberInput;
  submitLabel: string;
  submitIcon: string;
  onSubmit: (values: MemberInput) => Promise<unknown>;
}

/** Corrects or completes one family member's entry. */
export function MemberForm({ defaultValues, submitLabel, submitIcon, onSubmit }: Props) {
  const form = useForm<MemberInput>({ resolver: zodResolver(memberInputSchema), defaultValues });
  return (
    <FormProvider {...form}>
      <MemberFields isHead={defaultValues.relationship === 'head'} />
      <GradientButton label={submitLabel} icon={submitIcon} loading={form.formState.isSubmitting} onPress={form.handleSubmit(onSubmit)} />
    </FormProvider>
  );
}
