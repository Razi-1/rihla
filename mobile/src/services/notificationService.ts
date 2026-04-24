import api from '../lib/axios';
import { NotificationResponse } from '../types/notification';
import { SuccessResponse, PaginatedResponse } from '../types/common';

export const notificationService = {
  getAll(cursor?: string) {
    return api.get<PaginatedResponse<NotificationResponse>>('/notifications', {
      params: { cursor },
    });
  },

  markAllAsRead() {
    return api.put<SuccessResponse>('/notifications/mark-all-read');
  },

  markAsRead(id: string) {
    return api.put<SuccessResponse>(`/notifications/${id}/read`);
  },
};
