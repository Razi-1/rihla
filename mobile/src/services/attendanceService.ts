import api from '../lib/axios';
import {
  GenerateQRRequest,
  ValidateQRRequest,
  AttendanceResponse,
  QRTokenResponse,
} from '../types/attendance';
import { SuccessResponse } from '../types/common';

export const attendanceService = {
  generateQR(data: GenerateQRRequest) {
    return api.post<SuccessResponse<QRTokenResponse>>('/attendance/generate-qr', data);
  },

  validateQR(data: ValidateQRRequest) {
    return api.post<SuccessResponse<AttendanceResponse>>('/attendance/validate-qr', data);
  },

  getForSession(sessionId: string) {
    return api.get<SuccessResponse<AttendanceResponse[]>>(`/attendance/session/${sessionId}`);
  },

  getForClass(sessionId: string) {
    return api.get<SuccessResponse>(`/attendance/class/${sessionId}`);
  },

  getMyAttendance(sessionId: string) {
    return api.get<SuccessResponse>(`/attendance/my/${sessionId}`);
  },
};
