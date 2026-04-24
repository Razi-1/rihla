import { TutorCardResponse } from './tutor';

export interface SearchFilters {
  subject_id?: string;
  education_level_id?: string;
  mode?: 'online' | 'physical' | 'hybrid';
  city_id?: string;
  region_id?: string;
  country_id?: string;
  min_rating?: number;
  max_rate?: number;
  gender?: string;
  cursor?: string;
  limit?: number;
}

export interface AISearchRequest {
  query: string;
  cursor?: string;
  limit?: number;
}

export interface SearchResultResponse {
  tutors: TutorCardResponse[];
  next_cursor: string | null;
  has_more: boolean;
  ai_interpretation?: Record<string, unknown>;
}
