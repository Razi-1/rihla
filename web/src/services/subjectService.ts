import api from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import type { SubjectCategory, Subject, EducationLevel } from '@/types/common';

export const subjectService = {
  getCategories: () =>
    api.get<ApiResponse<SubjectCategory[]>>('/subjects/categories'),

  getSubjects: () =>
    api.get<ApiResponse<Subject[]>>('/subjects'),

  getEducationLevels: () =>
    api.get<ApiResponse<EducationLevel[]>>('/subjects/education-levels'),
};
