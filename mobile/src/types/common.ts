export interface SuccessResponse<T = unknown> {
  data: T;
  message: string;
}

export interface ErrorResponse {
  detail: string;
  code: string;
  errors?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
  total?: number;
}

export type AccountType = 'student' | 'tutor' | 'parent' | 'admin';
export type SessionType = 'booking_meeting' | 'individual_class' | 'group_class';
export type SessionMode = 'online' | 'physical' | 'hybrid';
export type SessionStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type InviteStatus = 'pending' | 'accepted' | 'declined';
export type EnrolmentStatus = 'active' | 'opted_out';
export type PermissionStatus = 'pending' | 'granted' | 'denied';
export type AttendanceMethod = 'qr_scan' | 'jitsi_webhook';
export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly';
export type TuitionMode = 'online' | 'physical' | 'hybrid';
