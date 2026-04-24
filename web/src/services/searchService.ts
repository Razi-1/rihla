import api from '@/lib/axios';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { TutorCard } from '@/types/tutor';

export interface SearchFilters {
  subject_id?: string;
  education_level_id?: string;
  mode?: string;
  gender?: string;
  min_rate?: number;
  max_rate?: number;
  city_id?: string;
  region_id?: string;
  country_id?: string;
  cursor?: string;
}

export const searchService = {
  searchTutors: (filters: SearchFilters) =>
    api.get<PaginatedResponse<TutorCard>>('/search/tutors', { params: filters }),

  aiSearch: (query: string) =>
    api.post<ApiResponse<{ results: TutorCard[]; interpreted_query: string }>>(
      '/search/tutors/ai',
      { query },
    ),
};
