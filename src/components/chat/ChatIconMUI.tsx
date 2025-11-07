import { IconButton, Badge } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../../context/ChatContext';

const ChatIconMUI = () => {
  const navigate = useNavigate();
  const { totalUnreadCount } = useChatContext();

  return (
    <IconButton
      onClick={() => navigate('/chat')}
      color="inherit"
      title="Messages"
    >
      <Badge badgeContent={totalUnreadCount} color="error" max={9}>
        <ChatIcon />
      </Badge>
    </IconButton>
  );
};

export default ChatIconMUI;
