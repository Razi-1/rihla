export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  session_type: string;
  mode: string;
  status: string;
  tutor_name?: string;
  is_own?: boolean;
  color?: string;
}

export interface CalendarFilters {
  start_date: string;
  end_date: string;
  session_type?: string;
}
