// TanStack Query bindings for api.ts. Mutations refresh the lists they touch.
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect } from 'react';

import * as api from './api';
import { resetDemoData, subscribeToDemoData } from './store';

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

/** A mutation that refreshes the queries under `key`, and under `also` when the change shows there too. */
function useChange<TArgs extends unknown[], TResult>(key: QueryKey, change: (...args: TArgs) => Promise<TResult>, also?: QueryKey) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => change(...args),
    onSuccess: () => Promise.all([key, also].filter((k) => k !== undefined).map((queryKey) => client.invalidateQueries({ queryKey }))),
  });
}

export const useSaveService = () => useChange(queryKeys.services, api.saveService);
export const useDeleteService = () => useChange(queryKeys.services, api.deleteService);
export const useSaveAnnouncement = () => useChange(queryKeys.announcements, api.saveAnnouncement);
export const useDeleteAnnouncement = () => useChange(queryKeys.announcements, api.deleteAnnouncement);
export const useSaveEvent = () => useChange(queryKeys.events, api.saveEvent);
export const useDeleteEvent = () => useChange(queryKeys.events, api.deleteEvent);
export const useSubmitIntention = () => useChange(queryKeys.intentions, api.submitIntention);
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
export const useSignIn = () => useChange(queryKeys.family, api.signIn);
export const useSignOut = () => useChange(queryKeys.family, api.signOut);
export const useCreateAccount = () => useChange(queryKeys.family, api.createAccount);
export const useResetPin = () => useChange(queryKeys.family, api.resetPin);
export const useIssuePinReset = () => useChange(queryKeys.family, api.issuePinReset);
export const useRegisterFamily = () => useChange(queryKeys.family, api.registerFamily);
export const useRequestToJoinFamily = () => useChange(queryKeys.family, api.requestToJoinFamily);
export const useAddFamilyMember = () => useChange(queryKeys.family, api.addFamilyMember);
export const useSetFamilyStatus = () => useChange(queryKeys.family, api.setFamilyStatus);
export const useSetMemberStatus = () => useChange(queryKeys.family, api.setMemberStatus);
export const useSetFamilyAnbiyam = () => useChange(queryKeys.family, api.setFamilyAnbiyam);
export const useRemoveFamily = () => useChange(queryKeys.family, api.removeFamily, queryKeys.groups);
export const useAskToRejoinParish = () => useChange(queryKeys.family, api.askToRejoinParish);

// A family's screen shows its Anbiyam, so group changes refresh it too.
export const useGroups = () => useQuery({ queryKey: queryKeys.groups, queryFn: api.listGroups });
export const useSaveGroup = () => useChange(queryKeys.groups, api.saveGroup, queryKeys.family);
export const useDeleteGroup = () => useChange(queryKeys.groups, api.deleteGroup, queryKeys.family);
export const useAddOfficer = () => useChange(queryKeys.groups, api.addOfficer, queryKeys.family);
export const useRemoveOfficer = () => useChange(queryKeys.groups, api.removeOfficer, queryKeys.family);

export function useResetDemoData() {
  const client = useQueryClient();
  return useMutation({ mutationFn: resetDemoData, onSuccess: () => client.invalidateQueries() });
}

/** Refreshes every query when the other app changes the shared demo data. Call once, in the root layout. */
export function useDemoDataSync() {
  const client = useQueryClient();
  useEffect(() => subscribeToDemoData(() => void client.invalidateQueries()), [client]);
}
