import type {
  Chat,
  Message,
  CreateDirectChatRequest,
  CreateDirectChatResponse,
  CreateGroupChatRequest,
  CreateGroupChatResponse,
  SendMessageRequest,
  SendMessageResponse,
  UpdateChatSettingsRequest,
  MarkAsReadRequest,
  TypingUser,
} from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL;

// =================== Chat Management ===================

export const getUserChats = async (token: string): Promise<Chat[]> => {
  const res = await fetch(`${API_URL}/api/chats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch chats');
  const data = await res.json();
  return data.chats || [];
};

export const createDirectChat = async (
  token: string,
  request: CreateDirectChatRequest
): Promise<CreateDirectChatResponse> => {
  const res = await fetch(`${API_URL}/api/chats/direct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
    console.error('Create direct chat failed:', errorData);
    throw new Error(errorData.message || 'Failed to create direct chat');
  }
  return res.json();
};

export const createGroupChat = async (
  token: string,
  request: CreateGroupChatRequest
): Promise<CreateGroupChatResponse> => {
  const res = await fetch(`${API_URL}/api/chats/group`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error('Failed to create group chat');
  return res.json();
};

export const getChatDetails = async (token: string, chatId: number): Promise<Chat> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch chat details');
  const data = await res.json();
  return data.chat;
};

export const updateChat = async (
  token: string,
  chatId: number,
  updates: { title?: string; description?: string; avatar_url?: string }
): Promise<void> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update chat');
};

export const leaveChat = async (token: string, chatId: number): Promise<void> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to leave chat');
};

export const updateChatSettings = async (
  token: string,
  chatId: number,
  settings: UpdateChatSettingsRequest
): Promise<void> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update chat settings');
};

// =================== Messages ===================

export const getChatMessages = async (
  token: string,
  chatId: number,
  limit = 50,
  offset = 0
): Promise<Message[]> => {
  const res = await fetch(
    `${API_URL}/api/chats/${chatId}/messages?limit=${limit}&offset=${offset}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error('Failed to fetch messages');
  const data = await res.json();
  return data.messages || [];
};

export const sendMessage = async (
  token: string,
  chatId: number,
  request: SendMessageRequest
): Promise<SendMessageResponse> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
};

export const editMessage = async (
  token: string,
  messageId: number,
  content: string
): Promise<void> => {
  const res = await fetch(`${API_URL}/api/chats/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to edit message');
};

export const deleteMessage = async (token: string, messageId: number): Promise<void> => {
  const res = await fetch(`${API_URL}/api/chats/messages/${messageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete message');
};

export const markMessagesAsRead = async (
  token: string,
  chatId: number,
  request: MarkAsReadRequest
): Promise<void> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error('Failed to mark messages as read');
};

// =================== Reactions ===================

export const addReaction = async (
  token: string,
  messageId: number,
  emoji: string
): Promise<void> => {
  const res = await fetch(`${API_URL}/api/chats/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ emoji }),
  });
  if (!res.ok) throw new Error('Failed to add reaction');
};

export const removeReaction = async (
  token: string,
  messageId: number,
  emoji: string
): Promise<void> => {
  const res = await fetch(
    `${API_URL}/api/chats/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error('Failed to remove reaction');
};

// =================== Typing Indicators ===================

export const setTyping = async (token: string, chatId: number): Promise<void> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}/typing`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to set typing indicator');
};

export const getTypingUsers = async (token: string, chatId: number): Promise<TypingUser[]> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}/typing`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to get typing users');
  const data = await res.json();
  return data.typingUsers || [];
};
