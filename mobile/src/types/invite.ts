import { InviteStatus } from './common';

export interface InviteResponse {
  id: string;
  session_id: string;
  student_id: string;
  status: InviteStatus;
  session_title: string | null;
  session_type: string | null;
  session_mode: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  tutor_name: string | null;
  location_city: string | null;
  conflict_details: Record<string, unknown> | null;
  created_at: string;
}

export interface InviteActionRequest {
  note?: string;
}
