import {
  recordedSacraments,
  type EducationLevel,
  type FamilyMember,
  type IncomeBand,
  type Occupation,
  type RecordedSacrament,
  type StudyClass,
  type WorkSector,
} from '@parish/core';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { dayMonthYear } from '@/components/groups/labels';

const educationLabel: Record<EducationLevel, string> = {
  none: 'No schooling',
  belowSslc: 'Below 10th',
  sslc: '10th (SSLC)',
  hsc: '12th (HSC)',
  diploma: 'ITI or diploma',
  graduate: 'Degree',
  postgraduate: 'Postgraduate degree',
  doctorate: 'Doctorate (PhD)',
};

const occupationLabel: Record<Occupation, string> = {
  studying: 'Studying',
  working: 'Working',
  lookingForWork: 'Looking for work',
  homemaker: 'Home duties',
  retired: 'Retired',
  other: 'Other, or too young for school',
};

const sectorLabel: Record<WorkSector, string> = {
  government: 'Government',
  private: 'Private company',
  selfEmployed: 'Own business or self-employed',
  agriculture: 'Farming',
  dailyWage: 'Daily wages',
  church: 'Church or church institution',
  other: 'Other sector',
};

const incomeLabel: Record<IncomeBand, string> = {
  upTo1L: 'up to ₹1 lakh a year',
  '1to3L': '₹1–3 lakh a year',
  '3to6L': '₹3–6 lakh a year',
  '6to10L': '₹6–10 lakh a year',
  '10to20L': '₹10–20 lakh a year',
  over20L: 'above ₹20 lakh a year',
  notSaying: 'income not given',
};

const sacramentLabel: Record<RecordedSacrament, string> = {
  baptism: 'Baptism',
  'first-communion': 'First Holy Communion',
  confirmation: 'Confirmation',
  marriage: 'Marriage',
};

const classLabel = (c: StudyClass) => (c === 'preschool' ? 'LKG / UKG' : c === 'college' ? 'College' : `Class ${c}`);

/** A member's register entry in a few lines, e.g. "Working: Teacher, Government, ₹3–6 lakh a year". */
export function memberFacts(member: FamilyMember): string[] {
  const facts: string[] = [];
  if (member.birthDate) facts.push(`Born ${dayMonthYear(member.birthDate)}`);
  if (member.education) facts.push(`Education: ${educationLabel[member.education]}${member.qualification ? `, ${member.qualification}` : ''}`);
  if (member.occupation === 'studying') {
    const where = [member.studyClass && classLabel(member.studyClass), member.course].filter(Boolean).join(', ');
    facts.push(where ? `Studying: ${where}` : 'Studying');
  } else if (member.occupation === 'working') {
    const work = [member.job, member.workSector && sectorLabel[member.workSector], member.yearlyIncome && incomeLabel[member.yearlyIncome]];
    const said = work.filter(Boolean).join(', ');
    facts.push(said ? `Working: ${said}` : 'Working');
  } else if (member.occupation) {
    facts.push(occupationLabel[member.occupation]);
  }
  const sacraments = recordedSacraments.flatMap((kind) => {
    const date = member.sacraments?.[kind];
    return date ? [`${sacramentLabel[kind]} ${dayMonthYear(date)}`] : [];
  });
  if (sacraments.length > 0) facts.push(sacraments.join(' · '));
  return facts;
}

/** The register entry under a member's name; says so when the family has not filled it in. */
export function MemberFacts({ member }: { member: FamilyMember }) {
  const theme = useTheme();
  const facts = memberFacts(member);
  return (
    <View style={{ gap: 2 }}>
      {facts.length === 0 ? (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          No register details given yet.
        </Text>
      ) : (
        facts.map((fact) => (
          <Text key={fact} variant="bodyMedium">
            {fact}
          </Text>
        ))
      )}
    </View>
  );
}
