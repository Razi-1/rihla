import type { Account } from './auth';
import type { SubjectLevel, EducationLevel } from './common';

export interface StudentProfile {
  account: Account;
  education_level: EducationLevel | null;
  bio: string | null;
  subjects: SubjectLevel[];
}

export interface StudentProfileUpdate {
  education_level_id?: string;
  bio?: string;
  subjects?: { subject_id: string; education_level_id: string }[];
}

export interface ActiveClassSummary {
  id: string;
  title: string;
  tutor_name: string;
  session_type: string;
  start_time: string;
  mode: string;
}

export interface StudentDashboard {
  upcoming_sessions: number;
  active_classes: number;
  pending_invites: number;
  next_session: { id: string; title: string; start_time: string; tutor_name: string } | null;
  recent_invites: StudentInviteSummary[];
  active_classes_list: ActiveClassSummary[];
}

export interface StudentInviteSummary {
  id: string;
  session_title: string;
  tutor_name: string;
  start_time: string;
  session_type: string;
}
