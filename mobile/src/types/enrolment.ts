import { EnrolmentStatus } from './common';

export interface EnrolmentResponse {
  id: string;
  session_id: string;
  student_id: string;
  status: EnrolmentStatus;
  enrolled_at: string;
  opted_out_at: string | null;
  session_title: string | null;
  tutor_name: string | null;
}
