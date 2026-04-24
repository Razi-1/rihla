export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
  total_count?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  code: string;
  errors?: Record<string, string[]>;
}

export interface SuccessResponse {
  message: string;
}

export type AccountType = 'student' | 'tutor' | 'parent';

export type SessionType = 'booking_meeting' | 'individual_class' | 'group_class';
export type SessionMode = 'online' | 'physical' | 'hybrid';
export type SessionStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export type InviteStatus = 'pending' | 'accepted' | 'declined';
export type EnrolmentStatus = 'active' | 'opted_out';

export type Gender = 'male' | 'female' | 'other' | null;

export interface SubjectCategory {
  id: string;
  name: string;
  display_order: number;
}

export interface Subject {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  display_order: number;
  education_levels?: EducationLevel[];
}

export interface EducationLevel {
  id: string;
  name: string;
  display_order: number;
  min_age?: number;
  max_age?: number;
}

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface Region {
  id: string;
  country_id: string;
  name: string;
}

export interface City {
  id: string;
  region_id: string;
  name: string;
}

export interface SubjectLevel {
  id: string;
  subject_id: string;
  subject_name: string;
  category_name: string;
  education_level_id: string;
  education_level_name: string;
}

export const DURATIONS = [30, 45, 60, 90, 120] as const;
export type Duration = (typeof DURATIONS)[number];
