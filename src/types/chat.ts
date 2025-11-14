// Chat Types
export type ChatType = 'direct' | 'group';
export type MessageType = 'text' | 'image' | 'video' | 'file' | 'system';
export type ParticipantRole = 'member' | 'admin' | 'owner';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface ChatParticipant extends User {
  role: ParticipantRole;
  joined_at: string;
  left_at?: string;
}

export interface MessageReaction {
  emoji: string;
  user_id: number;
  username: string;
}

export interface MessageAttachment {
  id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface MessageReadStatus {
  user_id: number;
  status: MessageStatus;
  updated_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  type: MessageType;
  reply_to?: number;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  username: string;
  avatar_url?: string;
  sender_profile_image?: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  read_by?: MessageReadStatus[];
}

export interface Chat {
  id: number;
  type: ChatType;
  title?: string;
  description?: string;
  avatar_url?: string;
  created_by?: number;
  last_message_at?: string;
  last_message_content?: string;
  last_message_type?: MessageType;
  last_message_sender?: string;
  unread_count: number;
  pinned: boolean;
  muted: boolean;
  hidden: boolean;
  participants?: ChatParticipant[];
  created_at?: string;
  updated_at?: string;
}

export interface TypingUser {
  id: number;
  username: string;
  avatar_url?: string;
}

// API Request/Response types
export interface CreateDirectChatRequest {
  otherUserId: number;
}

export interface CreateDirectChatResponse {
  success: boolean;
  chatId: number;
  created: boolean;
}

export interface CreateGroupChatRequest {
  title: string;
  description?: string;
  participantIds: number[];
}

export interface CreateGroupChatResponse {
  success: boolean;
  chat: Chat;
}

export interface SendMessageRequest {
  content: string;
  type?: MessageType;
  replyTo?: number;
}

export interface SendMessageResponse {
  success: boolean;
  message: Message;
}

export interface UpdateChatSettingsRequest {
  muted?: boolean;
  pinned?: boolean;
  hidden?: boolean;
}

export interface MarkAsReadRequest {
  lastMessageId: number;
}
