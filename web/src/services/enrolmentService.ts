import api from '@/lib/axios';
import type { PaginatedResponse, SuccessResponse } from '@/types/common';
import type { Enrolment } from '@/types/session';

export const enrolmentService = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Enrolment>>('/enrolments', { params }),

  optOut: (id: string) =>
    api.post<SuccessResponse>(`/enrolments/${id}/opt-out`),
};
