// The only functions screens use to read and change parish data, backed by the parish's Supabase database
// (supabase/migrations). Who may do what is enforced there, with row-level security and server functions;
// the checks here only give the apps early, friendly errors.
//
// Thrown Error messages are codes the apps translate, e.g. 'massNotOnDate', 'notInParish', 'wrongPin'.
import { nextDebitOn } from '../giving';
import { parishClock } from '../parish';
import type {
  Account,
  Announcement,
  CertificateRequest,
  FamilyMember,
  FamilyWithMembers,
  GroupMessage,
  MassIntention,
  MemberDetails,
  MembershipStatus,
  OfficeUser,
  Officer,
  ParishEvent,
  ParishGroup,
  ParishSettings,
  RequestStatus,
  RosterEntry,
  Service,
  Subscription,
  SubscriptionStatus,
} from '../types';
import {
  announcementInputSchema,
  certificateInputSchema,
  createAccountSchema,
  eventInputSchema,
  familyInputSchema,
  groupInputSchema,
  groupPostSchema,
  intentionInputSchema,
  joinFamilySchema,
  memberInputSchema,
  membersInputSchema,
  officeUserInputSchema,
  officerInputSchema,
  removalInputSchema,
  resetPinSchema,
  rosterInputSchema,
  serviceInputSchema,
  settingsInputSchema,
  signInSchema,
  subscriptionAmountSchema,
  subscriptionInputSchema,
  type AnnouncementInput,
  type CertificateInput,
  type CreateAccountInput,
  type EventInput,
  type FamilyInput,
  type GroupInput,
  type GroupPostInput,
  type IntentionInput,
  type JoinFamilyInput,
  type MemberDetailsInput,
  type MemberInput,
  type OfficeUserInput,
  type OfficerInput,
  type RemovalInput,
  type ResetPinInput,
  type RosterInput,
  type ServiceInput,
  type SettingsInput,
  type SubscriptionInput,
} from '../validation';
import { parishTimeToIso } from '../parish';
import { db, parishId } from './backend';
import { loginEmail } from './login';
import * as rows from './rows';
import type { Row } from './rows';

// Plumbing --------------------------------------------------------------------------------------------------

interface Result<T> {
  data: T;
  error: { message: string } | null;
}

/** The data of a query, or the error's message (a code raised by the database) as a thrown Error. */
async function maybe<T>(query: PromiseLike<Result<T>>): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

/** As maybe, for queries that always return data (a list, or the row just written). */
const run = async <T>(query: PromiseLike<Result<T>>) => (await maybe(query)) as NonNullable<T>;

const rpc = <T = unknown>(fn: string, args: Record<string, unknown>) => maybe<T>(db().rpc(fn, args) as unknown as PromiseLike<Result<T>>);
const table = (name: string) => db().from(name);
const p = parishId;

/** Requests can be sent without an account; an anonymous session lets the sender follow them in My requests. */
async function ensureSession(): Promise<string> {
  const { data } = await db().auth.getSession();
  if (data.session) return data.session.user.id;
  const signedIn = await db().auth.signInAnonymously();
  if (signedIn.error || !signedIn.data.user) throw new Error(signedIn.error?.message ?? 'notSignedIn');
  return signedIn.data.user.id;
}

async function myUserId(): Promise<string | undefined> {
  const { data } = await db().auth.getSession();
  return data.session?.user.id;
}

const loc = (en: string | undefined) => (en ? { en } : null);

// Timetable ----------------------------------------------------------------------------------------------------

export const listServices = async (): Promise<Service[]> =>
  (await run(table('services').select('*').eq('parish_id', p()).order('day').order('time'))).map(rows.service);

export async function saveService(input: ServiceInput, id?: string): Promise<Service> {
  const parsed = serviceInputSchema.parse(input);
  const row = {
    parish_id: p(),
    kind: parsed.kind,
    day: parsed.day,
    time: parsed.time,
    language: parsed.language ?? null,
    place: loc(parsed.place),
    note: loc(parsed.note),
  };
  const saved = id
    ? await run(table('services').update(row).eq('id', id).select().single())
    : await run(table('services').insert(row).select().single());
  return rows.service(saved);
}

