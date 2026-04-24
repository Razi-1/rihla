import type { Account } from './auth';

export interface ParentProfile {
  account: Account;
}

export interface ChildSummary {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  email: string;
  is_age_restricted: boolean;
  active_classes: number;
  upcoming_sessions: number;
  status: 'pending' | 'active';
}

export interface ChildDetail {
  child: ChildSummary;
  tutor_permissions: TutorPermission[];
  active_classes: ChildClass[];
}

export interface TutorPermission {
  id: string;
  tutor_id: string;
  tutor_name: string;
  tutor_profile_picture: string | null;
  status: 'pending' | 'granted' | 'denied';
  created_at: string;
}

export interface ChildClass {
  session_id: string;
  title: string;
  tutor_name: string;
  next_occurrence: string | null;
}

export interface ParentDashboard {
  children: ChildSummary[];
  pending_permissions: number;
  upcoming_sessions_total: number;
}

export interface LinkChildRequest {
  student_email: string;
}
