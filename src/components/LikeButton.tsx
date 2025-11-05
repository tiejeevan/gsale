// src/components/LikeButton.tsx
import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";
import { addLike, removeLike } from "../services/likeService";
import { socket } from "../socket"; // <-- shared socket instance
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

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
  const { user } = useContext(AuthContext)!;


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
    if (socket.connected) {
      socket.emit("join", postRoom);
    }

    // Handler for new like/unlike events
    const handleNewLike = (likeData: {
      target_type: string;
      target_id: number;
      user_id: number;
      reaction_type: string; // 'like' or 'unlike'
    }) => {
      if (likeData.target_id === targetId) {
        if (likeData.user_id === user?.id) return;
        setLikesCount((prev) => {
          if (likeData.reaction_type === "like") return prev + 1;
          if (likeData.reaction_type === "unlike") return prev - 1;
          return prev;
        });
      }
    };

    // Listen for socket event
    socket.on(likeEvent, handleNewLike);

    // Cleanup on unmount
    return () => {
      socket.off(likeEvent, handleNewLike);
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
    <button
      onClick={handleLikeClick}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full font-semibold
        transition-all duration-300 transform
        ${isLiked
          ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg scale-105"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
        ${isLoading ? "cursor-wait opacity-70" : "cursor-pointer"}
      `}
    >
      <FaHeart
        className={`
          ${isLiked ? "text-white animate-pulse" : "text-pink-500"}
          transition-transform duration-200
          ${isLiked ? "scale-125" : "scale-100"}
        `}
      />
      <span>{likesCount}</span>
    </button>
  );
};

export default LikeButton;
