import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OrbitAvatarRing = memo(({ participants = [], spotlightUserId, onAvatarClick }) => {
  const radius = 220; // Slightly larger for the new orb scene

  // Use dynamic CSS for animations to avoid setState in RAF as requested
  const animationStyles = useMemo(() => {
    const total = participants.length;
    return participants.map((_, i) => {
      const startAngle = (i / total) * 360;
      return `
        @keyframes orbit-${i} {
          0% { transform: rotateY(${startAngle}deg) translateZ(${radius}px) rotateY(${-startAngle}deg); z-index: 10; opacity: 1; }
          25% { transform: rotateY(${startAngle + 90}deg) translateZ(${radius}px) rotateY(${-startAngle - 90}deg); z-index: 5; opacity: 0.7; }
          50% { transform: rotateY(${startAngle + 180}deg) translateZ(${radius}px) rotateY(${-startAngle - 180}deg); z-index: 1; opacity: 0.3; }
          75% { transform: rotateY(${startAngle + 270}deg) translateZ(${radius}px) rotateY(${-startAngle - 270}deg); z-index: 5; opacity: 0.7; }
          100% { transform: rotateY(${startAngle + 360}deg) translateZ(${radius}px) rotateY(${-startAngle - 360}deg); z-index: 10; opacity: 1; }
        }
      `;
    }).join('\n');
  }, [participants.length]);

  return (
    <div className="absolute inset-0 preserve-3d pointer-events-none flex items-center justify-center">
      <style>{animationStyles}</style>
      <AnimatePresence>
        {participants.map((participant, i) => (
          <motion.div
            key={participant.id || participant.email || i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute pointer-events-auto"
            style={{
              animation: `orbit-${i} 20s linear infinite`,
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group">
              {/* Planetary Orb Base */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                {/* The "Planet" */}
                <div className="absolute inset-0 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] border border-cyan-300/50" />
                
                {/* Planet Ring */}
                <div className="absolute w-[140%] h-[30%] border border-white/30 rounded-full rotate-[25deg]" />
                
                {/* Avatar on Top */}
                <button
                  onClick={() => onAvatarClick?.(participant)}
                  className={`relative w-8 h-8 rounded-full border-2 overflow-hidden bg-zinc-900 shadow-xl transition-all group-hover:scale-110 active:scale-90 z-10 ${
                    spotlightUserId === (participant.id || participant.email)
                      ? "border-yellow-400 shadow-yellow-400/80 ring-4 ring-yellow-400/20"
                      : "border-white/40 hover:border-white"
                  }`}
                >
                  <img
                    src={participant.avatar ? `http://localhost:62223${participant.avatar}` : "/placeholder-avatar.svg"}
                    className="w-full h-full object-cover"
                    alt={participant.username}
                  />
                </button>
              </div>

              {/* Username Badge */}
              <div className="mt-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-[0.15em] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {participant.username || "Orbit"}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

export default OrbitAvatarRing;
