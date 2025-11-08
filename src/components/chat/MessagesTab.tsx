import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { useUserContext } from '../../context/UserContext';
import FloatingChatPopup from './FloatingChatPopup';

const MessagesTab = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const { chats, totalUnreadCount } = useChatContext();
  const { currentUser } = useUserContext();
  const messagesTabRef = useRef<HTMLDivElement>(null);

  // Close expanded tab when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && messagesTabRef.current && !messagesTabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleChatClick = (chatId: number) => {
    setSelectedChatId(chatId);
    setIsExpanded(false);
  };

  const handleClosePopup = () => {
    setSelectedChatId(null);
  };

  const formatLastMessage = (chat: any) => {
    if (!chat.last_message_content) return 'No messages yet';
    const preview = chat.last_message_content.substring(0, 40);
    return preview.length < chat.last_message_content.length ? `${preview}...` : preview;
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const selectedChat = chats.find(c => c.id === selectedChatId);

  return (
    <>
      {/* Messages Tab */}
      <div ref={messagesTabRef} className="fixed bottom-0 right-6 z-40">
        {/* Expanded Chat List */}
        {isExpanded && (
          <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-56 sm:w-80 mb-0">
            {/* Header */}
            <div className="px-2 py-1.5 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-xs sm:text-base text-gray-900 dark:text-gray-100">Messages</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Chat List */}
            <div className="max-h-80 sm:max-h-96 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="p-4 sm:p-8 text-center text-gray-500 dark:text-gray-400">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xs sm:text-sm">Start chat with a user by going to their profile page and clicking on message icon</p>
                </div>
              ) : (
                chats.map(chat => {
                  const isGroup = chat.type === 'group';
                  
                  // For direct chats, get the other participant's name
                  let chatTitle = chat.title || 'User';
                  let avatarUrl = chat.avatar_url;
                  
                  if (!isGroup) {
                    if (chat.participants && chat.participants.length > 0) {
                      // Find the other participant (not the current user)
                      const otherParticipant = chat.participants.find(p => p.id !== currentUser?.id);
                      if (otherParticipant) {
                        chatTitle = otherParticipant.username;
                        avatarUrl = otherParticipant.avatar_url;
                      }
                    } else if (chat.last_message_sender && chat.last_message_sender !== currentUser?.username) {
                      // Fallback: use last message sender as the chat title
                      chatTitle = chat.last_message_sender;
                    }
                  }
                  
                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleChatClick(chat.id)}
                      className="w-full p-2 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-all duration-150 border-b border-gray-100 dark:border-gray-700 text-left outline-none focus:outline-none active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Avatar - Left Side */}
                        <div className="flex-shrink-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={chatTitle}
                              className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              {isGroup ? (
                                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              ) : (
                                <span className="text-sm sm:text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                                  {chatTitle.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right Side - Name and Message */}
                        <div className="flex-1 min-w-0">
                          {/* User Name */}
                          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                            <h4 className="font-semibold text-xs sm:text-base text-gray-900 dark:text-gray-100 truncate">
                              {chatTitle}
                            </h4>
                            <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 flex-shrink-0">
                              {chat.last_message_at && (
                                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(chat.last_message_at)}
                                </span>
                              )}
                              {chat.unread_count > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full">
                                  {chat.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Last Message */}
                          <div className="flex items-center gap-1">
                            <p className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                              {chat.last_message_sender && chat.last_message_sender !== currentUser?.username && (
                                <span className="font-medium">{chat.last_message_sender}: </span>
                              )}
                              {formatLastMessage(chat)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
                .filter(Boolean) // Remove null entries
              )}
            </div>
          </div>
        )}

        {/* Collapsed Tab */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-t-lg shadow-lg transition flex items-center gap-1.5 sm:gap-2 relative"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-semibold text-xs sm:text-base">Messages</span>
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full min-w-[18px] sm:min-w-[20px] text-center">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Floating Chat Popup */}
      {selectedChat && (() => {
        const otherParticipant = selectedChat.participants?.find(p => p.id !== currentUser?.id);
        const isGroup = selectedChat.type === 'group';
        
        // Don't render if we don't have a valid user ID for direct chats
        if (!isGroup && (!otherParticipant || !otherParticipant.id)) {
          return null;
        }
        
        return (
          <FloatingChatPopup
            userId={otherParticipant?.id || 0}
            username={isGroup ? (selectedChat.title || 'Group Chat') : (otherParticipant?.username || 'User')}
            avatarUrl={isGroup ? selectedChat.avatar_url : otherParticipant?.avatar_url}
            onClose={handleClosePopup}
          />
        );
      })()}
    </>
  );
};

export default MessagesTab;
