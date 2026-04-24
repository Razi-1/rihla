import { SessionType, SessionMode, SessionStatus } from './common';

export interface CalendarEventResponse {
  id: string;
  title: string;
  start: string;
  end: string;
  session_type: SessionType;
  mode: SessionMode;
  status: SessionStatus;
  role: string;
  tutor_name: string | null;
  location_city: string | null;
}

export interface CalendarDateRange {
  start_date: string;
  end_date: string;
}
