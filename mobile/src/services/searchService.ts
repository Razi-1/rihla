import api from '../lib/axios';
import { SearchFilters, AISearchRequest, SearchResultResponse } from '../types/search';

export const searchService = {
  searchTutors(filters: SearchFilters) {
    return api.get<SearchResultResponse>('/search/tutors', { params: filters });
  },

  aiSearch(data: AISearchRequest) {
    return api.post<SearchResultResponse>('/search/tutors/ai', data);
  },
};
