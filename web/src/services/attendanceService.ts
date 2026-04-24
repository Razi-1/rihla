import api from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import type { AttendanceRecord } from '@/types/session';

export const attendanceService = {
  generateQR: (sessionId: string) =>
    api.post<ApiResponse<{ qr_data: string; valid_until: string }>>('/attendance/generate-qr', {
      session_id: sessionId,
    }),

  validateQR: (token: string) =>
    api.post<ApiResponse<{ success: boolean }>>('/attendance/validate-qr', { token }),

  getSessionAttendance: (sessionId: string) =>
    api.get<ApiResponse<AttendanceRecord[]>>(`/attendance/session/${sessionId}`),

  getClassAttendance: (sessionId: string) =>
    api.get<ApiResponse<Record<string, AttendanceRecord[]>>>(`/attendance/class/${sessionId}`),

  getMyAttendance: (sessionId: string) =>
    api.get<ApiResponse<AttendanceRecord[]>>(`/attendance/my/${sessionId}`),
};
