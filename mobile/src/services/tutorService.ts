import api from '../lib/axios';
import {
  TutorProfileResponse,
  TutorProfileUpdateRequest,
  TutorCardResponse,
  PricingUpdateRequest,
  WorkingHoursRequest,
} from '../types/tutor';
import { SessionResponse } from '../types/session';
import { SuccessResponse, PaginatedResponse } from '../types/common';

export const tutorService = {
  getPublicList(params?: Record<string, unknown>) {
    return api.get<PaginatedResponse<TutorCardResponse>>('/tutors', { params });
  },

  getPublicProfile(id: string) {
    return api.get<SuccessResponse<TutorProfileResponse>>(`/tutors/${id}`);
  },

  getAuthenticatedProfile(id: string) {
    return api.get<SuccessResponse<TutorProfileResponse>>(`/tutors/${id}/authenticated`);
  },

  getPublicClasses(id: string) {
    return api.get<SuccessResponse<SessionResponse[]>>(`/tutors/${id}/classes`);
  },

  updateMyProfile(data: TutorProfileUpdateRequest) {
    return api.put<SuccessResponse<TutorProfileResponse>>('/tutors/me/profile', data);
  },

  updateWorkingHours(data: WorkingHoursRequest) {
    return api.put<SuccessResponse>('/tutors/me/working-hours', data);
  },

  updatePricing(data: PricingUpdateRequest) {
    return api.put<SuccessResponse>('/tutors/me/pricing', data);
  },

  getProfilePreview() {
    return api.get<SuccessResponse<TutorProfileResponse>>('/tutors/me/preview');
  },

  getDashboard() {
    return api.get<SuccessResponse>('/tutors/me/dashboard');
  },

  getContacts() {
    return api.get<SuccessResponse>('/tutors/me/contacts');
  },

  getMyClasses(params?: Record<string, unknown>) {
    return api.get<SuccessResponse>('/tutors/me/classes', { params });
  },

  getStats() {
    return api.get<SuccessResponse>('/tutors/me/stats');
  },
};
