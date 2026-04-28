import type {
  SessionType,
  SessionMode,
  SessionStatus,
  InviteStatus,
  EnrolmentStatus,
  Duration,
} from './common';

export interface Session {
  id: string;
  tutor_id: string;
  tutor_name: string;
  title: string;
  session_type: SessionType;
  mode: SessionMode;
  status: SessionStatus;
  location_address: string | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
  duration_minutes: Duration;
  start_time: string;
  end_time: string;
  max_group_size: number | null;
  jitsi_room_name: string | null;
  individual_rate_override: number | null;
  group_rate_override: number | null;
  currency_override: string | null;
  subject_id: string | null;
  education_level_id: string | null;
  subject_name: string | null;
  education_level_name: string | null;
  is_recurring: boolean;
  enrolled_count?: number;
  is_enrolled?: boolean;
  created_at: string;
}

export interface RecurrenceRule {
  id: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  days_of_week: number[];
  start_date: string;
  end_date: string;
}

export interface SessionCreateRequest {
  title: string;
  session_type: SessionType;
  mode: SessionMode;
  duration_minutes: Duration;
  start_time: string;
  location_address?: string;
  location_city?: string;
  location_region?: string;
  location_country?: string;
  max_group_size?: number;
  individual_rate_override?: number;
  group_rate_override?: number;
  currency_override?: string;
  subject_id?: string;
  education_level_id?: string;
  student_ids?: string[];
  recurrence?: RecurrenceCreateRequest;
}

export interface RecurrenceCreateRequest {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  days_of_week: number[];
  end_date: string;
}

export interface SessionInvite {
  id: string;
  session_id: string;
  student_id: string;
  status: InviteStatus;
  session_title: string | null;
  session_type: SessionType | null;
  session_mode: SessionMode | null;
  start_time: string | null;
  duration_minutes: number | null;
  tutor_name: string | null;
  location_city: string | null;
  conflict_details: Record<string, unknown> | null;
  created_at: string;
}

export interface Enrolment {
  id: string;
  session_id: string;
  student_id: string;
  status: EnrolmentStatus;
  enrolled_at: string;
  opted_out_at: string | null;
  session_title: string | null;
  tutor_name: string | null;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  method: 'qr_scan' | 'jitsi_webhook';
  recorded_at: string;
}
