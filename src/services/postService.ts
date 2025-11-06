// src/services/postService.ts
export const API_URL = import.meta.env.VITE_API_URL;

export interface Attachment {
  id: number;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface Like {
  user_id: number;
  username: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  content: string | null;
  attachments?: any[] | null;
  like_count?: number;
  liked_by_user?: boolean;
  parent_comment_id: number | null;
  children?: Comment[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Post {
  id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count?: number; // For compatibility with existing components
  is_edited: boolean;
  is_deleted?: boolean;
  visibility?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  liked_by_user?: boolean; // For compatibility with existing components
  attachments?: Attachment[];
  likes?: Like[]; // New field from your backend
  comments?: Comment[]; // New field from your backend
}

// -------------------- 🟢 FETCH POSTS --------------------

export const getUserPosts = async (userId: number, token: string): Promise<Post[]> => {
  const res = await fetch(`${API_URL}/api/posts/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user posts");
  return res.json();
};

export const getAllPosts = async (token: string): Promise<Post[]> => {
  const res = await fetch(`${API_URL}/api/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch all posts");
  return res.json();
};

// Utility function to transform post data for PostCard compatibility
const transformPostData = (post: Post, currentUserId?: number): Post => {
  // Calculate like_count from likes array
  const like_count = post.likes ? post.likes.length : 0;
  
  // Check if current user liked the post
  const liked_by_user = post.likes ? 
    post.likes.some(like => like.user_id === currentUserId) : false;
  
  // Transform comments to add missing fields for compatibility
  const transformedComments = post.comments?.map(comment => ({
    ...comment,
    avatar_url: comment.avatar_url || undefined,
    attachments: comment.attachments || null,
    like_count: comment.like_count || 0,
    liked_by_user: comment.liked_by_user || false,
    children: comment.children || [],
  }));
  
  return {
    ...post,
    like_count,
    liked_by_user,
    comments: transformedComments,
  };
};

export const getPostById = async (postId: number, token: string, currentUserId?: number): Promise<Post> => {
  const res = await fetch(`${API_URL}/api/posts/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch post");
  }
  
  const post = await res.json();
  return transformPostData(post, currentUserId);
};

// -------------------- 🟠 CREATE POST --------------------

export const createPost = async (
  token: string,
  content: string,
  files: File[]
): Promise<Post> => {
  const formData = new FormData();
  formData.append("content", content);
  formData.append("visibility", "public");

  files.forEach((file) => formData.append("files", file));

  const res = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create post");
  }

  return res.json();
};

// -------------------- 🔵 UPDATE POST --------------------

export const updatePost = async (
  token: string,
  postId: number,
  content: string,
  image_url?: string
): Promise<Post> => {
  const res = await fetch(`${API_URL}/api/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, image_url }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update post");
  }
  return res.json();
};

// -------------------- 🔴 DELETE POST --------------------

export const deletePost = async (token: string, postId: number): Promise<{ msg: string }> => {
  const res = await fetch(`${API_URL}/api/posts/${postId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete post");
  }
  return res.json();
};
