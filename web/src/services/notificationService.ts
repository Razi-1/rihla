import api from '@/lib/axios';
import type { PaginatedResponse, SuccessResponse } from '@/types/common';
import type { Notification } from '@/types/notification';

export const notificationService = {
  list: (cursor?: string) =>
    api.get<PaginatedResponse<Notification>>('/notifications', {
      params: cursor ? { cursor } : undefined,
    }),

  markRead: (id: string) =>
    api.put<SuccessResponse>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.put<SuccessResponse>('/notifications/mark-all-read'),
};
