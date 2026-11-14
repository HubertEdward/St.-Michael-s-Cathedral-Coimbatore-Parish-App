// The only functions screens use to read and change parish data.
// Thrown Error messages are codes the apps translate: 'massNotOnDate', 'massOutOfRange'.
import { nextDebitOn } from '../giving';
import { joinableKinds } from '../types';
import { parishClock, parishTimeToIso } from '../parish';
import { addDays, weekdayOf } from '../schedule';
import type {
  Account,
  Announcement,
  CertificateRequest,
  Family,
  FamilyMember,
  GroupMessage,
  FamilyWithMembers,
  MassIntention,
  MembershipStatus,
  Officer,
  ParishEvent,
  ParishGroup,
  RequestStatus,
  RosterEntry,
  Service,
  Subscription,
  SubscriptionStatus,
} from '../types';
import {
  announcementInputSchema,
  certificateInputSchema,
  eventInputSchema,
  familyInputSchema,
  joinFamilySchema,
  memberInputSchema,
  groupInputSchema,
  officerInputSchema,
  removalInputSchema,
  messageSchema,
  type GroupInput,
  type OfficerInput,
  type RemovalInput,
  signInSchema,
  createAccountSchema,
  resetPinSchema,
  type CreateAccountInput,
  type ResetPinInput,
  intentionInputSchema,
  rosterInputSchema,
  serviceInputSchema,
  subscriptionAmountSchema,
  subscriptionInputSchema,
  type AnnouncementInput,
  type CertificateInput,
  type EventInput,
  type FamilyInput,
  type JoinFamilyInput,
  type MemberInput,
  type IntentionInput,
  type RosterInput,
  type ServiceInput,
  type SubscriptionInput,
} from '../validation';
import { familyCodePrefix, type ParishData } from './seed';
import { newId, read, write } from './store';

const byTime = (a: Service, b: Service) => a.day - b.day || a.time.localeCompare(b.time);
const newestFirst = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

function upsert<T extends { id: string }>(list: T[], item: T) {
  const index = list.findIndex((existing) => existing.id === item.id);
  if (index === -1) list.push(item);
  else list[index] = item;
}

function remove<T extends { id: string }>(list: T[], id: string) {
  const index = list.findIndex((item) => item.id === id);
  if (index !== -1) list.splice(index, 1);
}

// Timetable

export const listServices = () => read((d) => [...d.services].sort(byTime));

export const saveService = (input: ServiceInput, id?: string) =>
  write((d) => {
    const parsed = serviceInputSchema.parse(input);
    const service: Service = {
      id: id ?? newId(),
      kind: parsed.kind,
      day: parsed.day as Service['day'],
      time: parsed.time,
      language: parsed.language,
      place: parsed.place ? { en: parsed.place } : undefined,
      note: parsed.note ? { en: parsed.note } : undefined,
    };
    upsert(d.services, service);
    return service;
  });

export const deleteService = (id: string) => write((d) => remove(d.services, id));

// Announcements

export const listAnnouncements = () =>
  read((d) =>
    [...d.announcements].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt),
    ),
  );

export const getAnnouncement = (id: string) => read((d) => d.announcements.find((a) => a.id === id) ?? null);

export const saveAnnouncement = (input: AnnouncementInput, id?: string) =>
  write((d) => {
    const parsed = announcementInputSchema.parse(input);
    const existing = d.announcements.find((a) => a.id === id);
    const announcement: Announcement = {
      id: id ?? newId(),
      ...parsed,
      publishedAt: existing?.publishedAt ?? new Date().toISOString(),
    };
    upsert(d.announcements, announcement);
    return announcement;
  });

export const deleteAnnouncement = (id: string) => write((d) => remove(d.announcements, id));

// Events

export const listEvents = () => read((d) => [...d.events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));

export const getEvent = (id: string) => read((d) => d.events.find((e) => e.id === id) ?? null);

