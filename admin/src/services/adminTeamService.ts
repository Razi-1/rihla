import api from '@/lib/axios';
import type { AdminTeamMember } from '@/types/admin';

export async function getAdminTeam(): Promise<AdminTeamMember[]> {
  const res = await api.get<AdminTeamMember[]>('/team');
  return res.data;
}

export async function createAdmin(data: {
  email: string;
  first_name: string;
  last_name: string;
  temporary_password: string;
}): Promise<void> {
  await api.post('/team/create', data);
}
