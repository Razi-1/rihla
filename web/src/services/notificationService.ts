import api from '@/lib/axios';
import type { ApiResponse, SuccessResponse } from '@/types/common';
import type { Notification } from '@/types/notification';

export const notificationService = {
  list: () =>
    api.get<ApiResponse<Notification[]>>('/notifications'),

  markRead: (id: string) =>
    api.put<SuccessResponse>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.put<SuccessResponse>('/notifications/mark-all-read'),
};
