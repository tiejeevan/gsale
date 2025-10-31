// src/components/LikeButton.tsx

import React, { useState, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';

// Import the API functions from your new service file
import { addLike, removeLike } from '../services/likeService';

// Define the component's props, adding the 'token'
interface LikeButtonProps {
  initialLikesCount: number;
  isInitiallyLiked: boolean;
  targetType: string; // e.g., 'post', 'comment'
  targetId: number | string;
  token: string ; // <-- 1. ADD THIS: The component now requires the auth token.
}

const LikeButton: React.FC<LikeButtonProps> = ({
  initialLikesCount,
  isInitiallyLiked,
  targetType,
  targetId,
  token, // <-- 2. Destructure the token from the props.
}) => {
  const [isLiked, setIsLiked] = useState(isInitiallyLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);

  // This effect ensures the component state resets if the props from the parent change.
  useEffect(() => {
    setIsLiked(isInitiallyLiked);
    setLikesCount(initialLikesCount);
  }, [isInitiallyLiked, initialLikesCount]);

  const handleLikeClick = async () => {
    // Prevent action if a request is in progress or if the user isn't logged in (no token)
    if (isLoading || !token) {
      return;
    }
    setIsLoading(true);

    // Optimistic UI Update for a snappy user experience
    const previousLikedState = isLiked;
    const previousLikesCount = likesCount;

    setIsLiked(!previousLikedState);
    setLikesCount(previousLikesCount + (!previousLikedState ? 1 : -1));

    try {
      // Prepare the data payload for the API
      const apiData = { target_type: targetType, target_id: targetId };

      if (!previousLikedState) {
        // --- THE FIX ---
        // 3. Call addLike with TWO arguments: (token, data)
        await addLike(token, apiData);
      } else {
        // --- THE FIX ---
        // 4. Call removeLike with TWO arguments: (token, data)
        await removeLike(token, apiData);
      }
    } catch (error) {
      console.error('Failed to update like status:', error);
      // If the API call fails, revert the UI to its previous state
      setIsLiked(previousLikedState);
      setLikesCount(previousLikesCount);
      // Optionally, show an error message to the user
      // alert('Could not update like. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Styling ---
  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: `1px solid ${isLiked ? 'orange' : '#ccc'}`,
    borderRadius: '20px',
    cursor: isLoading ? 'wait' : 'pointer',
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    fontSize: '1rem',
    color: '#333',
  };

  const iconStyle: React.CSSProperties = {
    color: isLiked ? 'orange' : '#aaa',
    fontSize: '1.2rem',
  };

  return (
    <button onClick={handleLikeClick} style={buttonStyle} disabled={isLoading}>
      <FaHeart style={iconStyle} />
      <span>{likesCount}</span>
    </button>
  );
};

export default LikeButton;