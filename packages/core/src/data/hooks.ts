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
export const useRoster = () => useQuery({ queryKey: queryKeys.roster, queryFn: api.listRoster });

function useChange<TArgs extends unknown[], TResult>(key: QueryKey, change: (...args: TArgs) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => change(...args),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
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

export function useResetDemoData() {
  const client = useQueryClient();
  return useMutation({ mutationFn: resetDemoData, onSuccess: () => client.invalidateQueries() });
}

/** Refreshes every query when the other app changes the shared demo data. Call once, in the root layout. */
export function useDemoDataSync() {
  const client = useQueryClient();
  useEffect(() => subscribeToDemoData(() => void client.invalidateQueries()), [client]);
}
