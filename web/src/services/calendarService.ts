import api from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import type { CalendarEvent } from '@/types/calendar';

export const calendarService = {
  getEvents: (startDate: string, endDate: string, sessionType?: string) =>
    api.get<ApiResponse<CalendarEvent[]>>('/calendar/events', {
      params: { start: startDate, end: endDate, session_type: sessionType },
    }),
};
