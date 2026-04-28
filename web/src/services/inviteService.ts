import api from '@/lib/axios';
import type { ApiResponse, SuccessResponse } from '@/types/common';
import type { SessionInvite } from '@/types/session';

export const inviteService = {
  list: () =>
    api.get<ApiResponse<SessionInvite[]>>('/invites'),

  get: (id: string) =>
    api.get<ApiResponse<SessionInvite>>(`/invites/${id}`),

  accept: (id: string) =>
    api.post<SuccessResponse>(`/invites/${id}/accept`),

  decline: (id: string, note?: string) =>
    api.post<SuccessResponse>(`/invites/${id}/decline`, { note }),
};
