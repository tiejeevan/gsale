const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'muted' | 'deactivated' | 'suspended';
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: number;
  muted_at?: string;
  muted_by?: number;
  muted_reason?: string;
  suspended_at?: string;
  suspended_by?: number;
  suspended_reason?: string;
  deactivated_at?: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  muted_users: number;
  suspended_users: number;
  deactivated_users: number;
  deleted_users: number;
  admin_count: number;
  recent_signups: number;
  recent_admin_actions: number;
}

export interface AdminAction {
  id: number;
  admin_id: number;
  admin_username: string;
  target_user_id: number;
  target_username: string;
  action_type: string;
  reason?: string;
  metadata?: any;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class AdminService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}/api/admin${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers, // This should come after to override defaults
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  // Get dashboard stats
  async getStats(token: string): Promise<AdminStats> {
    console.log('Admin getStats - token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    return this.request('/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Get all users with filters
  async getUsers(
    token: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      role?: string;
      includeDeleted?: boolean;
    } = {}
  ): Promise<{ users: AdminUser[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.role) queryParams.append('role', params.role);
    if (params.includeDeleted) queryParams.append('includeDeleted', 'true');

    return this.request(`/users?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Get user details
  async getUserDetails(token: string, userId: number): Promise<any> {
    return this.request(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Update user
  async updateUser(
    token: string,
    userId: number,
    data: Partial<AdminUser> & { password?: string }
  ): Promise<{ message: string; user: AdminUser }> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  // Mute user
  async muteUser(token: string, userId: number, reason: string): Promise<any> {
    return this.request(`/users/${userId}/mute`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
  }

  // Unmute user
  async unmuteUser(token: string, userId: number): Promise<any> {
    return this.request(`/users/${userId}/unmute`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Suspend user
  async suspendUser(token: string, userId: number, reason: string): Promise<any> {
    return this.request(`/users/${userId}/suspend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
  }

  // Unsuspend user
  async unsuspendUser(token: string, userId: number): Promise<any> {
    return this.request(`/users/${userId}/unsuspend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Soft delete user
  async softDeleteUser(token: string, userId: number, reason: string): Promise<any> {
    return this.request(`/users/${userId}/soft`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
  }

  // Restore user
  async restoreUser(token: string, userId: number): Promise<any> {
    return this.request(`/users/${userId}/restore`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Permanently delete user
  async permanentDeleteUser(token: string, userId: number, reason: string): Promise<any> {
    return this.request(`/users/${userId}/permanent`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
  }

  // Get admin logs
  async getLogs(
    token: string,
    params: {
      page?: number;
      limit?: number;
      adminId?: number;
      targetUserId?: number;
      actionType?: string;
    } = {}
  ): Promise<{ logs: AdminAction[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.adminId) queryParams.append('adminId', params.adminId.toString());
    if (params.targetUserId) queryParams.append('targetUserId', params.targetUserId.toString());
    if (params.actionType) queryParams.append('actionType', params.actionType);

    return this.request(`/logs?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export const adminService = new AdminService();
