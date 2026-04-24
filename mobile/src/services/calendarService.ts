import api from '../lib/axios';
import { CalendarEventResponse } from '../types/calendar';
import { SuccessResponse } from '../types/common';

export const calendarService = {
  getEvents(startDate: string, endDate: string) {
    return api.get<SuccessResponse<CalendarEventResponse[]>>('/calendar/events', {
      params: { start_date: startDate, end_date: endDate },
    });
  },

  getAvailableSlots(tutorId: string) {
    return api.get<SuccessResponse>(`/calendar/available-slots/${tutorId}`);
  },
};
