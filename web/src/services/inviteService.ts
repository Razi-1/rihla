import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse, SuccessResponse } from '@/types/common';
import type { SessionInvite } from '@/types/session';

export const inviteService = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<SessionInvite>>('/invites', { params }),

  get: (id: string) =>
    api.get<ApiResponse<SessionInvite>>(`/invites/${id}`),

  accept: (id: string) =>
    api.post<SuccessResponse>(`/invites/${id}/accept`),

  decline: (id: string, note?: string) =>
    api.post<SuccessResponse>(`/invites/${id}/decline`, { note }),
};
