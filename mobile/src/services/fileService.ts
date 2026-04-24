import api from '../lib/axios';
import { SuccessResponse } from '../types/common';

export const fileService = {
  upload(file: { uri: string; name: string; type: string }) {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    return api.post<SuccessResponse<{ url: string }>>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getUrl(key: string) {
    return api.get<SuccessResponse<{ url: string }>>(`/files/${key}`);
  },
};
