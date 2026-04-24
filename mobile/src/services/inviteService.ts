import api from '../lib/axios';
import { InviteResponse, InviteActionRequest } from '../types/invite';
import { SuccessResponse } from '../types/common';

export const inviteService = {
  getAll() {
    return api.get<SuccessResponse<InviteResponse[]>>('/invites');
  },

  getById(id: string) {
    return api.get<SuccessResponse<InviteResponse>>(`/invites/${id}`);
  },

  accept(id: string) {
    return api.post<SuccessResponse>(`/invites/${id}/accept`);
  },

  decline(id: string, data?: InviteActionRequest) {
    return api.post<SuccessResponse>(`/invites/${id}/decline`, data);
  },

  requestJoin(sessionId: string) {
    return api.post<SuccessResponse>(`/sessions/${sessionId}/request-join`);
  },
};
