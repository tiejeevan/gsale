// src/services/postService.ts
export const API_URL = import.meta.env.VITE_API_URL;

export interface Attachment {
  id: number;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  is_edited: boolean;
  is_deleted?: boolean;
  visibility?: string;
  username?: string;
  liked_by_user: boolean;
  attachments?: Attachment[];
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
