import React from 'react';
import { useGamification } from '../../context/GamificationContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const XPWidget: React.FC = () => {
  const { profile, badges, isEnabled, isLoading } = useGamification();

  if (!isEnabled || isLoading || !profile) return null;

  const xpInCurrentLevel = profile.total_xp - (Math.pow(profile.current_level - 1, 2) * 100);
  const xpForNextLevel = Math.pow(profile.current_level, 2) * 100;
  const progress = (xpInCurrentLevel / xpForNextLevel) * 100;

  return (
    <Link to="/gamification/profile">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg px-3 py-2 shadow-lg cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {/* Level Badge */}
          <div className="bg-white bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
            {profile.current_level}
          </div>
          
          {/* XP Info */}
          <div className="flex-1 min-w-[100px]">
            <div className="text-xs opacity-90">Level {profile.current_level}</div>
            <div className="bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-white h-full rounded-full"
              />
            </div>
          </div>

          {/* Badge Count */}
          {badges.length > 0 && (
            <div className="text-lg">
              🏆
              <span className="text-xs ml-1">{badges.length}</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

export default XPWidget;
