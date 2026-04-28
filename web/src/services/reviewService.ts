import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse, SuccessResponse } from '@/types/common';
import type { Review, ReviewCreateRequest, ReviewUpdateRequest, StudentReview } from '@/types/review';

export const reviewService = {
  create: (data: ReviewCreateRequest) =>
    api.post<ApiResponse<Review>>('/reviews', data),

  listForTutor: (tutorId: string, cursor?: string) =>
    api.get<PaginatedResponse<Review>>(`/reviews/tutor/${tutorId}`, {
      params: cursor ? { cursor } : undefined,
    }),

  getMine: (tutorId: string) =>
    api.get<ApiResponse<Review | null>>(`/reviews/me/${tutorId}`),

  getMyReviews: () =>
    api.get<{ data: StudentReview[] }>('/reviews/me'),

  update: (id: string, data: ReviewUpdateRequest) =>
    api.put<SuccessResponse>(`/reviews/${id}`, data),

  delete: (id: string) =>
    api.delete<SuccessResponse>(`/reviews/${id}`),
};
