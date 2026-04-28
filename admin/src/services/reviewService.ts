import api from '@/lib/axios';
import type { ReviewRecord } from '@/types/admin';

interface ReviewFilters {
  tutor_id?: string;
  limit?: number;
}

export async function getReviews(
  filters: ReviewFilters = {},
): Promise<ReviewRecord[]> {
  const params = new URLSearchParams();
  if (filters.tutor_id) params.set('tutor_id', filters.tutor_id);
  params.set('limit', String(filters.limit ?? 25));
  const res = await api.get<{ data: ReviewRecord[] }>(`/reviews?${params}`);
  return res.data.data;
}

export async function getReview(id: string): Promise<ReviewRecord> {
  const res = await api.get<{ data: ReviewRecord }>(`/reviews/${id}`);
  return res.data.data;
}

export async function deleteReview(id: string, reason: string): Promise<void> {
  await api.delete(`/reviews/${id}`, { data: { reason } });
}