export const saveEvent = (input: EventInput, id?: string) =>
  write((d) => {
    const parsed = eventInputSchema.parse(input);
    const event: ParishEvent = {
      id: id ?? newId(),
      title: parsed.title,
      description: parsed.description,
      startsAt: parishTimeToIso(parsed.date, parsed.time),
      place: parsed.place ? { en: parsed.place } : undefined,
    };
    upsert(d.events, event);
    return event;
  });

export const deleteEvent = (id: string) => write((d) => remove(d.events, id));

// Mass intentions

export const listIntentions = () => read((d) => [...d.intentions].sort(newestFirst));

export const submitIntention = (input: IntentionInput) =>
  write((d) => {
    const parsed = intentionInputSchema.parse(input);
    const service = d.services.find((s) => s.id === parsed.serviceId);
    if (!service || weekdayOf(parsed.massDate) !== service.day) {
      throw new Error('massNotOnDate');
    }
    const today = parishClock().date;
    if (parsed.massDate < today || parsed.massDate > addDays(today, 90)) {
      throw new Error('massOutOfRange');
    }
    const intention: MassIntention = {
      id: newId(),
      ...parsed,
      note: parsed.note || undefined,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };
    d.intentions.push(intention);
    d.mine.push(intention.id);
    return intention;
  });

/** Intentions requested in this parishioner app. */
export const listMyIntentions = () =>
  read((d) => d.intentions.filter((i) => d.mine.includes(i.id)).sort(newestFirst));

export const setIntentionStatus = (id: string, status: RequestStatus) =>
  write((d) => {
    const intention = d.intentions.find((i) => i.id === id);
    if (intention) intention.status = status;
  });

// Certificate requests

export const listCertificateRequests = () => read((d) => [...d.certificates].sort(newestFirst));

export const submitCertificateRequest = (input: CertificateInput) =>
  write((d) => {
    const parsed = certificateInputSchema.parse(input);
    const request: CertificateRequest = {
      id: newId(),
      ...parsed,
      sacramentDate: parsed.sacramentDate || undefined,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };
    d.certificates.push(request);
    d.mine.push(request.id);
    return request;
  });

/** Certificate requests made in this parishioner app. */
export const listMyCertificateRequests = () =>
  read((d) => d.certificates.filter((c) => d.mine.includes(c.id)).sort(newestFirst));

export const updateCertificateRequest = (id: string, status: RequestStatus, officeNote?: string) =>
  write((d) => {
    const request = d.certificates.find((c) => c.id === id);
    if (request) Object.assign(request, { status, officeNote: officeNote || undefined });
  });

// Ministry rosters

export const listRoster = () =>
  read((d) => [...d.roster].sort((a, b) => a.date.localeCompare(b.date) || a.serviceId.localeCompare(b.serviceId)));

export const saveRosterEntry = (input: RosterInput) =>
  write((d) => {
    const entry: RosterEntry = { id: newId(), ...rosterInputSchema.parse(input) };
    d.roster.push(entry);
    return entry;
  });

export const deleteRosterEntry = (id: string) => write((d) => remove(d.roster, id));

// Monthly subscriptions (no money moves in the demo)

export const listSubscriptions = () => read((d) => [...d.subscriptions].sort(newestFirst));

/** Subscriptions set up in this parishioner app, newest first. */
export const listMySubscriptions = () =>
  read((d) => d.subscriptions.filter((s) => d.mine.includes(s.id)).sort(newestFirst));

export const startSubscription = (input: SubscriptionInput) =>
  write((d) => {
    const parsed = subscriptionInputSchema.parse(input);
    const subscription: Subscription = {
      id: newId(),
      ...parsed,
      status: 'active',
      startsOn: nextDebitOn(parsed.debitDay, parishClock().date),
      createdAt: new Date().toISOString(),
    };
    d.subscriptions.push(subscription);
    d.mine.push(subscription.id);
    return subscription;
  });

export const setSubscriptionStatus = (id: string, status: SubscriptionStatus) =>
  write((d) => {
    const subscription = d.subscriptions.find((s) => s.id === id);
    if (subscription) subscription.status = status;
  });

