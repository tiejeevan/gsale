import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from '@mui/material';

interface MentionTextProps {
  content: string;
}

const MentionText: React.FC<MentionTextProps> = ({ content }) => {
  if (!content) return null;

  // Split text by @mentions
  const parts = content.split(/(@\w+)/g);

  return (
    <Box component="span" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {parts.map((part, index) => {
        // Check if this part is a mention
        if (part.startsWith('@') && part.length > 1) {
          const username = part.substring(1);
          return (
            <Link
              key={index}
              to={`/profile/${username}`}
              style={{ textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Box
                component="span"
                sx={{
                  color: '#667eea',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    color: '#764ba2',
                    textDecoration: 'underline',
                  },
                }}
              >
                {part}
              </Box>
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </Box>
  );
};

export default MentionText;
