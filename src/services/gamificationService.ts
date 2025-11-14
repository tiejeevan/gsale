const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export interface UserGamification {
  id: string;
  user_id: number;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  reputation_score: number;
  reputation_level: string;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: any;
  is_active: boolean;
  created_at: string;
}

export interface UserBadge {
  id: string;
  badge: Badge;
  earned_at: string;
  progress?: number;
}

export interface XPTransaction {
  id: string;
  user_id: number;
  action_type: string;
  xp_amount: number;
  multiplier: number;
  created_at: string;
  metadata?: any;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  profile_picture?: string;
  score: number;
  level?: number;
  badge_count?: number;
}

export interface XPRule {
  id: string;
  action_type: string;
  xp_amount: number;
  description: string;
  daily_limit: number | null;
  weekly_limit: number | null;
  is_active: boolean;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  xp_multiplier: number;
  is_active: boolean;
  event_type: string;
}

export interface GamificationSettings {
  gamification_enabled: boolean;
  gamification_xp_enabled: boolean;
  gamification_badges_enabled: boolean;
  gamification_leaderboards_enabled: boolean;
  gamification_reputation_enabled: boolean;
  gamification_seasonal_events_enabled: boolean;
  gamification_xp_multiplier: number;
}

export interface SystemStats {
  total_users: number;
  total_xp_awarded: number;
  total_badges_awarded: number;
  average_level: number;
  top_users: Array<{
    username: string;
    level: number;
    total_xp: number;
  }>;
  most_awarded_badges: Array<{
    badge_name: string;
    count: number;
  }>;
}

class GamificationService {
  // User endpoints
  async getMyProfile(): Promise<UserGamification> {
    const response = await fetch(`${API_URL}/api/gamification/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  }

  async getUserProfile(userId: number): Promise<UserGamification> {
    const response = await fetch(`${API_URL}/api/gamification/profile/${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  }

  async getXPHistory(limit = 20): Promise<XPTransaction[]> {
    const response = await fetch(`${API_URL}/api/gamification/xp/history?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch XP history');
    return response.json();
  }

  async getXPBreakdown(): Promise<any> {
    const response = await fetch(`${API_URL}/api/gamification/xp/breakdown`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch XP breakdown');
    return response.json();
  }

  async getAllBadges(): Promise<Badge[]> {
    const response = await fetch(`${API_URL}/api/gamification/badges`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch badges');
    return response.json();
  }

  async getMyBadges(): Promise<UserBadge[]> {
    const response = await fetch(`${API_URL}/api/gamification/badges/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch badges');
    return response.json();
  }

  async getBadgeProgress(badgeId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/gamification/badges/${badgeId}/progress`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch badge progress');
    return response.json();
  }

  async getLeaderboard(type: string, limit = 50): Promise<LeaderboardEntry[]> {
    const response = await fetch(`${API_URL}/api/gamification/leaderboards?type=${type}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  }

  async getLeaderboardTypes(): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/gamification/leaderboards/types`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch leaderboard types');
    return response.json();
  }

  async getMyRank(type: string): Promise<{ rank: number; total: number }> {
    const response = await fetch(`${API_URL}/api/gamification/leaderboards/${type}/my-rank`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch rank');
    return response.json();
  }

  async getReputation(): Promise<any> {
    const response = await fetch(`${API_URL}/api/gamification/reputation`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch reputation');
    return response.json();
  }

  async getActiveEvents(): Promise<SeasonalEvent[]> {
    const response = await fetch(`${API_URL}/api/gamification/events`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  }

  async claimDailyBonus(): Promise<{ xp_earned: number; streak_days: number }> {
    const response = await fetch(`${API_URL}/api/gamification/claim-daily-bonus`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to claim bonus');
    return response.json();
  }

  // Admin endpoints
  async getSettings(): Promise<GamificationSettings> {
    const response = await fetch(`${API_URL}/api/admin/gamification/settings`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  }

  async updateSetting(key: string, value: any): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/gamification/settings/${key}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ value }),
    });
    if (!response.ok) throw new Error('Failed to update setting');
  }

  async getXPRules(): Promise<XPRule[]> {
    const response = await fetch(`${API_URL}/api/admin/gamification/xp-rules`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch XP rules');
    return response.json();
  }

  async updateXPRule(id: string, data: Partial<XPRule>): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/gamification/xp-rules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update XP rule');
  }

  async getAdminBadges(): Promise<Badge[]> {
    const response = await fetch(`${API_URL}/api/admin/gamification/badges`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch badges');
    return response.json();
  }

  async createBadge(data: Partial<Badge>): Promise<Badge> {
    const response = await fetch(`${API_URL}/api/admin/gamification/badges`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create badge');
    return response.json();
  }

  async updateBadge(id: string, data: Partial<Badge>): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/gamification/badges/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update badge');
  }

  async deleteBadge(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/gamification/badges/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete badge');
  }

  async getAdminEvents(): Promise<SeasonalEvent[]> {
    const response = await fetch(`${API_URL}/api/admin/gamification/events`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  }

  async createEvent(data: Partial<SeasonalEvent>): Promise<SeasonalEvent> {
    const response = await fetch(`${API_URL}/api/admin/gamification/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create event');
    return response.json();
  }

  async updateEvent(id: string, data: Partial<SeasonalEvent>): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/gamification/events/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update event');
  }

  async deleteEvent(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/gamification/events/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete event');
  }

  async manualXPAdjustment(userId: number, amount: number, reason: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/gamification/manual-xp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, amount, reason }),
    });
    if (!response.ok) throw new Error('Failed to adjust XP');
  }

  async forceUpdateLeaderboards(): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/gamification/leaderboards/update`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to update leaderboards');
  }

  async getSystemStats(): Promise<SystemStats> {
    const response = await fetch(`${API_URL}/api/admin/gamification/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }

  async getAdminLogs(limit = 50): Promise<any[]> {
    const response = await fetch(`${API_URL}/api/admin/gamification/logs?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch logs');
    return response.json();
  }
}

export default new GamificationService();