export const deleteService = async (id: string) => void (await run(table('services').delete().eq('id', id)));

// Announcements and events ---------------------------------------------------------------------------------------

export const listAnnouncements = async (): Promise<Announcement[]> =>
  (
    await run(table('announcements').select('*').eq('parish_id', p()).order('pinned', { ascending: false }).order('published_at', { ascending: false }))
  ).map(rows.announcement);

export const getAnnouncement = async (id: string): Promise<Announcement | null> => {
  const row = await maybe(table('announcements').select('*').eq('id', id).maybeSingle());
  return row ? rows.announcement(row) : null;
};

export async function saveAnnouncement(input: AnnouncementInput, id?: string): Promise<Announcement> {
  const parsed = announcementInputSchema.parse(input);
  const row = { parish_id: p(), title: parsed.title, body: parsed.body, pinned: parsed.pinned };
  const saved = id
    ? await run(table('announcements').update(row).eq('id', id).select().single())
    : await run(table('announcements').insert(row).select().single());
  return rows.announcement(saved);
}

export const deleteAnnouncement = async (id: string) => void (await run(table('announcements').delete().eq('id', id)));

export const listEvents = async (): Promise<ParishEvent[]> =>
  (await run(table('events').select('*').eq('parish_id', p()).order('starts_at'))).map(rows.parishEvent);

export const getEvent = async (id: string): Promise<ParishEvent | null> => {
  const row = await maybe(table('events').select('*').eq('id', id).maybeSingle());
  return row ? rows.parishEvent(row) : null;
};

export async function saveEvent(input: EventInput, id?: string): Promise<ParishEvent> {
  const parsed = eventInputSchema.parse(input);
  const row = {
    parish_id: p(),
    title: parsed.title,
    description: parsed.description,
    starts_at: parishTimeToIso(parsed.date, parsed.time),
    place: loc(parsed.place),
  };
  const saved = id
    ? await run(table('events').update(row).eq('id', id).select().single())
    : await run(table('events').insert(row).select().single());
  return rows.parishEvent(saved);
}

export const deleteEvent = async (id: string) => void (await run(table('events').delete().eq('id', id)));

// Settings -------------------------------------------------------------------------------------------------------

export const getSettings = async (): Promise<ParishSettings> => {
  const row = await run(table('parishes').select('intention_cutoff_minutes').eq('id', p()).single());
  return { intentionCutoffMinutes: row.intention_cutoff_minutes as number };
};

export async function updateSettings(input: SettingsInput): Promise<ParishSettings> {
  const parsed = settingsInputSchema.parse(input);
  await run(table('parishes').update({ intention_cutoff_minutes: parsed.intentionCutoffMinutes }).eq('id', p()));
  return parsed;
}

// Mass intentions --------------------------------------------------------------------------------------------------

/**
 * The parish clock as it will read when intentions close: a Mass that has started by then no longer takes
 * intentions. Intentions close the parish office's chosen number of minutes before each Mass.
 */
export const intentionsClock = (cutoffMinutes: number, now = new Date()) => parishClock(new Date(now.getTime() + cutoffMinutes * 60_000));

export const listIntentions = async (): Promise<MassIntention[]> =>
  (await run(table('intentions').select('*').eq('parish_id', p()).order('created_at', { ascending: false }))).map(rows.intention);

export async function submitIntention(input: IntentionInput): Promise<MassIntention> {
  const parsed = intentionInputSchema.parse(input);
  await ensureSession();
  return rows.intention(await rpc<Row>('submit_intention', { p_parish: p(), p_intention: rows.toRow(parsed) }));
}

/** Intentions sent from this phone or account. */
export async function listMyIntentions(): Promise<MassIntention[]> {
  const me = await myUserId();
  if (!me) return [];
  return (await run(table('intentions').select('*').eq('requester_id', me).order('created_at', { ascending: false }))).map(rows.intention);
}

