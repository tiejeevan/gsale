import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Popper,
  ClickAwayListener,
} from '@mui/material';

interface User {
  id: number;
  username: string;
  display_name?: string;
  profile_image?: string;
  first_name?: string;
  last_name?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  multiline?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onFocus,
  onKeyDown,
  placeholder,
  rows = 2,
  multiline = true,
  autoFocus = false,
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Search for users when @ is typed
  useEffect(() => {
    const searchUsers = async () => {
      if (!mentionQuery) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${API_URL}/api/users/search/mentions?q=${encodeURIComponent(mentionQuery)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        
        if (data.success && data.users) {
          setSuggestions(data.users);
          setShowSuggestions(data.users.length > 0);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounce);
  }, [mentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(newCursorPos);

    // Check if @ was typed
    const textBeforeCursor = newValue.substring(0, newCursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if we're still in a mention (no spaces after @)
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionQuery(textAfterAt);
        setAnchorEl(e.target);
        return;
      }
    }
    
    // No active mention
    setMentionQuery('');
    setShowSuggestions(false);
  };

  const insertMention = (user: User) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeAt = value.substring(0, lastAtIndex);
      const mention = `@${user.username} `;
      const newValue = beforeAt + mention + textAfterCursor;
      const newCursorPos = (beforeAt + mention).length;
      
      onChange(newValue);
      setShowSuggestions(false);
      setMentionQuery('');
      
      // Set cursor position after mention
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setMentionQuery('');
      }
    }
    
    if (onKeyDown) {
      onKeyDown(e as React.KeyboardEvent<HTMLTextAreaElement>);
    }
  };

  const getDisplayName = (user: User) => {
    if (user.display_name) return user.display_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    return user.username;
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        inputRef={inputRef}
        multiline={multiline}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        disabled={disabled}
        variant="outlined"
        size="small"
        fullWidth
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'transparent',
            fontSize: '0.85rem',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
            },
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'text.secondary',
            opacity: 0.7,
          },
        }}
      />

      {/* Mention Suggestions Dropdown */}
      <Popper
        open={showSuggestions}
        anchorEl={anchorEl}
        placement="top-start"
        sx={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
          <Paper
            elevation={8}
            sx={{
              maxHeight: 250,
              overflow: 'auto',
              minWidth: 280,
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 2,
              mt: 1,
            }}
          >
            <List sx={{ p: 0.5 }}>
              {suggestions.map((user, index) => (
                <ListItem
                  key={user.id}
                  component="div"
                  onClick={() => insertMention(user)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    cursor: 'pointer',
                    backgroundColor: index === selectedIndex ? 'rgba(103, 126, 234, 0.15)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(103, 126, 234, 0.1)',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={user.profile_image}
                      sx={{
                        width: 32,
                        height: 32,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {getDisplayName(user)}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        @{user.username}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
};

export default MentionInput;
