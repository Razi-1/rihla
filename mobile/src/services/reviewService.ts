import api from '../lib/axios';
import {
  ReviewCreateRequest,
  ReviewUpdateRequest,
  ReviewResponse,
} from '../types/review';
import { SuccessResponse, PaginatedResponse } from '../types/common';

export const reviewService = {
  create(data: ReviewCreateRequest) {
    return api.post<SuccessResponse<ReviewResponse>>('/reviews', data);
  },

  getForTutor(tutorId: string, cursor?: string) {
    return api.get<PaginatedResponse<ReviewResponse>>(`/reviews/tutor/${tutorId}`, {
      params: { cursor },
    });
  },

  getMine(tutorId: string) {
    return api.get<SuccessResponse<ReviewResponse>>(`/reviews/mine/${tutorId}`);
  },

  update(id: string, data: ReviewUpdateRequest) {
    return api.put<SuccessResponse<ReviewResponse>>(`/reviews/${id}`, data);
  },

  delete(id: string) {
    return api.delete<SuccessResponse>(`/reviews/${id}`);
  },
};
