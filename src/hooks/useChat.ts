import { useState } from 'react';
import { useUserContext } from '../context/UserContext';
import { useChatContext } from '../context/ChatContext';
import { createDirectChat } from '../services/chatService';

export const useChat = () => {
  const { token } = useUserContext();
  const { refreshChats, setActiveChat, chats } = useChatContext();
  const [loading, setLoading] = useState(false);

  const startDirectChat = async (otherUserId: number) => {
    if (!token) return null;

    setLoading(true);
    try {
      const response = await createDirectChat(token, { otherUserId });
      await refreshChats();
      
      // Find the chat in the list
      const chat = chats.find(c => c.id === response.chatId);
      if (chat) {
        setActiveChat(chat);
      }
      
      return response.chatId;
    } catch (error) {
      console.error('Failed to start direct chat:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    startDirectChat,
    loading,
  };
};
