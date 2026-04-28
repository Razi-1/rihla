import api from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import type { AttendanceRecord } from '@/types/session';

export const attendanceService = {
  generateQR: (sessionId: string) =>
    api.post<ApiResponse<{ qr_image_base64: string; valid_until: string }>>('/attendance/generate-qr', {
      session_id: sessionId,
    }),

  validateQR: (token: string, sessionId: string) =>
    api.post<ApiResponse<AttendanceRecord>>('/attendance/validate-qr', {
      qr_token: token,
      session_id: sessionId,
    }),

  getSessionAttendance: (sessionId: string) =>
    api.get<ApiResponse<AttendanceRecord[]>>(`/attendance/session/${sessionId}`),
};
