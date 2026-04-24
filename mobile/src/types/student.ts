export interface StudentSubjectRequest {
  subject_id: string;
  education_level_id: string;
}

export interface StudentProfileUpdateRequest {
  education_level_id?: string;
  bio?: string;
  subjects?: StudentSubjectRequest[];
}

export interface StudentSubjectResponse {
  id: string;
  subject_id: string;
  subject_name: string | null;
  education_level_id: string;
  education_level_name: string | null;
}

export interface StudentProfileResponse {
  account_id: string;
  education_level_id: string | null;
  education_level_name: string | null;
  bio: string | null;
  subjects: StudentSubjectResponse[];
}
