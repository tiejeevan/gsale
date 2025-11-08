// src/services/userService.ts
export const API_URL = import.meta.env.VITE_API_URL;

// -------------------- 🟢 TYPES --------------------

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  [key: string]: string | undefined;
}

export interface User {
  id: number;
  username: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  bio?: string;
  about?: string;
  profile_image?: string;
  cover_image?: string;
  location?: string;
  website?: string;
  preferences?: Record<string, any>;
  social_links?: SocialLinks;
  phone?: string;
  role?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
  is_active?: boolean;
  follower_count?: number;
  following_count?: number;
}

// -------------------- 🟢 HELPER --------------------

const handleResponse = async <T>(res: Response): Promise<T> => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error: any = new Error(data?.message || "API request failed");
    error.status = res.status;
    error.statusText = res.statusText;
    throw error;
  }
  return data;
};

// -------------------- 🟢 USER SERVICE --------------------

export const userService = {
  // ---------------- PUBLIC PROFILE ----------------
  getPublicProfile: async (userId: number): Promise<User> => {
    const res = await fetch(`${API_URL}/api/users/${userId}`);
    const data = await handleResponse<{ user: User }>(res);
    return data.user;
  },

  // ---------------- CURRENT USER ----------------
  getMe: async (token: string): Promise<User> => {
    const res = await fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await handleResponse<{ user: User }>(res);
    return data.user;
  },

  // ---------------- UPDATE PROFILE ----------------
  updateProfile: async (token: string, updateData: Partial<User>): Promise<User> => {
    const res = await fetch(`${API_URL}/api/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
    const data = await handleResponse<{ user: User }>(res);
    return data.user;
  },

  // ---------------- CHANGE PASSWORD ----------------
  changePassword: async (
    token: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/api/users/me/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    return handleResponse<{ message: string }>(res);
  },

  // ---------------- DEACTIVATE ACCOUNT ----------------
  deactivateAccount: async (token: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/api/users/me/deactivate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<{ message: string }>(res);
  },
};