export const changeSubscriptionAmount = (id: string, amount: number) =>
  write((d) => {
    const subscription = d.subscriptions.find((s) => s.id === id);
    if (subscription) subscription.amount = subscriptionAmountSchema.parse(amount);
  });

// Families and members. Thrown codes: 'notSignedIn', 'alreadyInFamily', 'familyNotFound',
// and for signing in 'noAccount', 'accountExists', 'wrongPin', 'resetCodeInvalid'.

/** The last ten digits, so "+91 98430 20001" and "9843020001" match. */
const phoneKey = (phone: string) => phone.replace(/\D/g, '').slice(-10);

function myMembership(d: ParishData): FamilyMember | undefined {
  const account = d.account;
  if (!account) return undefined;
  return d.members.find((m) => m.phone && phoneKey(m.phone) === phoneKey(account.phone) && m.status !== 'declined');
}

function withMembers(d: ParishData, family: Family): FamilyWithMembers {
  return { ...family, members: d.members.filter((m) => m.familyId === family.id && m.status !== 'declined') };
}

export const getAccount = () => read((d): Account | null => d.account);

const loginFor = (d: ParishData, phone: string) => d.logins.find((l) => phoneKey(l.phone) === phoneKey(phone));

/** Signs in on this phone with the number and PIN the person chose. */
export const signIn = (input: { phone: string; pin: string }) =>
  write((d) => {
    const { phone, pin } = signInSchema.parse(input);
    const login = loginFor(d, phone);
    if (!login) throw new Error('noAccount');
    if (login.pin !== pin) throw new Error('wrongPin');
    d.account = { phone: login.phone };
    return d.account;
  });

/** First time on the app: chooses a PIN for this number and signs in. */
export const createAccount = (input: CreateAccountInput) =>
  write((d) => {
    const { phone, pin } = createAccountSchema.parse(input);
    if (loginFor(d, phone)) throw new Error('accountExists');
    d.logins.push({ phone, pin });
    d.account = { phone };
    return d.account;
  });

/** Sets a new PIN with the reset code the parish office gave, and signs in. */
export const resetPin = (input: ResetPinInput) =>
  write((d) => {
    const { phone, code, pin } = resetPinSchema.parse(input);
    const now = new Date().toISOString();
    const reset = d.pinResets.find((r) => phoneKey(r.phone) === phoneKey(phone) && r.code === code && r.expiresAt > now);
    if (!reset) throw new Error('resetCodeInvalid');
    d.pinResets = d.pinResets.filter((r) => r !== reset);
    const login = loginFor(d, phone);
    if (login) login.pin = pin;
    else d.logins.push({ phone, pin });
    d.account = { phone: login?.phone ?? phone };
    return d.account;
  });

/** For the parish office: a 6-digit code, valid for 24 hours, that lets this number choose a new PIN. */
export const issuePinReset = (phone: string) =>
  write((d) => {
    const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    d.pinResets = [...d.pinResets.filter((r) => phoneKey(r.phone) !== phoneKey(phone)), { phone, code, expiresAt }];
    return { code, expiresAt };
  });

export const signOut = () =>
  write((d) => {
    d.account = null;
  });

/**
 * The signed-in person's family and their own membership, or null if they have none yet.
 * Someone still waiting to join an existing family sees only the family's name and their own request,
 * not its members or address, until the parish office approves them.
 */
export const getMyFamily = () =>
  read((d) => {
    const me = myMembership(d);
    const family = me && d.families.find((f) => f.id === me.familyId);
    if (!me || !family) return null;
    const waitingToJoin = family.status === 'approved' && me.status !== 'approved';
    if (waitingToJoin) return { family: { ...family, address: '', anbiyamId: undefined, members: [me] }, me, anbiyam: undefined };
    return { family: withMembers(d, family), me, anbiyam: d.groups.find((g) => g.id === family.anbiyamId) };
  });

