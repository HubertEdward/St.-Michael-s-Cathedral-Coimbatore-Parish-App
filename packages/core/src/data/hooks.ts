// TanStack Query bindings for api.ts. Mutations refresh the lists they touch.
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';

import * as api from './api';
import { resetDemoData } from './store';

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
export const useCertificateRequests = () =>
  useQuery({ queryKey: queryKeys.certificates, queryFn: api.listCertificateRequests });
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
