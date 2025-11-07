import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../../context/ChatContext';

const ChatIcon = () => {
  const navigate = useNavigate();
  const { totalUnreadCount } = useChatContext();

  return (
    <button
      onClick={() => navigate('/chat')}
      className="relative p-2 rounded-full hover:bg-gray-100 transition"
      title="Messages"
    >
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {totalUnreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
          {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
        </span>
      )}
    </button>
  );
};

export default ChatIcon;
