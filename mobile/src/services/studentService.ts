import api from '../lib/axios';
import {
  StudentProfileResponse,
  StudentProfileUpdateRequest,
} from '../types/student';
import { SuccessResponse } from '../types/common';

export const studentService = {
  getProfile() {
    return api.get<SuccessResponse<StudentProfileResponse>>('/students/me/profile');
  },

  updateProfile(data: StudentProfileUpdateRequest) {
    return api.put<SuccessResponse<StudentProfileResponse>>('/students/me/profile', data);
  },

  getDashboard() {
    return api.get<SuccessResponse>('/students/me/dashboard');
  },

  getClasses(params?: Record<string, unknown>) {
    return api.get<SuccessResponse>('/students/me/classes', { params });
  },
};
