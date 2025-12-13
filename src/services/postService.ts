// src/services/postService.ts
export const API_URL = import.meta.env.VITE_API_URL;

export interface Attachment {
  id: number;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface Like {
  like_id: number;
  user_id: number;
  reaction_type: string;
  post_id: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  content: string | null;
  attachments?: any[] | null;
  like_count?: number;
  liked_by_user?: boolean;
  parent_comment_id: number | null;
  children?: Comment[];
  path?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Post {
  id: number;
  user_id: number;
  content: string;
  title?: string | null;
  post_type?: string;
  image_url?: string | null;
  created_at: string;
  updated_at?: string;
  like_count: number;
  is_edited: boolean;
  is_deleted?: boolean;
  is_pinned?: boolean;
  visibility: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  liked_by_user: boolean;
  bookmarked_by_user?: boolean;
  attachments?: Attachment[];
  likes?: Like[];
  comments?: Comment[];
  tags?: string[];
  mentions?: string[];
  location?: string | null;
  metadata?: any;
  scheduled_at?: string | null;
  status?: string;
  comments_enabled?: boolean;
  view_count?: number;
  shared_product?: {
    id: string;
    title: string;
    price: number;
    images?: any;
    stock_quantity?: number;
    in_stock?: boolean;
    slug?: string;
    url: string;
  };
}

// -------------------- 🟢 FETCH POSTS --------------------

export const getUserPosts = async (userId: number, token: string): Promise<Post[]> => {
  const res = await fetch(`${API_URL}/api/posts/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user posts");
  return res.json();
};

export interface PostsResponse {
  posts: Post[];
  total: number;
  hasMore: boolean;
}

export const getAllPosts = async (
  token: string,
  limit: number = 20,
  offset: number = 0
): Promise<PostsResponse> => {
  const res = await fetch(`${API_URL}/api/posts?limit=${limit}&offset=${offset}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) throw new Error("Failed to fetch all posts");
  
  const data = await res.json();
  return data;
};

// Utility function to transform post data for PostCard compatibility
const transformPostData = (post: Post, currentUserId?: number): Post => {
  // Use backend-provided like_count if available, otherwise calculate from likes array
  const like_count = post.like_count !== undefined ? post.like_count : (post.likes ? post.likes.length : 0);
  
  // Check if current user liked the post
  const liked_by_user = post.likes ? 
    post.likes.some(like => like.user_id === currentUserId) : false;
  
  // Transform comments to add missing fields for compatibility
  const transformedComments = post.comments?.map(comment => ({
    ...comment,
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

export interface CreatePostParams {
  content: string;
  title?: string;
  post_type?: string;
  visibility?: "public" | "private" | "follows";
  tags?: string[];
  mentions?: string[];
  location?: string;
  metadata?: any;
  scheduled_at?: string;
  comments_enabled?: boolean;
  files?: File[];
  shared_product_id?: string;
}

export const createPost = async (
  token: string,
  params: CreatePostParams
): Promise<Post> => {
  const formData = new FormData();
  
  formData.append("content", params.content);
  if (params.title) formData.append("title", params.title);
  if (params.post_type) formData.append("post_type", params.post_type);
  formData.append("visibility", params.visibility || "public");
  if (params.tags) formData.append("tags", JSON.stringify(params.tags));
  if (params.mentions) formData.append("mentions", JSON.stringify(params.mentions));
  if (params.location) formData.append("location", params.location);
  if (params.metadata) formData.append("metadata", JSON.stringify(params.metadata));
  if (params.scheduled_at) formData.append("scheduled_at", params.scheduled_at);
  if (params.comments_enabled !== undefined) formData.append("comments_enabled", String(params.comments_enabled));
  if (params.shared_product_id) formData.append("shared_product_id", params.shared_product_id);

  if (params.files) {
    params.files.forEach((file) => formData.append("files", file));
  }

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

export interface UpdatePostParams {
  content?: string;
  title?: string;
  visibility?: "public" | "private" | "follows";
  post_type?: string;
  tags?: string[];
  mentions?: string[];
  location?: string;
  comments_enabled?: boolean;
  metadata?: any;
}

export const updatePost = async (
  token: string,
  postId: number,
  updates: UpdatePostParams
): Promise<Post> => {
  const res = await fetch(`${API_URL}/api/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
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

// -------------------- 📌 PIN/UNPIN POST --------------------

export const pinPost = async (token: string, postId: number): Promise<Post> => {
  const res = await fetch(`${API_URL}/api/posts/${postId}/pin`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to pin post");
  }
  return res.json();
};

export const unpinPost = async (token: string, postId: number): Promise<Post> => {
  const res = await fetch(`${API_URL}/api/posts/${postId}/unpin`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to unpin post");
  }
  return res.json();
};

export const getPinnedPost = async (userId: number, token: string): Promise<Post | null> => {
  const res = await fetch(`${API_URL}/api/posts/user/${userId}/pinned`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch pinned post");
  }
  return res.json();
};
