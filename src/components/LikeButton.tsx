// src/components/LikeButton.tsx
import React, { useState, useEffect } from "react";
import { IconButton, Typography, Box, Fade } from "@mui/material";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import { addLike, removeLike } from "../services/likeService";
import { socket } from "../socket"; // <-- shared socket instance
import { useUserContext } from "../context/UserContext";

interface LikeButtonProps {
  initialLikesCount: number;
  isInitiallyLiked: boolean;
  targetType: string;
  targetId: number | string;
  token: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  initialLikesCount,
  isInitiallyLiked,
  targetType,
  targetId,
  token,
}) => {
  const [isLiked, setIsLiked] = useState(isInitiallyLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser: user } = useUserContext();


  // Initialize state if props change
  useEffect(() => {
    setIsLiked(isInitiallyLiked);
    setLikesCount(initialLikesCount);
  }, [isInitiallyLiked, initialLikesCount]);

  // ================= Socket: join post room & listen for likes/unlikes =================
  useEffect(() => {
    const postRoom = `post_${targetId}`;
    const likeEvent = `${postRoom}:like:new`;

    // Join the room for this post
    const joinRoom = () => {
      if (socket.connected) {
        console.log(`🔌 Joining room: ${postRoom}`);
        socket.emit("join", postRoom);
      } else {
        console.log(`⚠️ Socket not connected, cannot join room: ${postRoom}`);
      }
    };

    // Join immediately if connected
    joinRoom();

    // Also join when socket connects
    socket.on("connect", joinRoom);

    // Handler for new like/unlike events
    const handleNewLike = (likeData: {
      target_type: string;
      target_id: number;
      user_id: number;
      reaction_type: string; // 'like' or 'unlike'
    }) => {
      console.log(`📥 Received like event for post ${targetId}:`, likeData);
      if (likeData.target_id === targetId) {
        if (likeData.user_id === user?.id) {
          console.log(`⏭️ Skipping own like event`);
          return;
        }
        setLikesCount((prev) => {
          const newCount = likeData.reaction_type === "like" ? prev + 1 : prev - 1;
          console.log(`✅ Updating like count from ${prev} to ${newCount}`);
          return newCount;
        });
      }
    };

    // Listen for socket event
    socket.on(likeEvent, handleNewLike);

    // Cleanup on unmount
    return () => {
      socket.off(likeEvent, handleNewLike);
      socket.off("connect", joinRoom);
    };
  }, [targetId]);

  // ================= Like button click handler =================
  const handleLikeClick = async () => {
    if (isLoading || !token) return;
    setIsLoading(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic UI update
    setIsLiked(!prevLiked);
    setLikesCount(prevCount + (!prevLiked ? 1 : -1));

    try {
      const apiData = { target_type: targetType, target_id: targetId };
      if (!prevLiked) await addLike(token, apiData);
      else await removeLike(token, apiData);
    } catch (error) {
      console.error("Failed to update like/unlike:", error);
      // rollback on error
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      <IconButton
        onClick={handleLikeClick}
        disabled={isLoading}
        size="small"
        sx={{
          color: isLiked ? '#ef4444' : 'rgba(255, 255, 255, 0.6)',
          transition: 'all 0.2s ease-in-out',
          transform: isLiked ? 'scale(1.1)' : 'scale(1)',
          '&:hover': {
            color: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            transform: 'scale(1.1)',
          },
          '&:disabled': {
            opacity: 0.7,
          },
          p: 0.5,
        }}
      >
        <Fade in={!isLoading} timeout={200}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isLiked ? (
              <Favorite 
                fontSize="small" 
                sx={{ 
                  color: '#ef4444',
                  filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.4))',
                }} 
              />
            ) : (
              <FavoriteBorder fontSize="small" />
            )}
          </Box>
        </Fade>
      </IconButton>
      
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontSize: '0.75rem',
          fontWeight: 500,
          minWidth: '20px',
          textAlign: 'center',
        }}
      >
        {likesCount}
      </Typography>
    </Box>
  );
};

export default LikeButton;
