import {
  educationLevels,
  incomeBands,
  occupations,
  recordedSacraments,
  studyClasses,
  workSectors,
  type FamilyMember,
  type MemberDetailsInput,
  type StudyClass,
} from '@parish/core';
import type { TFunction } from 'i18next';
import { Controller, useFormContext, useWatch, type Path } from 'react-hook-form';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ChoiceChips';
import { DateField } from '@/components/DateField';
import { FormField } from '@/components/FormField';
import { Eyebrow } from '@/components/design/Eyebrow';

/** A form's starting details for someone new: nothing filled in. */
export const noDetails: MemberDetailsInput = { birthDate: '', sacraments: {} };

/** A member's register entry as form values, to correct or complete it. */
export const detailsOf = (member: FamilyMember): MemberDetailsInput => ({
  birthDate: member.birthDate ?? '',
  education: member.education,
  qualification: member.qualification ?? '',
  occupation: member.occupation,
  studyClass: member.studyClass,
  course: member.course ?? '',
  workSector: member.workSector,
  job: member.job ?? '',
  yearlyIncome: member.yearlyIncome,
  sacraments: { ...member.sacraments },
});

export const studyClassLabel = (t: TFunction, value: StudyClass) =>
  value === 'preschool' || value === 'college' ? t(`member.classes.${value}`) : t('member.classNumber', { class: value });

/**
 * The family register's questions about one person: date of birth, education and work, and the dates
 * of their sacraments. The class appears only for someone studying, and the work only for someone working.
 * Used inside a FormProvider whose values include MemberDetailsInput.
 */
export function MemberDetailsFields() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { control } = useFormContext<MemberDetailsInput>();
  const [education, occupation, studyClass] = useWatch({ control, name: ['education', 'occupation', 'studyClass'] });
  const degree = education === 'diploma' || education === 'graduate' || education === 'postgraduate' || education === 'doctorate';

  const chips = <N extends Path<MemberDetailsInput>>(name: N, label: string, options: { value: string; label: string }[]) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => <ChoiceChips label={label} options={options} value={field.value as string | undefined} onChange={field.onChange} />}
    />
  );

  return (
    <>
      <DateField control={control} name="birthDate" label={t('account.birthDate')} />

      <Eyebrow style={{ marginTop: 8 }}>{t('member.educationAndWork')}</Eyebrow>
      {chips(
        'education',
        t('member.education'),
        educationLevels.map((v) => ({ value: v, label: t(`member.educationLevels.${v}`) })),
      )}
      {degree && <FormField control={control} name="qualification" label={t('member.qualification')} />}
      {chips(
        'occupation',
        t('member.occupation'),
        occupations.map((v) => ({ value: v, label: t(`member.occupations.${v}`) })),
      )}
      {occupation === 'studying' && (
        <>
          {chips(
            'studyClass',
            t('member.studyClass'),
            studyClasses.map((v) => ({ value: v, label: v === 'preschool' || v === 'college' ? t(`member.classes.${v}`) : v })),
          )}
          {studyClass === 'college' && <FormField control={control} name="course" label={t('member.course')} />}
        </>
      )}
      {occupation === 'working' && (
        <>
          {chips(
            'workSector',
            t('member.workSector'),
            workSectors.map((v) => ({ value: v, label: t(`member.sectors.${v}`) })),
          )}
          <FormField tamil control={control} name="job" label={t('member.job')} />
          {chips(
            'yearlyIncome',
            t('member.income'),
            incomeBands.map((v) => ({ value: v, label: t(`member.incomeBands.${v}`) })),
          )}
        </>
      )}

      <Eyebrow style={{ marginTop: 8 }}>{t('member.sacraments')}</Eyebrow>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('member.sacramentsHint')}
      </Text>
      {recordedSacraments.map((kind) => (
        <DateField key={kind} control={control} name={`sacraments.${kind}`} label={t(`certificate.kinds.${kind}`)} />
      ))}
    </>
  );
}
