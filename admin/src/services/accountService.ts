import api from '@/lib/axios';
import type { AccountRecord } from '@/types/admin';

interface AccountFilters {
  account_type?: string;
  is_restricted?: boolean;
  limit?: number;
}

export async function getAccounts(filters: AccountFilters = {}): Promise<AccountRecord[]> {
  const params = new URLSearchParams();
  if (filters.account_type) params.set('account_type', filters.account_type);
  if (filters.is_restricted !== undefined)
    params.set('is_restricted', String(filters.is_restricted));
  params.set('limit', String(filters.limit ?? 25));
  const res = await api.get<AccountRecord[]>(`/accounts?${params}`);
  return res.data;
}

export async function getAccount(id: string): Promise<AccountRecord> {
  const res = await api.get<AccountRecord>(`/accounts/${id}`);
  return res.data;
}

export async function restrictAccount(id: string, reason: string): Promise<void> {
  await api.post(`/accounts/${id}/restrict`, { reason });
}

export async function unrestrictAccount(id: string, reason: string): Promise<void> {
  await api.post(`/accounts/${id}/unrestrict`, { reason });
}

export async function deleteAccount(id: string, reason: string): Promise<void> {
  await api.delete(`/accounts/${id}`, { data: { reason } });
}
