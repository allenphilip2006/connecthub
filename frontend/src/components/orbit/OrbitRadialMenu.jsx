import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart2, 
  Layout, 
  UserPlus, 
  Share2, 
  Timer, 
  Music, 
  X,
  MessageSquare,
  Trophy
} from 'lucide-react';

const OrbitRadialMenu = ({ onSelect, onClose }) => {
  const items = [
    { id: 'poll', icon: <BarChart2 size={18} />, label: 'Poll', color: 'bg-amber-500' },
    { id: 'board', icon: <Layout size={18} />, label: 'Board', color: 'bg-teal-500' },
    { id: 'invite', icon: <UserPlus size={18} />, label: 'Invite', color: 'bg-blue-500' },
    { id: 'share', icon: <Share2 size={18} />, label: 'Share', color: 'bg-indigo-500' },
    { id: 'timer', icon: <Timer size={18} />, label: 'Timer', color: 'bg-purple-500' },
    { id: 'challenge', icon: <Trophy size={18} />, label: 'Goal', color: 'bg-yellow-500' },
    { id: 'mood', icon: <MessageSquare size={18} />, label: 'Mood', color: 'bg-rose-500' },
  ];

  const radius = 160;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none"
    >
      <div className="relative w-[320px] h-[320px] flex items-center justify-center pointer-events-auto">
        {/* Central Close Button */}
        <button 
          onClick={onClose}
          className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl z-10 hover:scale-110 transition active:scale-95"
        >
          <X size={24} />
        </button>

        {/* Radial Buttons */}
        {items.map((item, index) => {
          const angle = (index / items.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={item.id}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x, y, opacity: 1 }}
              transition={{ delay: index * 0.05, type: 'spring', damping: 15 }}
              className="absolute"
            >
              <button
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className={`group relative flex flex-col items-center gap-2`}
              >
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center shadow-lg transition-transform hover:scale-115 active:scale-90 border border-white/20`}>
                  {item.icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default OrbitRadialMenu;
