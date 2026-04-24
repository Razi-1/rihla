import api from '../lib/axios';
import {
  CreateDMRoomRequest,
  CreateBroadcastRoomRequest,
  RoomResponse,
  ContactResponse,
} from '../types/chat';
import { SuccessResponse } from '../types/common';

export const chatService = {
  createDMRoom(data: CreateDMRoomRequest) {
    return api.post<SuccessResponse<RoomResponse>>('/chat/rooms/dm', data);
  },

  getRooms() {
    return api.get<SuccessResponse<RoomResponse[]>>('/chat/rooms');
  },

  getContacts() {
    return api.get<SuccessResponse<ContactResponse[]>>('/chat/contacts');
  },

  createBroadcastRoom(data: CreateBroadcastRoomRequest) {
    return api.post<SuccessResponse<RoomResponse>>('/chat/rooms/broadcast', data);
  },
};
