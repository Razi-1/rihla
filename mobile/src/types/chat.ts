export interface CreateDMRoomRequest {
  target_account_id: string;
}

export interface CreateBroadcastRoomRequest {
  session_id: string;
}

export interface RoomResponse {
  id: string;
  matrix_room_id: string;
  room_type: 'dm' | 'broadcast';
  other_user_name: string | null;
  session_title: string | null;
}

export interface ContactResponse {
  account_id: string;
  first_name: string;
  last_name: string;
  account_type: string;
  profile_picture_url: string | null;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
}
