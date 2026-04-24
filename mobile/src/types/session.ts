import { SessionType, SessionMode, SessionStatus, RecurrenceFrequency } from './common';

export interface RecurrenceRequest {
  frequency: RecurrenceFrequency;
  days_of_week: number[];
  start_date: string;
  end_date: string;
}

export interface SessionCreateRequest {
  title: string;
  session_type: SessionType;
  mode: SessionMode;
  location_address?: string;
  location_city?: string;
  location_region?: string;
  location_country?: string;
  duration_minutes: number;
  start_time: string;
  max_group_size?: number;
  individual_rate_override?: number;
  group_rate_override?: number;
  currency_override?: string;
  recurrence?: RecurrenceRequest;
  student_ids?: string[];
}

export interface SessionUpdateRequest {
  title?: string;
  mode?: SessionMode;
  location_address?: string;
  location_city?: string;
  start_time?: string;
  duration_minutes?: number;
  max_group_size?: number;
  scope?: 'single' | 'all_future';
}

export interface SessionResponse {
  id: string;
  tutor_id: string;
  tutor_name: string | null;
  title: string;
  session_type: SessionType;
  mode: SessionMode;
  status: SessionStatus;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
  location_address: string | null;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  max_group_size: number | null;
  jitsi_room_name: string | null;
  individual_rate_override: number | null;
  group_rate_override: number | null;
  currency_override: string | null;
  enrolled_count: number;
  is_recurring: boolean;
  created_at: string;
}
