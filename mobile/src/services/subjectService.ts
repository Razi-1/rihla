import api from '../lib/axios';
import {
  SubjectCategoryResponse,
  SubjectResponse,
  EducationLevelResponse,
} from '../types/subject';
import { SuccessResponse } from '../types/common';

export const subjectService = {
  getCategories() {
    return api.get<SuccessResponse<SubjectCategoryResponse[]>>('/subjects/categories');
  },

  getSubjects() {
    return api.get<SuccessResponse<SubjectResponse[]>>('/subjects');
  },

  getEducationLevels() {
    return api.get<SuccessResponse<EducationLevelResponse[]>>('/education-levels');
  },
};
