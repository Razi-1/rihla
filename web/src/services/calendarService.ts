import api from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import type { CalendarEvent } from '@/types/calendar';

export const calendarService = {
  getEvents: (startDate: string, endDate: string, sessionType?: string) =>
    api.get<ApiResponse<CalendarEvent[]>>('/calendar/events', {
      params: { start_date: startDate, end_date: endDate, session_type: sessionType },
    }),

  getAvailableSlots: (tutorId: string, date: string) =>
    api.get<ApiResponse<string[]>>(`/calendar/available-slots/${tutorId}`, {
      params: { date },
    }),
};
