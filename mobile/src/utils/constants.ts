export const SESSION_TYPES = {
  BOOKING_MEETING: 'booking_meeting',
  INDIVIDUAL_CLASS: 'individual_class',
  GROUP_CLASS: 'group_class',
} as const;

export const SESSION_MODES = {
  ONLINE: 'online',
  PHYSICAL: 'physical',
  HYBRID: 'hybrid',
} as const;

export const ACCOUNT_TYPES = {
  STUDENT: 'student',
  TUTOR: 'tutor',
  PARENT: 'parent',
  ADMIN: 'admin',
} as const;

export const DURATIONS = [30, 45, 60, 90, 120] as const;

export const INVITE_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
} as const;

export const SESSION_TYPE_LABELS: Record<string, string> = {
  booking_meeting: 'Booking Meeting',
  individual_class: 'Individual Class',
  group_class: 'Group Class',
};

export const MODE_LABELS: Record<string, string> = {
  online: 'Online',
  physical: 'Physical',
  hybrid: 'Hybrid',
};

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const NOTIFICATION_TYPES = {
  INVITE_RECEIVED: 'invite_received',
  INVITE_ACCEPTED: 'invite_accepted',
  INVITE_DECLINED: 'invite_declined',
  SESSION_CANCELLED: 'session_cancelled',
  SESSION_RESCHEDULED: 'session_rescheduled',
  REVIEW_RECEIVED: 'review_received',
  PARENT_LINK_REQUEST: 'parent_link_request',
  PARENT_PERMISSION_REQUEST: 'parent_permission_request',
  CHAT_MESSAGE: 'chat_message',
} as const;
