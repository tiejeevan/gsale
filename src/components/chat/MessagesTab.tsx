import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatContext } from '../../context/ChatContext';
import { useUserContext } from '../../context/UserContext';
import FloatingChatPopup from './FloatingChatPopup';
import { Box, Paper, Typography, Avatar, Badge, IconButton, Button, useMediaQuery, useTheme, Fab } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, Chat as ChatIcon } from '@mui/icons-material';
import { useDrag } from '@use-gesture/react';

// Storage keys for position
const STORAGE_KEY_MOBILE = 'messagesTab_position_mobile';
const STORAGE_KEY_DESKTOP = 'messagesTab_position_desktop';

// Default positions
const getDefaultPosition = (isMobile: boolean) => {
  if (isMobile) {
    return { x: window.innerWidth - 72, y: window.innerHeight - 150 };
  }
  return { x: window.innerWidth, y: window.innerHeight / 2 };
};

const MessagesTab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Log expanded state changes
  useEffect(() => {
    console.log('📊 Messages panel state changed:', { isExpanded, isDragging });
  }, [isExpanded, isDragging]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const { chats, totalUnreadCount } = useChatContext();
  const { currentUser } = useUserContext();
  const messagesTabRef = useRef<HTMLDivElement>(null);

  // Load saved position or use default
  const getSavedPosition = () => {
    const storageKey = isMobile ? STORAGE_KEY_MOBILE : STORAGE_KEY_DESKTOP;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getDefaultPosition(isMobile);
      }
    }
    return getDefaultPosition(isMobile);
  };

  const [position, setPosition] = useState(getSavedPosition);

  // Update position when switching between mobile/desktop
  useEffect(() => {
    setPosition(getSavedPosition());
  }, [isMobile]);

  // Save position to localStorage
  const savePosition = (pos: { x: number; y: number }) => {
    const storageKey = isMobile ? STORAGE_KEY_MOBILE : STORAGE_KEY_DESKTOP;
    localStorage.setItem(storageKey, JSON.stringify(pos));
  };

  // Close expanded tab when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && messagesTabRef.current && !messagesTabRef.current.contains(event.target as Node)) {
        console.log('🔙 Clicked outside - closing messages list');
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

  // Detect scrolling and make messages list transparent
  useEffect(() => {
    let scrollTimeout: number | null = null;

    const handleScroll = (e: Event) => {
      if (isExpanded) {
        // Check if scroll is happening inside the messages panel
        const target = e.target as HTMLElement;
        const isMessagesScroll = messagesTabRef.current?.contains(target);
        
        if (isMessagesScroll) {
          console.log('📜 Scrolling inside messages panel - ignoring');
          return; // Don't make transparent if scrolling inside messages
        }

        console.log('📜 Background scrolling - making panel transparent');
        setIsScrolling(true);

        // Clear existing timeout
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }

        // Reset transparency after scrolling stops
        scrollTimeout = setTimeout(() => {
          console.log('📜 Scrolling stopped - restoring panel opacity');
          setIsScrolling(false);
        }, 150) as unknown as number;
      }
    };

    if (isExpanded) {
      window.addEventListener('scroll', handleScroll, true); // Use capture phase
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [isExpanded]);

  const handleChatClick = (chatId: number) => {
    setSelectedChatId(chatId);
    setIsExpanded(false);
    // Add hash to URL for back button support on mobile
    navigate(location.pathname + location.search + '#chat', { replace: false });
  };

  const handleClosePopup = () => {
    setSelectedChatId(null);
    // Remove hash from URL
    if (location.hash === '#chat') {
      navigate(-1);
    }
  };

  // Close popup when hash changes (back button pressed)
  useEffect(() => {
    if (location.hash !== '#chat' && selectedChatId !== null) {
      setSelectedChatId(null);
    }
  }, [location.hash]);

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

  // Track if user actually dragged (moved more than threshold)
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const dragStartTime = useRef(0);
  const resetTimeoutRef = useRef<number | null>(null);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);

  // Handle touch start - track initial position
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchStartTime.current = Date.now();
    console.log('👆 Touch start', touchStartPos.current);
  };

  // Handle touch end - determine if it was a tap or drag
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTime.current;
    
    // If touch was very short and hasDragged is false, treat as tap
    if (touchDuration < 300 && !hasDragged.current) {
      console.log('👆 Quick tap detected', { duration: touchDuration, hasDragged: hasDragged.current });
      e.preventDefault();
      e.stopPropagation();
      setIsExpanded(true);
    } else {
      console.log('👆 Touch end', { duration: touchDuration, hasDragged: hasDragged.current });
    }
  };

  // Simple click handler (for mouse/desktop)
  const handleButtonClick = (e: React.MouseEvent) => {
    console.log('🖱️ Click handler triggered', {
      hasDragged: hasDragged.current,
      isExpanded,
      isDragging,
      eventType: e.type,
    });

    // Only handle click if not dragging
    if (!hasDragged.current) {
      console.log('✅ Opening messages list');
      e.stopPropagation();
      setIsExpanded(true);
    } else {
      console.log('❌ Click blocked - was dragging');
    }
  };

  // Drag gesture handler
  const bind = useDrag(
    ({ offset: [x, y], down, first, last, movement: [mx, my], event }) => {
      // Track drag start position and time
      if (first) {
        console.log('🎯 Drag started', { x, y });
        dragStartPos.current = { x, y };
        hasDragged.current = false;
        dragStartTime.current = Date.now();
        
        // Clear any pending reset
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
          resetTimeoutRef.current = null;
        }
      }

      // Check if user has moved more than 10px (threshold for drag vs click)
      const dragDistance = Math.sqrt(mx * mx + my * my);
      
      if (dragDistance > 10 && !hasDragged.current) {
        console.log('🔄 Drag detected', { dragDistance, mx, my });
        hasDragged.current = true;
        // Prevent click event if dragging
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
      }

      setIsDragging(down && hasDragged.current);

      // Only update position if actually dragging
      if (hasDragged.current && down) {
        // Constrain position within viewport with proper margins
        const buttonWidth = isMobile ? 56 : 60;
        const buttonHeight = isMobile ? 56 : 120;
        const margin = 10; // Minimum margin from edges
        
        const constrainedX = Math.max(
          buttonWidth / 2 + margin,
          Math.min(window.innerWidth - buttonWidth / 2 - margin, x)
        );
        const constrainedY = Math.max(
          buttonHeight / 2 + margin,
          Math.min(window.innerHeight - buttonHeight / 2 - margin, y)
        );

        const newPos = { x: constrainedX, y: constrainedY };
        console.log('📍 New position:', newPos, 'Viewport:', { width: window.innerWidth, height: window.innerHeight });
        setPosition(newPos);
      }

      // Handle drag end
      if (last) {
        console.log('🏁 Drag ended', { 
          hasDragged: hasDragged.current, 
          dragDistance,
          duration: Date.now() - dragStartTime.current 
        });

        if (hasDragged.current) {
          // Save position after drag
          savePosition(position);
          console.log('💾 Position saved', position);
          
          // Reset hasDragged flag after a longer delay for mobile
          const resetDelay = isMobile ? 400 : 200;
          resetTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Resetting hasDragged flag');
            hasDragged.current = false;
            resetTimeoutRef.current = null;
          }, resetDelay);
        } else {
          // Was a tap/click, not a drag
          console.log('👆 Was a tap, not a drag');
          hasDragged.current = false;
        }
      }
    },
    {
      from: () => [position.x, position.y],
      bounds: {
        left: 0,
        right: window.innerWidth,
        top: 0,
        bottom: window.innerHeight,
      },
      filterTaps: true,
      pointer: { touch: true },
    }
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const selectedChat = chats.find(c => c.id === selectedChatId);

  // Check if icon is visible (within viewport)
  const isIconVisible = position.x > 0 && position.x < window.innerWidth && 
                        position.y > 0 && position.y < window.innerHeight;

  // Reset position to default if off-screen
  const resetPosition = () => {
    const defaultPos = getDefaultPosition(isMobile);
    setPosition(defaultPos);
    savePosition(defaultPos);
    console.log('🔄 Position reset to default:', defaultPos);
  };

  return (
    <>
      {/* Backdrop - prevents interaction with background when messages list is open */}
      {isExpanded && (
        <Box
          onClick={(e) => {
            console.log('🔙 Backdrop clicked - closing messages list');
            e.stopPropagation();
            e.preventDefault();
            setIsExpanded(false);
          }}
          onTouchEnd={(e) => {
            console.log('🔙 Backdrop touched - closing messages list');
            e.stopPropagation();
            e.preventDefault();
            setIsExpanded(false);
          }}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
            transition: 'opacity 0.3s ease',
            opacity: isScrolling ? 0.1 : 1,
            // Prevent drag events from passing through
            pointerEvents: 'auto',
          }}
        />
      )}

      {/* Reset button if icon is off-screen */}
      {!isIconVisible && (
        <Button
          onClick={resetPosition}
          variant="contained"
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 50,
          }}
        >
          Reset Messages Icon
        </Button>
      )}

      {/* Messages Tab - Draggable */}
      <Box 
        ref={messagesTabRef} 
        {...bind()}
        sx={{ 
          position: 'fixed', 
          left: position.x - (isMobile ? 28 : 30),
          top: position.y - (isMobile ? 28 : 60),
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          // Add visual indicator when dragging
          ...(isDragging && {
            opacity: 0.8,
            transform: 'scale(1.1)',
          }),
        }}
        onMouseEnter={() => !isMobile && !isDragging && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && !isDragging && setIsExpanded(false)}
      >
        {/* Collapsed Tab */}
        {!isExpanded && (
          <>
            {/* Mobile: Compact Floating Button */}
            {isMobile ? (
              <Fab
                color="primary"
                onClick={handleButtonClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                sx={{
                  width: 56,
                  height: 56,
                  boxShadow: 3,
                  position: 'relative',
                  cursor: isDragging ? 'grabbing' : 'pointer',
                  pointerEvents: 'auto',
                }}
              >
                <Badge
                  badgeContent={totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      minWidth: 18,
                      height: 18,
                      top: -8,
                      right: -8,
                    },
                  }}
                >
                  <ChatIcon sx={{ fontSize: 24 }} />
                </Badge>
              </Fab>
            ) : (
              /* Desktop: Vertical Tab */
              <Box
                onClick={handleButtonClick}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  py: 3,
                  px: 1.5,
                  borderRadius: 2,
                  boxShadow: 3,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  position: 'relative',
                  transition: isDragging ? 'none' : 'all 0.3s ease',
                  pointerEvents: 'auto',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    px: 2,
                  },
                }}
              >
                <ChatIcon sx={{ fontSize: 24 }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    letterSpacing: 1,
                  }}
                >
                  MESSAGES
                </Typography>
                {totalUnreadCount > 0 && (
                  <Badge
                    badgeContent={totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    color="error"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      '& .MuiBadge-badge': {
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        minWidth: 18,
                        height: 18,
                      },
                    }}
                  />
                )}
              </Box>
            )}
          </>
        )}

        {/* Expanded Chat List */}
        {isExpanded && !isDragging && (
          <Paper
            elevation={8}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            sx={{
              position: 'fixed',
              borderRadius: 2,
              // 60% width on mobile, standard on desktop
              width: { xs: '60vw', sm: 360, md: 400 },
              minWidth: { xs: 280, sm: 360 },
              maxWidth: { xs: 340, sm: 360, md: 400 },
              height: { xs: 'auto', sm: '80vh' },
              maxHeight: { xs: '55vh', sm: 600 },
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              // Bottom-right positioning - 10% from bottom
              ...(isMobile ? {
                right: 16,
                bottom: '10vh',
                left: 'auto',
                top: 'auto',
              } : {
                left: Math.min(position.x - 400, window.innerWidth - 420),
                top: Math.max(20, Math.min(position.y - 300, window.innerHeight - 620)),
              }),
              zIndex: 41,
              // Transparency during scrolling
              opacity: isScrolling ? 0.3 : 1,
              transition: 'opacity 0.2s ease',
              // Prevent pointer events from passing through
              pointerEvents: 'auto',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                px: { xs: 1.5, sm: 2 },
                py: { xs: 1, sm: 2 },
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'primary.main',
                color: 'white',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                <ChatIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                  Messages
                </Typography>
              </Box>
              <IconButton
                onClick={() => setIsExpanded(false)}
                size="small"
                sx={{ 
                  color: 'white',
                  p: { xs: 0.5, sm: 1 },
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              </IconButton>
            </Box>

            {/* Chat List */}
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '3px',
                '&:hover': {
                  background: 'rgba(0,0,0,0.3)',
                },
              },
            }}>
              {chats.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <ChatIcon sx={{ fontSize: 48, mx: 'auto', mb: 2, opacity: 0.3 }} />
                  <Typography variant="body2">
                    Start chat with a user by going to their profile page and clicking on message icon
                  </Typography>
                </Box>
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
                    <Button
                      key={chat.id}
                      onClick={() => handleChatClick(chat.id)}
                      fullWidth
                      sx={{
                        p: { xs: 1, sm: 2 },
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        borderBottom: 1,
                        borderColor: 'divider',
                        borderRadius: 0,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateX(-4px)',
                        },
                        '&:active': {
                          bgcolor: 'action.selected',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, width: '100%' }}>
                        {/* Avatar */}
                        <Avatar
                          src={avatarUrl || `https://ui-avatars.com/api/?name=${chatTitle}&size=48`}
                          alt={chatTitle}
                          sx={{
                            width: { xs: 36, sm: 48 },
                            height: { xs: 36, sm: 48 },
                            bgcolor: 'primary.light',
                          }}
                        >
                          {!avatarUrl && chatTitle.charAt(0).toUpperCase()}
                        </Avatar>

                        {/* Right Side - Name and Message */}
                        <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          {/* User Name */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 0.25, sm: 0.5 } }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
                                color: 'text.primary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {chatTitle}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, ml: 1, flexShrink: 0 }}>
                              {chat.last_message_at && (
                                <Typography variant="caption" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, color: 'text.secondary' }}>
                                  {formatTime(chat.last_message_at)}
                                </Typography>
                              )}
                              {chat.unread_count > 0 && (
                                <Badge
                                  badgeContent={chat.unread_count}
                                  color="primary"
                                  max={99}
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                      height: { xs: 16, sm: 20 },
                                      minWidth: { xs: 16, sm: 20 },
                                      fontWeight: 700,
                                    },
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                          {/* Last Message */}
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {chat.last_message_sender && chat.last_message_sender !== currentUser?.username && (
                              <Typography component="span" sx={{ fontWeight: 500 }}>
                                {chat.last_message_sender}:{' '}
                              </Typography>
                            )}
                            {formatLastMessage(chat)}
                          </Typography>
                        </Box>
                      </Box>
                    </Button>
                  );
                })
                .filter(Boolean) // Remove null entries
              )}
            </Box>
          </Paper>
        )}
      </Box>

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