export const setIntentionStatus = async (id: string, status: RequestStatus) => void (await run(table('intentions').update({ status }).eq('id', id)));

// Certificate requests -----------------------------------------------------------------------------------------------

export const listCertificateRequests = async (): Promise<CertificateRequest[]> =>
  (await run(table('certificate_requests').select('*').eq('parish_id', p()).order('created_at', { ascending: false }))).map(rows.certificateRequest);

export async function submitCertificateRequest(input: CertificateInput): Promise<CertificateRequest> {
  const parsed = certificateInputSchema.parse(input);
  const requester = await ensureSession();
  const row = { ...rows.toRow(parsed), sacrament_date: parsed.sacramentDate || null, parish_id: p(), requester_id: requester };
  return rows.certificateRequest(await run(table('certificate_requests').insert(row).select().single()));
}

export async function listMyCertificateRequests(): Promise<CertificateRequest[]> {
  const me = await myUserId();
  if (!me) return [];
  return (await run(table('certificate_requests').select('*').eq('requester_id', me).order('created_at', { ascending: false }))).map(
    rows.certificateRequest,
  );
}

export const updateCertificateRequest = async (id: string, status: RequestStatus, officeNote?: string) =>
  void (await run(table('certificate_requests').update({ status, office_note: officeNote || null }).eq('id', id)));

// Ministry rosters ---------------------------------------------------------------------------------------------------

export const listRoster = async (): Promise<RosterEntry[]> =>
  (await run(table('roster_entries').select('*').eq('parish_id', p()).order('date').order('service_id'))).map(rows.rosterEntry);

export async function saveRosterEntry(input: RosterInput): Promise<RosterEntry> {
  const row = { ...rows.toRow(rosterInputSchema.parse(input)), parish_id: p() };
  return rows.rosterEntry(await run(table('roster_entries').insert(row).select().single()));
}

export const deleteRosterEntry = async (id: string) => void (await run(table('roster_entries').delete().eq('id', id)));

// Monthly offerings (no money moves yet) ---------------------------------------------------------------------------------

export const listSubscriptions = async (): Promise<Subscription[]> =>
  (await run(table('subscriptions').select('*').eq('parish_id', p()).order('created_at', { ascending: false }))).map(rows.subscription);

export async function listMySubscriptions(): Promise<Subscription[]> {
  const me = await myUserId();
  if (!me) return [];
  return (await run(table('subscriptions').select('*').eq('requester_id', me).order('created_at', { ascending: false }))).map(rows.subscription);
}

export async function startSubscription(input: SubscriptionInput): Promise<Subscription> {
  const parsed = subscriptionInputSchema.parse(input);
  const requester = await ensureSession();
  const row = { ...rows.toRow(parsed), parish_id: p(), requester_id: requester, starts_on: nextDebitOn(parsed.debitDay, parishClock().date) };
  return rows.subscription(await run(table('subscriptions').insert(row).select().single()));
}

/** The person who set it up pauses, resumes or cancels their monthly offering. */
export const setSubscriptionStatus = async (id: string, status: SubscriptionStatus) =>
  void (await rpc('change_my_subscription', { p_id: id, p_status: status, p_amount: null }));

export const changeSubscriptionAmount = async (id: string, amount: number) =>
  void (await rpc('change_my_subscription', { p_id: id, p_status: null, p_amount: subscriptionAmountSchema.parse(amount) }));

// Signing in --------------------------------------------------------------------------------------------------------------

/** "+91 98430 20001" for a login, or null for an anonymous one. */
function phoneOf(email: string | undefined): string | null {
  const match = email?.match(/^(\d{10})@phone\.parish-app\.in$/);
  return match ? `+91 ${match[1].slice(0, 5)} ${match[1].slice(5)}` : null;
}

export async function getAccount(): Promise<Account | null> {
  const { data } = await db().auth.getSession();
  const phone = phoneOf(data.session?.user.email);
  return phone ? { phone } : null;
}

