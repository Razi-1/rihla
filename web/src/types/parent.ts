import type { Account } from './auth';

export interface ParentProfile {
  account: Account;
}

export interface ChildSummary {
  student_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  link_status: 'pending' | 'active';
}

export interface ChildDetail {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture_url: string | null;
  link_status: 'pending' | 'active';
  classes: ChildClass[];
  permissions: TutorPermission[];
}

export interface TutorPermission {
  id: string;
  tutor_id: string;
  permission_type: string;
  status: string;
}

export interface ChildClass {
  id: string;
  title: string;
  session_type: string;
  start_time: string | null;
}

export interface ParentDashboard {
  children: ChildSummary[];
  pending_permissions: number;
  upcoming_sessions_total: number;
}

export interface LinkChildRequest {
  student_email: string;
}
