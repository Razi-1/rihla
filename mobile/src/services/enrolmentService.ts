import api from '../lib/axios';
import { EnrolmentResponse } from '../types/enrolment';
import { SuccessResponse } from '../types/common';

export const enrolmentService = {
  getAll() {
    return api.get<SuccessResponse<EnrolmentResponse[]>>('/enrolments');
  },

  optOut(id: string) {
    return api.post<SuccessResponse>(`/enrolments/${id}/opt-out`);
  },
};
