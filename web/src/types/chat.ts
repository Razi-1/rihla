export interface ChatRoom {
  room_id: string;
  name: string;
  type: 'dm' | 'broadcast';
  avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  members: ChatMember[];
}

export interface ChatMember {
  account_id: string;
  display_name: string;
  avatar_url: string | null;
  account_type?: string;
}

export interface ChatMessage {
  event_id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
}

export interface ChatContact {
  account_id: string;
  display_name: string;
  avatar_url: string | null;
  account_type: string;
  room_id: string | null;
}

export interface CreateDMRequest {
  target_account_id: string;
}

export interface AIAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}
