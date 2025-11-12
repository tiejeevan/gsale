const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";

export interface BookmarkResponse {
  message: string;
  bookmark?: {
    id: number;
    user_id: number;
    post_id: number;
    created_at: string;
  };
}

export const addBookmark = async (token: string, postId: number): Promise<BookmarkResponse> => {
  const response = await fetch(`${API_URL}/api/bookmarks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ post_id: postId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to bookmark post");
  }

  return response.json();
};

export const removeBookmark = async (token: string, postId: number): Promise<BookmarkResponse> => {
  const response = await fetch(`${API_URL}/api/bookmarks/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove bookmark");
  }

  return response.json();
};

export const getBookmarkedPosts = async (token: string) => {
  const response = await fetch(`${API_URL}/api/bookmarks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch bookmarked posts");
  }

  return response.json();
};
