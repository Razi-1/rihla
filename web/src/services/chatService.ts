import api from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import type { ChatRoom, ChatContact, AIAssistantMessage } from '@/types/chat';

export const chatService = {
  createDM: (targetAccountId: string) =>
    api.post<ApiResponse<ChatRoom>>('/chat/rooms/dm', { target_account_id: targetAccountId }),

  listRooms: () =>
    api.get<ApiResponse<ChatRoom[]>>('/chat/rooms'),

  getContacts: () =>
    api.get<ApiResponse<ChatContact[]>>('/chat/contacts'),

  createBroadcast: (sessionId: string) =>
    api.post<ApiResponse<ChatRoom>>('/chat/rooms/broadcast', { session_id: sessionId }),

  sendAIMessage: (message: string, history: AIAssistantMessage[]) =>
    api.post<ApiResponse<{ response: string }>>('/ai/assistant/message', { message, history }),
};
