import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import gamificationService, { type UserGamification, type UserBadge } from '../services/gamificationService';
import { useUserContext } from './UserContext';
import toast from 'react-hot-toast';
import XPToast from '../components/gamification/XPToast';

interface GamificationContextType {
  profile: UserGamification | null;
  badges: UserBadge[];
  isEnabled: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshBadges: () => Promise<void>;
  showXPToast: (xp: number, action: string, levelUp?: boolean, newLevel?: number) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser: user } = useUserContext();
  const [profile, setProfile] = useState<UserGamification | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const data = await gamificationService.getMyProfile();
      setProfile(data);
      setIsEnabled(true);
    } catch (error: any) {
      // If gamification is disabled, silently fail
      if (error.response?.status === 404 || error.response?.data?.message?.includes('disabled')) {
        setIsEnabled(false);
      }
    }
  };

  const refreshBadges = async () => {
    if (!user || !isEnabled) return;
    
    try {
      const data = await gamificationService.getMyBadges();
      setBadges(data);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    }
  };

  const showXPToast = (xp: number, action: string, levelUp = false, newLevel?: number) => {
    toast.custom((t) => (
      <XPToast
        xp={xp}
        action={action}
        levelUp={levelUp}
        newLevel={newLevel}
        visible={t.visible}
      />
    ), {
      duration: 3000,
      position: 'top-right',
    });
  };

  useEffect(() => {
    const loadGamification = async () => {
      setIsLoading(true);
      await refreshProfile();
      await refreshBadges();
      setIsLoading(false);
    };

    if (user) {
      loadGamification();
    } else {
      setProfile(null);
      setBadges([]);
      setIsEnabled(false);
      setIsLoading(false);
    }
  }, [user]);

  return (
    <GamificationContext.Provider
      value={{
        profile,
        badges,
        isEnabled,
        isLoading,
        refreshProfile,
        refreshBadges,
        showXPToast,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
