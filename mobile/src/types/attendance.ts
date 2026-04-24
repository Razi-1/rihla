import { AttendanceMethod } from './common';

export interface GenerateQRRequest {
  session_id: string;
}

export interface ValidateQRRequest {
  qr_token: string;
  session_id: string;
}

export interface AttendanceResponse {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string | null;
  method: AttendanceMethod;
  recorded_at: string;
}

export interface QRTokenResponse {
  qr_image_base64: string;
  valid_until: string;
}
