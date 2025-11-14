import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface XPToastProps {
  xp: number;
  action: string;
  levelUp?: boolean;
  newLevel?: number;
  visible: boolean;
}

const XPToast: React.FC<XPToastProps> = ({ xp, action, levelUp, newLevel, visible }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="relative"
        >
          {levelUp ? (
            // Level Up Toast
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-yellow-300 min-w-[300px]">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                  className="text-4xl"
                >
                  🎉
                </motion.div>
                <div className="flex-1">
                  <div className="font-bold text-lg">Level Up!</div>
                  <div className="text-sm opacity-90">
                    You reached Level {newLevel}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    +{xp} XP from {action}
                  </div>
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                  className="text-3xl font-bold"
                >
                  {newLevel}
                </motion.div>
              </div>
              
              {/* Sparkles */}
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                ✨
              </motion.div>
              <motion.div
                className="absolute -bottom-2 -left-2"
                animate={{
                  rotate: [360, 0],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.5,
                }}
              >
                ✨
              </motion.div>
            </div>
          ) : (
            // Regular XP Toast
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-3 rounded-lg shadow-xl border border-blue-300 min-w-[250px]">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.4 }}
                  className="text-2xl"
                >
                  ⭐
                </motion.div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">
                    {action}
                  </div>
                  <div className="text-xs opacity-80">
                    Earned XP
                  </div>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.5, 1] }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-2xl font-bold"
                >
                  +{xp}
                </motion.div>
              </div>
              
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default XPToast;
