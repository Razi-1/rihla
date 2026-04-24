import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/common';
import type {
  TutorProfile,
  TutorCard,
  TutorProfileUpdate,
  TutorPricingUpdate,
  WorkingHoursUpdate,
  TutorDashboard,
  TutorStats,
} from '@/types/tutor';
import type { Session } from '@/types/session';

export const tutorService = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<TutorCard>>('/tutors', { params }),

  getPublic: (id: string) =>
    api.get<ApiResponse<TutorProfile>>(`/tutors/${id}`),

  getAuthenticated: (id: string) =>
    api.get<ApiResponse<TutorProfile>>(`/tutors/${id}/authenticated`),

  getPublicClasses: (id: string) =>
    api.get<ApiResponse<Session[]>>(`/tutors/${id}/classes`),

  updateProfile: (data: TutorProfileUpdate) =>
    api.put<ApiResponse<TutorProfile>>('/tutors/me/profile', data),

  updateWorkingHours: (data: WorkingHoursUpdate[]) =>
    api.put<ApiResponse<unknown>>('/tutors/me/working-hours', { hours: data }),

  updatePricing: (data: TutorPricingUpdate) =>
    api.put<ApiResponse<unknown>>('/tutors/me/pricing', data),

  getPreview: () =>
    api.get<ApiResponse<TutorProfile>>('/tutors/me/preview'),

  getDashboard: () =>
    api.get<ApiResponse<TutorDashboard>>('/tutors/me/dashboard'),

  getClasses: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Session>>('/tutors/me/classes', { params }),

  getStats: () =>
    api.get<ApiResponse<TutorStats>>('/tutors/me/stats'),

  getContacts: () =>
    api.get<ApiResponse<unknown[]>>('/tutors/me/contacts'),
};
