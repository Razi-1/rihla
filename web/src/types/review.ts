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
  comment: string;
  duration_months?: number;
}

export interface ReviewUpdateRequest {
  rating?: number;
  comment?: string;
  duration_months?: number;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}
