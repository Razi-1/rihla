import api from '../lib/axios';
import { SuccessResponse } from '../types/common';

export interface AIMessageRequest {
  message: string;
}

export interface AIMessageResponse {
  reply: string;
}

export const aiService = {
  sendMessage(data: AIMessageRequest) {
    return api.post<SuccessResponse<AIMessageResponse>>('/ai/assistant/message', data);
  },
};
