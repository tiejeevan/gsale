import { useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';

interface MessageUserButtonProps {
  userId: number;
  username?: string;
  className?: string;
}

const MessageUserButton = ({ userId, className = '' }: MessageUserButtonProps) => {
  const navigate = useNavigate();
  const { startDirectChat, loading } = useChat();

  const handleClick = async () => {
    const chatId = await startDirectChat(userId);
    if (chatId) {
      navigate('/chat');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed ${className}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <span>{loading ? 'Loading...' : 'Message'}</span>
    </button>
  );
};

export default MessageUserButton;
