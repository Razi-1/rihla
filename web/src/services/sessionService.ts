import api from '@/lib/axios';
import type { ApiResponse, SuccessResponse } from '@/types/common';
import type { Session, SessionCreateRequest } from '@/types/session';

export const sessionService = {
  create: (data: SessionCreateRequest) =>
    api.post<ApiResponse<Session>>('/sessions', data),

  get: (id: string) =>
    api.get<ApiResponse<Session>>(`/sessions/${id}`),

  update: (id: string, data: Partial<SessionCreateRequest> & { scope?: 'single' | 'all_future' }) =>
    api.put<ApiResponse<Session>>(`/sessions/${id}`, data),

  delete: (id: string) =>
    api.delete<SuccessResponse>(`/sessions/${id}`),

  endSeries: (id: string) =>
    api.post<SuccessResponse>(`/sessions/${id}/end-series`),

  requestJoin: (sessionId: string) =>
    api.post<SuccessResponse>(`/sessions/${sessionId}/request-join`),

  getJitsiToken: (sessionId: string) =>
    api.get<ApiResponse<{ token: string; room_name: string; domain: string }>>(`/sessions/${sessionId}/jitsi-token`),

  cancelBooking: (sessionId: string) =>
    api.post<SuccessResponse>(`/sessions/${sessionId}/cancel-booking`),

  bookMeeting: (data: { tutor_id: string; start_time: string; duration_minutes: number; title?: string; mode?: string }) =>
    api.post<ApiResponse<Session>>('/sessions/book-meeting', data),
};
