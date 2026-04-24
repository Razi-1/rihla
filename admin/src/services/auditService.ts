import api from '@/lib/axios';
import type { AuditEntry } from '@/types/admin';

interface AuditFilters {
  action_type?: string;
  cursor?: string;
  limit?: number;
}

export async function getAuditLog(filters: AuditFilters = {}): Promise<AuditEntry[]> {
  const params = new URLSearchParams();
  if (filters.action_type) params.set('action_type', filters.action_type);
  if (filters.cursor) params.set('cursor', filters.cursor);
  params.set('limit', String(filters.limit ?? 50));
  const res = await api.get<AuditEntry[]>(`/audit-log?${params}`);
  return res.data;
}

export async function exportAuditLogCsv(): Promise<Blob> {
  const res = await api.get('/audit-log/export', { responseType: 'blob' });
  return res.data as Blob;
}
