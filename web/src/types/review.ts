export interface Review {
  id: string;
  tutor_id: string;
  student_id: string;
  student_name: string;
  student_profile_picture: string | null;
  rating: number;
  comment: string;
  duration_months: number | null;
  created_at: string;
  updated_at: string;
  is_own?: boolean;
}

export interface ReviewCreateRequest {
  tutor_id: string;
  rating: number;
  text: string;
  sessions_attended?: number;
  approximate_duration_weeks: number;
}

export interface ReviewUpdateRequest {
  rating?: number;
  text?: string;
}

export interface StudentReview {
  id: string;
  tutor_id: string;
  tutor_name: string;
  tutor_profile_picture: string | null;
  rating: number;
  comment: string;
  duration_months: number | null;
  created_at: string;
  updated_at: string;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}
