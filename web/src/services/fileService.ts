import api from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export const fileService = {
  upload: (file: File, bucket?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (bucket) formData.append('bucket', bucket);
    return api.post<ApiResponse<{ url: string; key: string }>>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getUrl: (key: string) =>
    api.get<ApiResponse<{ url: string }>>(`/files/${key}`),
};
