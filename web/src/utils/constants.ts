export const SESSION_TYPES = {
  booking_meeting: 'Booking Meeting',
  individual_class: 'Individual Class',
  group_class: 'Group Class',
} as const;

export const SESSION_MODES = {
  online: 'Online',
  physical: 'In-Person',
  hybrid: 'Hybrid',
} as const;

export const ACCOUNT_TYPES = {
  student: 'Student',
  tutor: 'Tutor',
  parent: 'Parent',
} as const;

export const INVITE_STATUSES = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
} as const;

export const SESSION_DURATIONS = [30, 45, 60, 90, 120] as const;

export const SESSION_TYPE_COLORS: Record<string, string> = {
  booking_meeting: '#F79009',
  individual_class: '#2E75B6',
  group_class: '#12B76A',
};
