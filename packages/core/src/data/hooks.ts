// TanStack Query bindings for api.ts. Mutations refresh the lists they touch.
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';

import * as api from './api';

export const queryKeys = {
  services: ['services'],
  announcements: ['announcements'],
  events: ['events'],
  intentions: ['intentions'],
  certificates: ['certificates'],
  roster: ['roster'],
  subscriptions: ['subscriptions'],
  family: ['family'],
  groups: ['groups'],
  messages: ['messages'],
  settings: ['settings'],
  office: ['office'],
  songs: ['songs'],
} as const;

export const useServices = () => useQuery({ queryKey: queryKeys.services, queryFn: api.listServices });
export const useAnnouncements = () => useQuery({ queryKey: queryKeys.announcements, queryFn: api.listAnnouncements });
export const useAnnouncement = (id: string) =>
  useQuery({ queryKey: [...queryKeys.announcements, id], queryFn: () => api.getAnnouncement(id) });
export const useEvents = () => useQuery({ queryKey: queryKeys.events, queryFn: api.listEvents });
export const useEvent = (id: string) => useQuery({ queryKey: [...queryKeys.events, id], queryFn: () => api.getEvent(id) });
export const useIntentions = () => useQuery({ queryKey: queryKeys.intentions, queryFn: api.listIntentions });
export const useMyIntentions = () => useQuery({ queryKey: [...queryKeys.intentions, 'mine'], queryFn: api.listMyIntentions });
export const useCertificateRequests = () =>
  useQuery({ queryKey: queryKeys.certificates, queryFn: api.listCertificateRequests });
export const useMyCertificateRequests = () =>
  useQuery({ queryKey: [...queryKeys.certificates, 'mine'], queryFn: api.listMyCertificateRequests });
export const useSubscriptions = () => useQuery({ queryKey: queryKeys.subscriptions, queryFn: api.listSubscriptions });
export const useMySubscriptions = () =>
  useQuery({ queryKey: [...queryKeys.subscriptions, 'mine'], queryFn: api.listMySubscriptions });
export const useRoster = () => useQuery({ queryKey: queryKeys.roster, queryFn: api.listRoster });
export const useSettings = () => useQuery({ queryKey: queryKeys.settings, queryFn: api.getSettings });
// The songbook changes rarely, and the phone keeps a copy; checking once an hour is plenty.
export const useSongs = () => useQuery({ queryKey: queryKeys.songs, queryFn: api.listSongs, staleTime: 3_600_000 });

/** A mutation that refreshes the queries under `key`, and under each of `also` when the change shows there too. */
function useChange<TArgs extends unknown[], TResult>(key: QueryKey, change: (...args: TArgs) => Promise<TResult>, ...also: QueryKey[]) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => change(...args),
    onSuccess: () => Promise.all([key, ...also].map((queryKey) => client.invalidateQueries({ queryKey }))),
  });
}

/** A sign-in or sign-out: everything is refetched as the new person. */
function useAccountChange<TArgs extends unknown[], TResult>(change: (...args: TArgs) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => change(...args),
    onSuccess: () => client.invalidateQueries(),
  });
}

export const useSaveService = () => useChange(queryKeys.services, api.saveService);
export const useDeleteService = () => useChange(queryKeys.services, api.deleteService);
export const useSaveAnnouncement = () => useChange(queryKeys.announcements, api.saveAnnouncement);
export const useDeleteAnnouncement = () => useChange(queryKeys.announcements, api.deleteAnnouncement);
export const useSaveEvent = () => useChange(queryKeys.events, api.saveEvent);
export const useDeleteEvent = () => useChange(queryKeys.events, api.deleteEvent);
export const useSubmitIntention = () => useChange(queryKeys.intentions, api.submitIntention);
export const useUpdateSettings = () => useChange(queryKeys.settings, api.updateSettings);
export const useSetIntentionStatus = () => useChange(queryKeys.intentions, api.setIntentionStatus);
export const useSubmitCertificateRequest = () => useChange(queryKeys.certificates, api.submitCertificateRequest);
export const useUpdateCertificateRequest = () => useChange(queryKeys.certificates, api.updateCertificateRequest);
export const useSaveRosterEntry = () => useChange(queryKeys.roster, api.saveRosterEntry);
export const useDeleteRosterEntry = () => useChange(queryKeys.roster, api.deleteRosterEntry);

export const useStartSubscription = () => useChange(queryKeys.subscriptions, api.startSubscription);
export const useSetSubscriptionStatus = () => useChange(queryKeys.subscriptions, api.setSubscriptionStatus);
export const useChangeSubscriptionAmount = () => useChange(queryKeys.subscriptions, api.changeSubscriptionAmount);

