import type { CouncilSeat, GroupKind, OfficerRole, RemovalReason } from '@parish/core';

export const kindLabel: Record<GroupKind, string> = {
  council: 'Council',
  anbiyam: 'Anbiyam',
  liturgical: 'Liturgical ministry',
  association: 'Association',
  formation: 'Faith formation',
};

export const roleLabel: Record<OfficerRole, string> = {
  president: 'President',
  vicePresident: 'Vice-president',
  head: 'Head',
  director: 'Director',
  coordinator: 'Coordinator',
  secretary: 'Secretary',
  jointSecretary: 'Joint secretary',
  treasurer: 'Treasurer',
  member: 'Member',
};

export const seatLabel: Record<CouncilSeat, string> = {
  exOfficio: 'By office (ex officio)',
  anbiyam: 'Anbiyam representative',
  elected: 'Elected',
  nominated: 'Nominated by the parish priest',
};

export const removalLabel: Record<RemovalReason, string> = {
  movedAway: 'Moved out of the area',
  otherParish: 'Joined another parish',
  other: 'Other reason',
};

/** "2 Aug 2026" */
export const dayMonthYear = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
