export interface EducationLevelResponse {
  id: string;
  name: string;
  display_order: number;
  min_age: number | null;
  max_age: number | null;
}

export interface SubjectResponse {
  id: string;
  category_id: string;
  name: string;
  display_order: number;
  available_levels: EducationLevelResponse[];
}

export interface SubjectCategoryResponse {
  id: string;
  name: string;
  display_order: number;
  subjects: SubjectResponse[];
}
