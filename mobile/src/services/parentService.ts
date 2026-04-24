import api from '../lib/axios';
import {
  ParentDashboardResponse,
  ChildSummaryResponse,
  ChildDetailResponse,
  LinkChildRequest,
  PermissionToggleRequest,
} from '../types/parent';
import { SuccessResponse } from '../types/common';

export const parentService = {
  getDashboard() {
    return api.get<SuccessResponse<ParentDashboardResponse>>('/parents/me/dashboard');
  },

  linkChild(data: LinkChildRequest) {
    return api.post<SuccessResponse>('/parents/me/link-child', data);
  },

  getChildren() {
    return api.get<SuccessResponse<ChildSummaryResponse[]>>('/parents/me/children');
  },

  getChildDetail(studentId: string) {
    return api.get<SuccessResponse<ChildDetailResponse>>(`/parents/me/children/${studentId}`);
  },

  updatePermission(permissionId: string, data: PermissionToggleRequest) {
    return api.put<SuccessResponse>(`/parents/me/permissions/${permissionId}`, data);
  },
};
