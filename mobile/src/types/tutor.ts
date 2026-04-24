import { TuitionMode } from './common';

export interface TutorSubjectRequest {
  subject_id: string;
  education_level_id: string;
}

export interface TutorProfileUpdateRequest {
  bio?: string;
  mode_of_tuition?: TuitionMode;
  country_id?: string;
  region_id?: string;
  city_id?: string;
  timezone?: string;
  subjects?: TutorSubjectRequest[];
}

export interface PricingUpdateRequest {
  individual_rate?: number;
  group_rate?: number;
  currency?: string;
}

export interface WorkingHoursSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
}

export interface WorkingHoursRequest {
  timezone: string;
  slots: WorkingHoursSlot[];
}

export interface TutorSubjectResponse {
  id: string;
  subject_id: string;
  subject_name: string | null;
  category_name: string | null;
  education_level_id: string;
  education_level_name: string | null;
}

export interface WorkingHoursResponse {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
  timezone: string;
}

export interface TutorProfileResponse {
  account_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  bio: string | null;
  mode_of_tuition: TuitionMode | null;
  country_name: string | null;
  region_name: string | null;
  city_name: string | null;
  individual_rate: number | null;
  group_rate: number | null;
  currency: string | null;
  is_profile_complete: boolean;
  timezone: string | null;
  subjects: TutorSubjectResponse[];
  working_hours: WorkingHoursResponse[];
  average_rating: number | null;
  review_count: number;
  sentiment_summary: string | null;
}

export interface TutorCardResponse {
  account_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  bio: string | null;
  mode_of_tuition: TuitionMode | null;
  city_name: string | null;
  individual_rate: number | null;
  group_rate: number | null;
  currency: string | null;
  subjects: TutorSubjectResponse[];
  average_rating: number | null;
  review_count: number;
}
