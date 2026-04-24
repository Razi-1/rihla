export interface DashboardStats {
  total_students: number;
  total_tutors: number;
  total_parents: number;
  total_sessions: number;
  pending_reviews: number;
  restricted_accounts: number;
  recent_audit_entries: AuditEntry[];
}

export interface AccountRecord {
  id: string;
  email: string;
  account_type: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_restricted: boolean;
  is_email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface ReviewRecord {
  id: string;
  tutor_id: string;
  rating: number;
  text: string;
  is_deleted: boolean;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  admin_id: string;
  admin_name: string | null;
  action_type: string;
  target_entity_id: string | null;
  target_entity_type: string | null;
  reason: string;
  outcome: string;
  created_at: string;
}

export interface SubjectCategory {
  id: string;
  name: string;
  display_order: number;
  subjects: Subject[];
}

export interface Subject {
  id: string;
  category_id: string;
  name: string;
  display_order: number;
  available_levels: EducationLevel[];
}

export interface EducationLevel {
  id: string;
  name: string;
  display_order: number;
  min_age: number | null;
  max_age: number | null;
}

export interface AdminTeamMember {
  id: string;
  email: string;
  account_type: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_restricted: boolean;
  is_email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}