async function signInWithPin(phone: string, pin: string): Promise<Account> {
  const { data, error } = await db().auth.signInWithPassword({ email: loginEmail(phone), password: pin });
  // Supabase does not say whether the number or the PIN was wrong, so neither do the apps.
  if (error || !data.user) throw new Error(error?.message === 'Invalid login credentials' ? 'wrongPin' : (error?.message ?? 'wrongPin'));
  return { phone: phoneOf(data.user.email)! };
}

/** Signs in on this phone with the number and PIN the person chose. */
export async function signIn(input: { phone: string; pin: string }): Promise<Account> {
  const { phone, pin } = signInSchema.parse(input);
  return signInWithPin(phone, pin);
}

const alreadyRegistered = (error: { code?: string; message: string }) =>
  error.code === 'user_already_exists' || error.code === 'email_exists' || /already (been )?registered/i.test(error.message);

/**
 * First time on the app: chooses a PIN for this number and signs in. Requests already sent from this phone
 * without an account stay with the person: their anonymous session becomes the account.
 */
export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const { phone, pin } = createAccountSchema.parse(input);
  const { data: current } = await db().auth.getSession();
  const { error } = current.session?.user.is_anonymous
    ? await db().auth.updateUser({ email: loginEmail(phone), password: pin })
    : await db().auth.signUp({ email: loginEmail(phone), password: pin });
  if (error) throw new Error(alreadyRegistered(error) ? 'accountExists' : error.message);
  return signInWithPin(phone, pin);
}

/** Sets a PIN with a one-time code from the parish office (or the parish priest, for the office team). */
async function setPinWithCode(phone: string, code: string, pin: string) {
  const { error } = await db().functions.invoke('pin', { body: { parish: p(), phone, code, pin } });
  if (error) throw new Error('resetCodeInvalid');
}

/** Sets a new PIN with the reset code the parish office gave, and signs in. */
export async function resetPin(input: ResetPinInput): Promise<Account> {
  const { phone, code, pin } = resetPinSchema.parse(input);
  await setPinWithCode(phone, code, pin);
  return signInWithPin(phone, pin);
}

/** For the parish office: a 6-digit code, valid for 24 hours, that lets this number choose a new PIN. */
export async function issuePinReset(phone: string): Promise<{ code: string; expiresAt: string }> {
  const issued = await rpc<{ code: string; expires_at: string }>('issue_pin_reset', { p_parish: p(), p_phone: phone });
  return { code: issued.code, expiresAt: new Date(issued.expires_at).toISOString() };
}

export const signOut = async () => void (await db().auth.signOut());

// The parish office app's sign-in and team. Thrown codes: 'wrongPin', 'noAccount' (not on the office team),
// 'resetCodeInvalid', 'notPriest', 'officeUserExists', 'cannotRemoveSelf'.

/** Who is signed in to the office app, or null. */
export async function getOfficeAccount(): Promise<OfficeUser | null> {
  const { data } = await db().auth.getSession();
  if (!data.session || data.session.user.is_anonymous) return null;
  return (await rpc<OfficeUser | null>('get_office_account', { p_parish: p() })) ?? null;
}

/** Signs in to the office app; only the office team may. */
export async function officeSignIn(input: { phone: string; pin: string }): Promise<OfficeUser> {
  const { phone, pin } = signInSchema.parse(input);
  await signInWithPin(phone, pin);
  const me = await getOfficeAccount();
  if (!me) {
    await db().auth.signOut();
    throw new Error('noAccount');
  }
  return me;
}

/** First sign-in of someone the parish priest added to the team: the setup code he gave them, and a PIN they choose. */
export async function officeSetUp(input: ResetPinInput): Promise<OfficeUser> {
  const { phone, code, pin } = resetPinSchema.parse(input);
  await setPinWithCode(phone, code, pin);
  return officeSignIn({ phone, pin });
}

export const officeSignOut = signOut;

