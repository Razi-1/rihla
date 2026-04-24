import { PermissionStatus } from './common';

export interface LinkChildRequest {
  student_email: string;
}

export interface PermissionToggleRequest {
  status: 'granted' | 'denied';
}

export interface ChildSummaryResponse {
  student_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  link_status: string;
}

export interface ParentDashboardResponse {
  children: ChildSummaryResponse[];
  pending_permissions: number;
}

export interface TutorPermission {
  id: string;
  tutor_id: string;
  tutor_name: string;
  status: PermissionStatus;
}

export interface ChildDetailResponse {
  student_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  link_status: string;
  tutor_permissions: TutorPermission[];
}
