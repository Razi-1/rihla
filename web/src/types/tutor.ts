import type { Account } from './auth';
import type { SubjectLevel, SessionMode } from './common';

export interface TutorProfile {
  account: Account;
  bio: string | null;
  mode_of_tuition: SessionMode | null;
  country: { id: string; name: string } | null;
  region: { id: string; name: string } | null;
  city: { id: string; name: string } | null;
  individual_rate: number | null;
  group_rate: number | null;
  currency: string | null;
  is_profile_complete: boolean;
  timezone: string | null;
  subjects: SubjectLevel[];
  working_hours: WorkingHours[];
  average_rating: number | null;
  review_count: number;
  sentiment_summary: string | null;
}

export interface TutorCard {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  bio: string | null;
  mode_of_tuition: SessionMode | null;
  city_name: string | null;
  region_name: string | null;
  country_name: string | null;
  individual_rate: number | null;
  group_rate: number | null;
  currency: string | null;
  subjects: SubjectLevel[];
  average_rating: number | null;
  review_count: number;
  sentiment_summary: string | null;
}

export interface WorkingHours {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
  timezone: string;
}

export interface WorkingHoursUpdate {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
}

export interface TutorProfileUpdate {
  bio?: string;
  mode_of_tuition?: SessionMode;
  country_id?: string;
  region_id?: string;
  city_id?: string;
  timezone?: string;
  subjects?: { subject_id: string; education_level_id: string }[];
}

export interface TutorPricingUpdate {
  individual_rate?: number | null;
  group_rate?: number | null;
  currency?: string;
}

export interface TutorDashboard {
  upcoming_sessions: number;
  active_students: number;
  total_classes: number;
  profile_completeness: number;
  completion_steps: CompletionStep[];
  next_session: { id: string; title: string; start_time: string } | null;
}

export interface CompletionStep {
  key: string;
  label: string;
  completed: boolean;
}

export interface TutorStats {
  total_sessions: number;
  cancellation_rate: number;
  total_students: number;
}
