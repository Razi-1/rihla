import api from '../lib/axios';
import {
  SessionCreateRequest,
  SessionUpdateRequest,
  SessionResponse,
} from '../types/session';
import { SuccessResponse } from '../types/common';

export const sessionService = {
  create(data: SessionCreateRequest) {
    return api.post<SuccessResponse<SessionResponse>>('/sessions', data);
  },

  getById(id: string) {
    return api.get<SuccessResponse<SessionResponse>>(`/sessions/${id}`);
  },

  update(id: string, data: SessionUpdateRequest) {
    return api.put<SuccessResponse<SessionResponse>>(`/sessions/${id}`, data);
  },

  delete(id: string) {
    return api.delete<SuccessResponse>(`/sessions/${id}`);
  },

  endSeries(id: string) {
    return api.post<SuccessResponse>(`/sessions/${id}/end-series`);
  },
};
