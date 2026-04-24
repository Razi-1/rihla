export interface ReviewCreateRequest {
  tutor_id: string;
  rating: number;
  text: string;
  sessions_attended: number;
  approximate_duration_weeks: number;
}

export interface ReviewUpdateRequest {
  rating?: number;
  text?: string;
}

export interface ReviewResponse {
  id: string;
  tutor_id: string;
  rating: number;
  text: string;
  reviewer_first_name: string | null;
  reviewer_last_name: string | null;
  sessions_attended: number | null;
  approximate_duration_weeks: number | null;
  created_at: string;
  updated_at: string;
}