/** The office team, and whether each has signed in yet. */
export async function listOfficeUsers(): Promise<(OfficeUser & { hasPin: boolean })[]> {
  const team = await rpc<(OfficeUser & { has_pin: boolean })[]>('list_office_users', { p_parish: p() });
  return team.map(({ has_pin, ...user }) => ({ ...user, hasPin: has_pin }));
}

export interface SetupCode {
  code: string;
  expiresAt: string;
}

/** The parish priest adds someone to the office team, and gets the setup code to give them for their first sign-in. */
export async function addOfficeUser(input: OfficeUserInput): Promise<OfficeUser & SetupCode> {
  const parsed = officeUserInputSchema.parse(input);
  const added = await rpc<OfficeUser & { code: string; expires_at: string }>('add_office_user', {
    p_parish: p(),
    p_name: parsed.name,
    p_phone: parsed.phone,
    p_role: parsed.role,
  });
  const { expires_at, ...rest } = added;
  return { ...rest, expiresAt: new Date(expires_at).toISOString() };
}

/** The parish priest gives a member of the team a new setup code, e.g. after they forgot their PIN. */
export async function issueOfficeCode(id: string): Promise<SetupCode> {
  const issued = await rpc<{ code: string; expires_at: string }>('issue_office_code', { p_office_user: id });
  return { code: issued.code, expiresAt: new Date(issued.expires_at).toISOString() };
}

export const removeOfficeUser = async (id: string) => void (await rpc('remove_office_user', { p_office_user: id }));

// Families and members. Thrown codes: 'notSignedIn', 'alreadyInFamily', 'familyNotFound'.

/**
 * The register entry from a form: blanks dropped, and the class or the work kept only for someone studying
 * or working, so changing what a person does clears what no longer applies.
 */
function memberDetails(input: MemberDetailsInput): MemberDetails {
  const studying = input.occupation === 'studying';
  const working = input.occupation === 'working';
  const sacraments = Object.fromEntries(Object.entries(input.sacraments).filter(([, date]) => date));
  const details: MemberDetails = {
    birthDate: input.birthDate || undefined,
    education: input.education,
    qualification: input.qualification || undefined,
    occupation: input.occupation,
    studyClass: studying ? input.studyClass : undefined,
    course: studying && input.studyClass === 'college' ? input.course || undefined : undefined,
    workSector: working ? input.workSector : undefined,
    job: working ? input.job || undefined : undefined,
    yearlyIncome: working ? input.yearlyIncome : undefined,
    sacraments: Object.keys(sacraments).length > 0 ? sacraments : undefined,
  };
  return Object.fromEntries(Object.entries(details).filter(([, value]) => value !== undefined));
}

const memberEntry = (input: MemberInput) => rows.memberRow({ name: input.name, relationship: input.relationship, ...memberDetails(input) });

function familyWithMembers(row: Row): FamilyWithMembers {
  const { members, name, ...family } = row;
  return { ...rows.family(family), name: name as string, members: ((members as Row[] | undefined) ?? []).map(rows.familyMember) };
}

/**
 * The signed-in person's family and their own membership, or null if they have none yet. Someone still
 * waiting to join an existing family sees only the family's name and their own request.
 */
export async function getMyFamily(): Promise<{ family: FamilyWithMembers; me: FamilyMember; anbiyam: ParishGroup | undefined } | null> {
  if (!(await getAccount())) return null;
  const found = await rpc<{ family: Row; me: Row; anbiyam: Row | null } | null>('get_my_family', { p_parish: p() });
  if (!found) return null;
  return { family: familyWithMembers(found.family), me: rows.familyMember(found.me), anbiyam: found.anbiyam ? rows.group(found.anbiyam) : undefined };
}

/** A member of a family the parish priest removed asks for it to be taken back into the parish. */
export const askToRejoinParish = async () => void (await rpc('ask_to_rejoin_parish', { p_parish: p() }));