/** A member of a family the parish priest removed asks for it to be taken back into the parish. */
export const askToRejoinParish = () =>
  write((d) => {
    const me = myMembership(d);
    const family = me && d.families.find((f) => f.id === me.familyId);
    if (!family || family.status !== 'removed') throw new Error('notSignedIn');
    family.status = 'pending';
  });

function signedInWithoutFamily(d: ParishData): Account {
  if (!d.account) throw new Error('notSignedIn');
  if (myMembership(d)) throw new Error('alreadyInFamily');
  return d.account;
}

/** Registers a new family with the signed-in person as its head; the parish office approves it. */
export const registerFamily = (input: FamilyInput) =>
  write((d) => {
    const account = signedInWithoutFamily(d);
    const parsed = familyInputSchema.parse(input);
    const next = Math.max(100, ...d.families.map((f) => Number(f.code.split('-')[1]) || 0)) + 1;
    const now = new Date().toISOString();
    const family: Family = {
      id: newId(),
      code: `${familyCodePrefix()}-${String(next).padStart(4, '0')}`,
      name: parsed.familyName,
      address: parsed.address,
      preferredAnbiyamId: parsed.preferredAnbiyamId || undefined,
      status: 'pending',
      createdAt: now,
    };
    d.families.push(family);
    d.members.push({
      id: newId(),
      familyId: family.id,
      name: parsed.headName,
      relationship: 'head',
      phone: account.phone,
      status: 'pending',
      createdAt: now,
    });
    return family;
  });

