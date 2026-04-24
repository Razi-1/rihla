import api from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import type {
  ParentDashboard,
  ChildSummary,
  ChildDetail,
  LinkChildRequest,
} from '@/types/parent';
import type { SuccessResponse } from '@/types/common';

export const parentService = {
  getDashboard: () =>
    api.get<ApiResponse<ParentDashboard>>('/parents/me/dashboard'),

  linkChild: (data: LinkChildRequest) =>
    api.post<SuccessResponse>('/parents/me/link-child', data),

  getChildren: () =>
    api.get<ApiResponse<ChildSummary[]>>('/parents/me/children'),

  getChild: (studentId: string) =>
    api.get<ApiResponse<ChildDetail>>(`/parents/me/children/${studentId}`),

  updatePermission: (permissionId: string, status: 'granted' | 'denied') =>
    api.put<SuccessResponse>(`/parents/me/permissions/${permissionId}`, { status }),
};
