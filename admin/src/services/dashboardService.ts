import api from '@/lib/axios';
import type { DashboardStats } from '@/types/admin';

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>('/dashboard');
  return res.data;
}
