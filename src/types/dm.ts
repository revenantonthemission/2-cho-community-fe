export interface DMUser {
  user_id: number;
  nickname: string;
  profile_image_url: string;
}

export interface LastMessage {
  content: string | null;
  is_mine: boolean;
  is_deleted: boolean;
}

export interface Conversation {
  id: number;
  last_message_at: string | null;
  created_at: string;
  other_user: DMUser;
  last_message: LastMessage | null;
  unread_count: number;
}

export interface DMMessage {
  id: number;
  sender_id: number;
  sender_nickname: string;
  sender_profile_image: string;
  content: string | null;
  is_read: boolean;
  created_at: string;
  is_deleted: boolean;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  pagination: { total_count: number; has_more: boolean };
}

export interface MessageListResponse {
  messages: DMMessage[];
  other_user: DMUser;
  pagination: { total_count: number; has_more: boolean };
}

export interface SentMessageResponse {
  message: {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    is_read: boolean;
    created_at: string;
  };
}

export interface CreateConversationResponse {
  conversation: {
    id: number;
    other_user: DMUser;
    created_at: string;
  };
}