/** Registers a new family, with the signed-in person as its head and the members they list; the office approves it. */
export async function registerFamily(input: FamilyInput) {
  const parsed = familyInputSchema.parse(input);
  const family = await rpc<Row>('register_family', {
    p_parish: p(),
    p_head: rows.memberRow({ name: parsed.headName, relationship: 'head', ...memberDetails(parsed) }),
    p_address: parsed.address,
    p_preferred_anbiyam: parsed.preferredAnbiyamId || null,
    p_members: parsed.members.map(memberEntry),
  });
  return rows.family(family);
}

/** Asks to join a registered family by its code; the office approves it. */
export async function requestToJoinFamily(input: JoinFamilyInput): Promise<FamilyMember> {
  const parsed = joinFamilySchema.parse(input);
  const member = rows.memberRow({ name: parsed.name, relationship: parsed.relationship, ...memberDetails(parsed) });
  return rows.familyMember(await rpc<Row>('request_to_join_family', { p_parish: p(), p_code: parsed.code, p_member: member }));
}

/** A member adds one or more people to the family, such as children or elders without their own phone; the office approves them. */
export async function addFamilyMembers(inputs: MemberInput[]): Promise<FamilyMember[]> {
  const parsed = membersInputSchema.parse(inputs);
  return (await rpc<Row[]>('add_family_members', { p_parish: p(), p_members: parsed.map(memberEntry) })).map(rows.familyMember);
}

/** A member of the family corrects or completes someone's register entry. */
export async function updateFamilyMember(id: string, input: MemberInput): Promise<FamilyMember> {
  return rows.familyMember(await rpc<Row>('update_family_member', { p_id: id, p_member: memberEntry(memberInputSchema.parse(input)) }));
}

/** Every family with its members, newest registration first. */
export const listFamilies = async (): Promise<FamilyWithMembers[]> => (await rpc<Row[]>('list_families', { p_parish: p() })).map(familyWithMembers);

/** Approving or declining a family does the same for everyone waiting in it. */
export const setFamilyStatus = async (id: string, status: MembershipStatus) => void (await rpc('set_family_status', { p_family: id, p_status: status }));

export const setMemberStatus = async (id: string, status: MembershipStatus) => void (await run(table('family_members').update({ status }).eq('id', id)));

/** Places a family in its Anbiyam, moves it to another, or (with null) takes it out; its members give up their posts in the one it leaves. */
export const setFamilyAnbiyam = async (familyId: string, anbiyamId: string | null) =>
  void (await rpc('set_family_anbiyam', { p_family: familyId, p_anbiyam: anbiyamId }));

/** The parish priest removes a family that has left the parish. */
export async function removeFamily(familyId: string, input: RemovalInput) {
  const { reason, note } = removalInputSchema.parse(input);
  await rpc('remove_family', { p_family: familyId, p_reason: reason, p_note: note ?? null });
}

// Groups: councils, Anbiyams, ministries, associations and faith formation. Thrown code: 'anbiyamHasFamilies'.
// Messages and joining: 'notInParish', 'notGroupLeader', 'cannotJoin'.

const localized = (en: string | undefined, ta: string | undefined) => (en ? { en, ...(ta ? { ta } : {}) } : null);

// A group with the people in it. Officers point at groups twice (their group, and the Anbiyam a council
// member represents), so the link is named.
const withOfficers = '*, officers:officers!officers_group_id_fkey(*)';

export const listGroups = async (): Promise<ParishGroup[]> =>
  (
    await run(
      table('groups').select(withOfficers).eq('parish_id', p()).order('created_at').order('created_at', { referencedTable: 'officers' }),
    )
  ).map(rows.group);

/** Creates a group, or edits one when `id` is given; its officers stay as they are. */
export async function saveGroup(input: GroupInput, id?: string): Promise<ParishGroup> {
  const parsed = groupInputSchema.parse(input);
  const row = {
    parish_id: p(),
    kind: parsed.kind,
    name: localized(parsed.name, parsed.nameTa),
    description: localized(parsed.description, parsed.descriptionTa) ?? { en: '' },
    area: localized(parsed.area, parsed.areaTa),
    meets: localized(parsed.meets, parsed.meetsTa),
    term_from: parsed.termFrom && parsed.termTo ? parsed.termFrom : null,
    term_to: parsed.termFrom && parsed.termTo ? parsed.termTo : null,
  };
  const saved = id
    ? await run(table('groups').update(row).eq('id', id).select(withOfficers).single())
    : await run(table('groups').insert(row).select(withOfficers).single());
  return rows.group(saved);
}

