// Use the same environment variable for the API base URL
export const API_URL = import.meta.env.VITE_API_URL;

// Interface for the data payload sent to the API
export interface LikeApiData {
  target_type: string;
  target_id: number | string;
}

// Interface for the 'like' object returned by the backend on success
export interface Like {
  id: number;
  user_id: number;
  target_type: string;
  target_id: string;
  reaction_type: string;
  created_at: string;
  updated_at: string;
}

// -------------------- 🟢 ADD LIKE --------------------
/**
 * Sends a request to add a like to a target (e.g., a post or comment).
 * @param token - The user's JWT for authentication.
 * @param data - The details of the target to be liked.
 * @returns An object containing the new like record.
 */
export const addLike = async (
  token: string,
  data: LikeApiData
): Promise<{ success: boolean; like: Like }> => {
  const res = await fetch(`${API_URL}/api/likes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    // The body includes target_type and target_id, as required by your backend
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to add like");
  }

  return res.json();
};

// -------------------- 🔴 REMOVE LIKE --------------------
/**
 * Sends a request to remove a like from a target.
 * @param token - The user's JWT for authentication.
 * @param data - The details of the target to be un-liked.
 * @returns A success message.
 */
export const removeLike = async (
  token: string,
  data: LikeApiData
): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_URL}/api/likes`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    // Your backend's DELETE endpoint expects the identifiers in the body
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to remove like");
  }

  return res.json();
};