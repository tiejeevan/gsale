// services/followService.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface FollowUser {
  id: number;
  username: string;
  display_name: string | null;
  profile_image: string | null;
  bio: string | null;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  followed_at?: string;
  is_followed_by_current_user?: boolean;
}

export interface FollowStats {
  follower_count: number;
  following_count: number;
}

export interface FollowersResponse {
  followers: FollowUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface FollowingResponse {
  following: FollowUser[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Follow a user
 */
export const followUser = async (userId: number, token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/follows/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to follow user');
  }

  return response.json();
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (userId: number, token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/follows/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to unfollow user');
  }

  return response.json();
};

/**
 * Check if current user follows a specific user
 */
export const checkFollowStatus = async (userId: number, token: string): Promise<boolean> => {
  const response = await fetch(`${API_URL}/api/follows/${userId}/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check follow status');
  }

  const data = await response.json();
  return data.data.is_following;
};

/**
 * Get followers of a user
 */
export const getFollowers = async (
  userId: number,
  token: string,
  limit = 50,
  offset = 0
): Promise<FollowersResponse> => {
  const response = await fetch(
    `${API_URL}/api/follows/${userId}/followers?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get followers');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Get following list of a user
 */
export const getFollowing = async (
  userId: number,
  token: string,
  limit = 50,
  offset = 0
): Promise<FollowingResponse> => {
  const response = await fetch(
    `${API_URL}/api/follows/${userId}/following?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get following list');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Get follow stats for a user
 */
export const getFollowStats = async (userId: number, token: string): Promise<FollowStats> => {
  const response = await fetch(`${API_URL}/api/follows/${userId}/stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get follow stats');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Get mutual follows (friends)
 */
export const getMutualFollows = async (
  token: string,
  limit = 50,
  offset = 0
): Promise<FollowUser[]> => {
  const response = await fetch(
    `${API_URL}/api/follows/mutual/list?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get mutual follows');
  }

  const result = await response.json();
  return result.data.mutual_follows;
};

/**
 * Get follow suggestions
 */
export const getFollowSuggestions = async (token: string, limit = 10): Promise<FollowUser[]> => {
  const response = await fetch(`${API_URL}/api/follows/suggestions/list?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get follow suggestions');
  }

  const result = await response.json();
  return result.data.suggestions;
};

/**
 * Remove a follower
 */
export const removeFollower = async (userId: number, token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/follows/followers/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove follower');
  }

  return response.json();
};

/**
 * Check follow status for multiple users
 */
export const checkMultipleFollows = async (
  userIds: number[],
  token: string
): Promise<Record<number, boolean>> => {
  const response = await fetch(`${API_URL}/api/follows/check-multiple`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_ids: userIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to check follow status');
  }

  const result = await response.json();
  return result.data;
};