export const deleteGroup = async (id: string) => void (await run(table('groups').delete().eq('id', id)));

/** Gives someone a post in a group. Every post but "member" has one holder, who is replaced. */
export async function addOfficer(groupId: string, input: OfficerInput): Promise<Officer> {
  const parsed = officerInputSchema.parse(input);
  return rows.officer(await rpc<Row>('add_officer', { p_group: groupId, p_officer: rows.toRow(parsed) }));
}

export const removeOfficer = async (_groupId: string, officerId: string) => void (await run(table('officers').delete().eq('id', officerId)));

/** Messages from every group the signed-in person belongs to, newest first, and how many are new. Null when not in the parish. */
export async function getMyMessages(): Promise<{ messages: GroupMessage[]; unread: number; lastRead: string } | null> {
  if (!(await getAccount())) return null;
  const mine = await rpc<{ messages: Row[]; unread: number; last_read: string | null } | null>('get_my_messages', { p_parish: p() });
  if (!mine) return null;
  return { messages: mine.messages.map(rows.groupMessage), unread: mine.unread, lastRead: mine.last_read ? new Date(mine.last_read).toISOString() : '' };
}

export const markMessagesRead = async () => void (await rpc('mark_messages_read', { p_parish: p() }));

/**
 * What the signed-in person can do in a group: read its messages (members), send messages and answer
 * requests to join (office-bearers), or ask to join (anyone in the parish, for joinable groups).
 */
export async function getGroupAccess(groupId: string) {
  if (!(await getAccount())) return null;
  const access = await rpc<{
    member: boolean;
    post: Officer['role'] | null;
    pending: boolean;
    can_join: boolean;
    recipients: number;
    messages: Row[];
    requests: Row[];
  } | null>('get_group_access', { p_group: groupId });
  if (!access) return null;
  return {
    member: access.member,
    post: access.post ?? undefined,
    pending: access.pending,
    canJoin: access.can_join,
    recipients: access.recipients,
    messages: access.messages.map(rows.groupMessage),
    requests: access.requests.map(rows.officer),
  };
}

/** An office-bearer sends a message, or a news article, to everyone in their group. */
export async function sendGroupMessage(groupId: string, input: GroupPostInput): Promise<GroupMessage> {
  const { title, body } = groupPostSchema.parse(input);
  return rows.groupMessage(await rpc<Row>('send_group_message', { p_group: groupId, p_title: title ?? null, p_body: body }));
}

/** The parish office sends a message, or a news article, to a group's members. */
export async function sendOfficeMessage(groupId: string, input: GroupPostInput): Promise<GroupMessage> {
  const { title, body } = groupPostSchema.parse(input);
  const row = { parish_id: p(), group_id: groupId, title: title ?? null, body, sender: 'Parish office', sender_role: 'office' };
  return rows.groupMessage(await run(table('group_messages').insert(row).select().single()));
}

export const listGroupMessages = async (groupId: string): Promise<GroupMessage[]> =>
  (await run(table('group_messages').select('*').eq('group_id', groupId).order('sent_at', { ascending: false }))).map(rows.groupMessage);

export const deleteMessage = async (id: string) => void (await run(table('group_messages').delete().eq('id', id)));

/** Asks to join a ministry, association or faith formation group; its office-bearers approve. */
export const askToJoinGroup = async (groupId: string) => void (await rpc('ask_to_join_group', { p_group: groupId }));

/** An office-bearer (or the office) approves or declines a request to join. */
export const answerJoinRequest = async (groupId: string, officerId: string, approve: boolean) =>
  void (await rpc('answer_join_request', { p_group: groupId, p_officer: officerId, p_approve: approve }));