export const useAccount = () => useQuery({ queryKey: [...queryKeys.family, 'account'], queryFn: api.getAccount });
export const useMyFamily = () => useQuery({ queryKey: [...queryKeys.family, 'mine'], queryFn: api.getMyFamily });
export const useFamilies = () => useQuery({ queryKey: [...queryKeys.family, 'all'], queryFn: api.listFamilies });
// Signing in or out changes what every query may see, so these refresh everything.
export const useSignIn = () => useAccountChange(api.signIn);
export const useSignOut = () => useAccountChange(api.signOut);
export const useCreateAccount = () => useAccountChange(api.createAccount);
export const useResetPin = () => useAccountChange(api.resetPin);
export const useIssuePinReset = () => useChange(queryKeys.family, api.issuePinReset);
export const useRegisterFamily = () => useChange(queryKeys.family, api.registerFamily);
export const useRequestToJoinFamily = () => useChange(queryKeys.family, api.requestToJoinFamily);
export const useAddFamilyMembers = () => useChange(queryKeys.family, api.addFamilyMembers);
export const useUpdateFamilyMember = () => useChange(queryKeys.family, api.updateFamilyMember);
export const useSetFamilyStatus = () => useChange(queryKeys.family, api.setFamilyStatus);
export const useSetMemberStatus = () => useChange(queryKeys.family, api.setMemberStatus);
export const useSetFamilyAnbiyam = () => useChange(queryKeys.family, api.setFamilyAnbiyam, queryKeys.groups, queryKeys.messages);
export const useRemoveFamily = () => useChange(queryKeys.family, api.removeFamily, queryKeys.groups, queryKeys.messages);
export const useAskToRejoinParish = () => useChange(queryKeys.family, api.askToRejoinParish);

// A family's screen shows its Anbiyam, so group changes refresh it too.
export const useGroups = () => useQuery({ queryKey: queryKeys.groups, queryFn: api.listGroups });
export const useSaveGroup = () => useChange(queryKeys.groups, api.saveGroup, queryKeys.family);
export const useDeleteGroup = () => useChange(queryKeys.groups, api.deleteGroup, queryKeys.family);
export const useAddOfficer = () => useChange(queryKeys.groups, api.addOfficer, queryKeys.family, queryKeys.messages);
export const useRemoveOfficer = () => useChange(queryKeys.groups, api.removeOfficer, queryKeys.family, queryKeys.messages);

// Messages to groups. A group's page reads its access (and messages) under the messages key.
export const useMyMessages = () => useQuery({ queryKey: [...queryKeys.messages, 'mine'], queryFn: api.getMyMessages });
export const useGroupAccess = (groupId: string) =>
  useQuery({ queryKey: [...queryKeys.messages, 'access', groupId], queryFn: () => api.getGroupAccess(groupId) });
export const useGroupMessages = (groupId: string) =>
  useQuery({ queryKey: [...queryKeys.messages, 'group', groupId], queryFn: () => api.listGroupMessages(groupId) });
export const useMarkMessagesRead = () => useChange(queryKeys.messages, api.markMessagesRead);
export const useSendGroupMessage = () => useChange(queryKeys.messages, api.sendGroupMessage);
export const useSendOfficeMessage = () => useChange(queryKeys.messages, api.sendOfficeMessage);
export const useDeleteMessage = () => useChange(queryKeys.messages, api.deleteMessage);
export const useAskToJoinGroup = () => useChange(queryKeys.messages, api.askToJoinGroup, queryKeys.groups);
export const useAnswerJoinRequest = () => useChange(queryKeys.messages, api.answerJoinRequest, queryKeys.groups);

// The office app's sign-in and team.
export const useOfficeAccount = () => useQuery({ queryKey: [...queryKeys.office, 'me'], queryFn: api.getOfficeAccount });
export const useOfficeUsers = () => useQuery({ queryKey: [...queryKeys.office, 'team'], queryFn: api.listOfficeUsers });
export const useOfficeSignIn = () => useAccountChange(api.officeSignIn);
export const useOfficeSetUp = () => useAccountChange(api.officeSetUp);
export const useOfficeSignOut = () => useAccountChange(api.officeSignOut);
export const useAddOfficeUser = () => useChange(queryKeys.office, api.addOfficeUser);
export const useIssueOfficeCode = () => useChange(queryKeys.office, api.issueOfficeCode);
export const useRemoveOfficeUser = () => useChange(queryKeys.office, api.removeOfficeUser);
