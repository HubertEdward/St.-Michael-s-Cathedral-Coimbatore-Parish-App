// Database rows (snake_case, nulls) ↔ the apps' types (camelCase, optional fields).
// Timestamps come back from Postgres as "…+00:00"; they are turned into toISOString() form, so the apps can
// compare and sort them as strings.
import type {
  Announcement,
  CertificateRequest,
  Family,
  FamilyMember,
  GroupMessage,
  MassIntention,
  Officer,
  ParishEvent,
  ParishGroup,
  RecordedSacrament,
  RosterEntry,
  Service,
  Subscription,
} from '../types';

export type Row = Record<string, unknown>;

const camel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const snake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** Keys to camelCase, nulls dropped, timestamps normalised. */
function fromRow(row: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) continue;
    out[camel(key)] = key.endsWith('_at') && typeof value === 'string' ? new Date(value).toISOString() : value;
  }
  return out;
}

/** Keys to snake_case; undefined becomes null, so an edit can clear a field. */
export function toRow(value: object): Row {
  const out: Row = {};
  for (const [key, field] of Object.entries(value)) out[snake(key)] = field === undefined ? null : field;
  return out;
}

const omit = (row: Row, ...keys: string[]) => {
  const copy = { ...row };
  for (const key of keys) delete copy[key];
  return copy;
};

export const service = (row: Row) => omit(fromRow(row), 'parishId') as unknown as Service;
export const announcement = (row: Row) => omit(fromRow(row), 'parishId') as unknown as Announcement;
export const parishEvent = (row: Row) => omit(fromRow(row), 'parishId') as unknown as ParishEvent;
export const intention = (row: Row) => omit(fromRow(row), 'parishId', 'requesterId') as unknown as MassIntention;
export const certificateRequest = (row: Row) => omit(fromRow(row), 'parishId', 'requesterId') as unknown as CertificateRequest;
export const subscription = (row: Row) => omit(fromRow(row), 'parishId', 'requesterId') as unknown as Subscription;
export const rosterEntry = (row: Row) => omit(fromRow(row), 'parishId') as unknown as RosterEntry;
export const groupMessage = (row: Row) => omit(fromRow(row), 'parishId', 'senderId') as unknown as GroupMessage;

export function officer(row: Row): Officer {
  const o = omit(fromRow(row), 'parishId', 'groupId', 'createdAt');
  if (o.pending !== true) delete o.pending;
  return o as unknown as Officer;
}

export function group(row: Row): ParishGroup {
  const { termFrom, termTo, officers, ...rest } = omit(fromRow(row), 'parishId', 'createdAt');
  return {
    ...(rest as unknown as Omit<ParishGroup, 'officers' | 'term'>),
    ...(termFrom && termTo ? { term: { from: termFrom as string, to: termTo as string } } : {}),
    officers: ((officers as Row[] | undefined) ?? []).map(officer),
  };
}

export function family(row: Row): Family {
  const { removalReason, removalNote, removedOn, ...rest } = omit(fromRow(row), 'parishId');
  return {
    ...(rest as unknown as Family),
    ...(removalReason ? { removal: { reason: removalReason, ...(removalNote ? { note: removalNote } : {}), on: removedOn } } : {}),
  } as Family;
}

/** Sacrament → its date column. */
const sacramentColumns: Record<RecordedSacrament, string> = {
  baptism: 'baptismDate',
  'first-communion': 'firstCommunionDate',
  confirmation: 'confirmationDate',
  marriage: 'marriageDate',
};

export function familyMember(row: Row): FamilyMember {
  const m = omit(fromRow(row), 'parishId', 'userId');
  const sacraments: Partial<Record<RecordedSacrament, string>> = {};
  for (const [sacrament, column] of Object.entries(sacramentColumns)) {
    if (m[column]) sacraments[sacrament as RecordedSacrament] = m[column] as string;
    delete m[column];
  }
  return { ...(m as unknown as FamilyMember), ...(Object.keys(sacraments).length > 0 ? { sacraments } : {}) };
}

/** A member's register entry as the database stores it: each sacrament in its own column, absent fields null. */
export function memberRow(member: Partial<FamilyMember>): Row {
  const { sacraments, ...rest } = member;
  const row = toRow({
    birthDate: undefined,
    education: undefined,
    qualification: undefined,
    occupation: undefined,
    studyClass: undefined,
    course: undefined,
    workSector: undefined,
    job: undefined,
    yearlyIncome: undefined,
    ...rest,
  });
  for (const [sacrament, column] of Object.entries(sacramentColumns)) row[snake(column)] = sacraments?.[sacrament as RecordedSacrament] ?? null;
  return row;
}
