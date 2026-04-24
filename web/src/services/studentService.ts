import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/common';
import type { StudentProfile, StudentProfileUpdate, StudentDashboard } from '@/types/student';
import type { Session } from '@/types/session';

export const studentService = {
  getProfile: () =>
    api.get<ApiResponse<StudentProfile>>('/students/me/profile'),

  updateProfile: (data: StudentProfileUpdate) =>
    api.put<ApiResponse<StudentProfile>>('/students/me/profile', data),

  getDashboard: () =>
    api.get<ApiResponse<StudentDashboard>>('/students/me/dashboard'),

  getClasses: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Session>>('/students/me/classes', { params }),
};