/** Asks to join a registered family by its code; the parish office approves it. */
export const requestToJoinFamily = (input: JoinFamilyInput) =>
  write((d) => {
    const account = signedInWithoutFamily(d);
    const parsed = joinFamilySchema.parse(input);
    const family = d.families.find((f) => f.code.toUpperCase() === parsed.code.toUpperCase() && f.status === 'approved');
    if (!family) throw new Error('familyNotFound');
    const request: FamilyMember = {
      id: newId(),
      familyId: family.id,
      name: parsed.name,
      relationship: parsed.relationship,
      phone: account.phone,
      birthDate: parsed.birthDate || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    d.members.push(request);
    return request;
  });

/** A member adds someone without their own phone, such as a child; the parish office approves it. */
export const addFamilyMember = (input: MemberInput) =>
  write((d) => {
    const me = myMembership(d);
    if (!me) throw new Error('notSignedIn');
    const parsed = memberInputSchema.parse(input);
    const added: FamilyMember = {
      id: newId(),
      familyId: me.familyId,
      name: parsed.name,
      relationship: parsed.relationship,
      birthDate: parsed.birthDate || undefined,
      status: 'pending',
      addedBy: me.name,
      createdAt: new Date().toISOString(),
    };
    d.members.push(added);
    return added;
  });

/** Every family with its members, newest registration first. */
export const listFamilies = () => read((d) => [...d.families].sort(newestFirst).map((f) => withMembers(d, f)));

/** Approving a family approves its head too; declining it declines everyone still waiting in it. */
export const setFamilyStatus = (id: string, status: MembershipStatus) =>
  write((d) => {
    const family = d.families.find((f) => f.id === id);
    if (!family) return;
    family.status = status;
    if (status === 'approved') delete family.removal;
    for (const m of d.members) {
      if (m.familyId !== id || m.status !== 'pending') continue;
      if (status === 'declined' || m.relationship === 'head') m.status = status;
    }
  });

export const setMemberStatus = (id: string, status: MembershipStatus) =>
  write((d) => {
    const m = d.members.find((x) => x.id === id);
    if (m) m.status = status;
  });

/** Onboards a family to its Anbiyam, or moves it to another. */
export const setFamilyAnbiyam = (familyId: string, anbiyamId: string) =>
  write((d) => {
    const family = d.families.find((f) => f.id === familyId);
    if (family) family.anbiyamId = anbiyamId;
  });

/**
 * The parish priest removes a family that has left the parish, e.g. after moving out of the area.
 * The family keeps its record and code; it leaves its Anbiyam, and its members leave any posts they held.
 */
export const removeFamily = (familyId: string, input: RemovalInput) =>
  write((d) => {
    const family = d.families.find((f) => f.id === familyId);
    if (!family) return;
    const { reason, note } = removalInputSchema.parse(input);
    family.status = 'removed';
    family.removal = { reason, ...(note ? { note } : {}), on: parishClock(new Date()).date };
    delete family.anbiyamId;
    const members = new Set(d.members.filter((m) => m.familyId === familyId).map((m) => m.id));
    for (const group of d.groups) group.officers = group.officers.filter((o) => !o.memberId || !members.has(o.memberId));
  });

// Groups: councils, Anbiyams, ministries, associations and faith formation. Thrown code: 'anbiyamHasFamilies'.
// Messages and joining: 'notInParish' (not an approved member of an approved family), 'notGroupLeader', 'cannotJoin'.

const localized = (en: string | undefined, ta: string | undefined) => (en ? { en, ...(ta ? { ta } : {}) } : undefined);

export const listGroups = () => read((d) => d.groups);

/** Creates a group, or edits one when `id` is given; its officers stay as they are. */
export const saveGroup = (input: GroupInput, id?: string) =>
  write((d) => {
    const p = groupInputSchema.parse(input);
    const existing = id ? d.groups.find((g) => g.id === id) : undefined;
    const group: ParishGroup = {
      id: existing?.id ?? newId(),
      kind: p.kind,
      name: localized(p.name, p.nameTa)!,
      description: localized(p.description, p.descriptionTa) ?? { en: '' },
      area: localized(p.area, p.areaTa),
      meets: localized(p.meets, p.meetsTa),
      term: p.termFrom && p.termTo ? { from: p.termFrom, to: p.termTo } : undefined,
      officers: existing?.officers ?? [],
    };
    upsert(d.groups, group);
    return group;
  });

export const deleteGroup = (id: string) =>
  write((d) => {
    if (d.families.some((f) => f.anbiyamId === id)) throw new Error('anbiyamHasFamilies');
    remove(d.groups, id);
  });

/** Gives someone a post in a group. Every post but "member" has one holder, who is replaced. */
export const addOfficer = (groupId: string, input: OfficerInput) =>
  write((d) => {
    const group = d.groups.find((g) => g.id === groupId);
    if (!group) return undefined;
    const p = officerInputSchema.parse(input);
    const council = group.kind === 'council';
    const officer: Officer = {
      id: newId(),
      role: p.role,
      name: p.name,
      ...(p.phone ? { phone: p.phone } : {}),
      ...(p.memberId ? { memberId: p.memberId } : {}),
      ...(council && p.seat ? { seat: p.seat } : {}),
      ...(council && p.seat === 'anbiyam' && p.representsId ? { representsId: p.representsId } : {}),
    };
    group.officers = [...group.officers.filter((o) => p.role === 'member' || o.role !== p.role), officer];
    return officer;
  });

export const removeOfficer = (groupId: string, officerId: string) =>
  write((d) => {
    const group = d.groups.find((g) => g.id === groupId);
    if (group) group.officers = group.officers.filter((o) => o.id !== officerId);
  });

/** The signed-in person, if they are an approved member of a family that belongs to the parish. */
function parishioner(d: ParishData): FamilyMember | undefined {
  const me = myMembership(d);
  const family = me && d.families.find((f) => f.id === me.familyId);
  return me?.status === 'approved' && family?.status === 'approved' ? me : undefined;
}

/** The people who receive a group's messages: an Anbiyam's families, or a group's listed people. */
function recipients(d: ParishData, group: ParishGroup): string[] {
  if (group.kind === 'anbiyam') {
    const families = new Set(d.families.filter((f) => f.status === 'approved' && f.anbiyamId === group.id).map((f) => f.id));
    return d.members.filter((m) => m.status === 'approved' && families.has(m.familyId)).map((m) => m.id);
  }
  return group.officers.filter((o) => o.memberId && !o.pending).map((o) => o.memberId!);
}

/** The post `memberId` holds in a group (not counting a plain member), if any. */
const postIn = (group: ParishGroup, memberId: string) => group.officers.find((o) => o.memberId === memberId && o.role !== 'member' && !o.pending);

const newestSent = (a: GroupMessage, b: GroupMessage) => b.sentAt.localeCompare(a.sentAt);

/** Messages from every group the signed-in person belongs to, newest first, and how many are new. Null when not in the parish. */
export const getMyMessages = () =>
  read((d) => {
    const me = parishioner(d);
    if (!me) return null;
    const mine = new Set(d.groups.filter((g) => recipients(d, g).includes(me.id)).map((g) => g.id));
    const messages = d.messages.filter((m) => mine.has(m.groupId)).sort(newestSent);
    const lastRead = d.lastRead[me.id] ?? '';
    return { messages, unread: messages.filter((m) => m.sentAt > lastRead).length, lastRead };
  });

export const markMessagesRead = () =>
  write((d) => {
    const me = parishioner(d);
    if (me) d.lastRead[me.id] = new Date().toISOString();
  });

/**
 * What the signed-in person can do in a group: read its messages (members), send messages and
 * answer requests to join (office-bearers), or ask to join (anyone in the parish, for joinable groups).
 */
export const getGroupAccess = (groupId: string) =>
  read((d) => {
    const group = d.groups.find((g) => g.id === groupId);
    const me = parishioner(d);
    if (!group || !me) return null;
    const people = recipients(d, group);
    const member = people.includes(me.id);
    const post = postIn(group, me.id);
    return {
      member,
      post: post?.role,
      pending: group.officers.some((o) => o.memberId === me.id && o.pending),
      canJoin: !member && joinableKinds.includes(group.kind),
      recipients: people.length,
      messages: member || post ? d.messages.filter((m) => m.groupId === groupId).sort(newestSent) : [],
      requests: post ? group.officers.filter((o) => o.pending) : [],
    };
  });

/** An office-bearer sends a message to everyone in their group. */
export const sendGroupMessage = (groupId: string, body: string) =>
  write((d) => {
    const me = parishioner(d);
    const group = d.groups.find((g) => g.id === groupId);
    if (!me || !group) throw new Error('notInParish');
    const post = postIn(group, me.id);
    if (!post) throw new Error('notGroupLeader');
    const message: GroupMessage = { id: newId(), groupId, body: messageSchema.parse(body), sender: post.name, senderRole: post.role, sentAt: new Date().toISOString() };
    d.messages.push(message);
    return message;
  });

/** The parish office sends a message to a group's members. */
export const sendOfficeMessage = (groupId: string, body: string) =>
  write((d) => {
    const message: GroupMessage = { id: newId(), groupId, body: messageSchema.parse(body), sender: 'Parish office', senderRole: 'office', sentAt: new Date().toISOString() };
    d.messages.push(message);
    return message;
  });

export const listGroupMessages = (groupId: string) => read((d) => d.messages.filter((m) => m.groupId === groupId).sort(newestSent));

export const deleteMessage = (id: string) => write((d) => remove(d.messages, id));

/** Asks to join a ministry, association or faith formation group; its office-bearers approve. */
export const askToJoinGroup = (groupId: string) =>
  write((d) => {
    const me = parishioner(d);
    const group = d.groups.find((g) => g.id === groupId);
    if (!me || !group) throw new Error('notInParish');
    if (!joinableKinds.includes(group.kind) || group.officers.some((o) => o.memberId === me.id)) throw new Error('cannotJoin');
    group.officers.push({ id: newId(), role: 'member', name: me.name, memberId: me.id, ...(me.phone ? { phone: me.phone } : {}), pending: true });
  });

/** An office-bearer (or the office) approves or declines a request to join. */
export const answerJoinRequest = (groupId: string, officerId: string, approve: boolean) =>
  write((d) => {
    const group = d.groups.find((g) => g.id === groupId);
    const request = group?.officers.find((o) => o.id === officerId && o.pending);
    if (!group || !request) return;
    if (approve) delete request.pending;
    else group.officers = group.officers.filter((o) => o !== request);
  });
