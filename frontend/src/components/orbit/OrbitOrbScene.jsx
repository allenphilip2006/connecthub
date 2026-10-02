import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import OrbitRadialMenu from "./OrbitRadialMenu";
import OrbitActivityRing from "./OrbitActivityRing";
import OrbitAvatarRing from "./OrbitAvatarRing";

export default function OrbitOrbScene({
  participants = [],
  currentMood,
  roomActivity = 0,
  isWhiteboardActive = false,
  spotlightUserId = null,
  onOrbClick,
  orbState = "idle",
  recentEvents = [],
  onOptionSelect,
  onAvatarClick
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const sceneRef = useRef(null);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setRotation(prev => ({
      x: prev.x + e.movementY * 0.5,
      y: prev.y + e.movementX * 0.5
    }));
  };

  const baseState = useMemo(() => {
    if (spotlightUserId) return "spotlight";
    if (isWhiteboardActive) return "whiteboard";
    return orbState;
  }, [isWhiteboardActive, orbState, spotlightUserId]);

  const stateConfig = useMemo(() => {
    const cfg = {
      idle: {
        color: "from-purple-500/50 via-violet-400/45 to-indigo-500/55",
        glow: "0 0 65px rgba(147,51,234,0.55)",
        ringDuration: 14,
        orbScale: 1
      },
      typing: {
        color: "from-blue-400/60 via-indigo-400/55 to-purple-500/60",
        glow: "0 0 88px rgba(59,130,246,0.75)",
        ringDuration: 10,
        orbScale: 1.03
      },
      active: {
        color: "from-pink-500/60 via-fuchsia-500/55 to-violet-500/60",
        glow: "0 0 96px rgba(236,72,153,0.75)",
        ringDuration: 8,
        orbScale: 1.1
      },
      poll: {
        color: "from-amber-300/70 via-yellow-400/70 to-orange-500/70",
        glow: "0 0 95px rgba(251,191,36,0.8)",
        ringDuration: 7,
        orbScale: 1.06
      },
      ending: {
        color: "from-red-400/65 via-orange-500/65 to-red-600/70",
        glow: "0 0 95px rgba(249,115,22,0.8)",
        ringDuration: 16,
        orbScale: 1.02
      },
      whiteboard: {
        color: "from-teal-400/60 via-cyan-400/55 to-emerald-400/60",
        glow: "0 0 95px rgba(45,212,191,0.78)",
        ringDuration: 12,
        orbScale: 1.05
      },
      spotlight: {
        color: "from-yellow-300/70 via-amber-400/70 to-orange-500/65",
        glow: "0 0 105px rgba(251,191,36,0.9)",
        ringDuration: 12,
        orbScale: 1.07
      }
    };
    return cfg[baseState] || cfg.idle;
  }, [baseState]);

  const rotationDuration = useMemo(() => {
    const base = baseState === "active" ? 12 : baseState === "poll" ? 10 : baseState === "typing" ? 16 : 20;
    return isHovered ? base * 1.4 : base;
  }, [baseState, isHovered]);

  const spotlightAngle = useMemo(() => {
    if (!spotlightUserId || participants.length === 0) return 0;
    const idx = participants.findIndex((p, i) => `${p.id || p.email || i}` === `${spotlightUserId}`);
    if (idx < 0) return 0;
    return (idx / participants.length) * 360;
  }, [participants, spotlightUserId]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutside = (event) => {
      if (!sceneRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isMenuOpen]);

  const particleCount = Math.max(10, Math.min(30, 10 + Math.floor(roomActivity * 2)));

  return (
    <div
      className="relative w-full h-full flex items-center justify-center select-none overflow-hidden"
      style={{ perspective: "1200px" }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {/* Feature Info Display */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card px-6 py-3 rounded-2xl border-white/10 flex gap-4 items-center shadow-2xl pointer-events-auto"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Orbit Active</span>
            <div className="flex gap-2 mt-1">
              {["Poll", "Board", "Invite", "Share", "Timer"].map(f => (
                <span key={f} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10 mx-2" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Mood</span>
            <span className="text-xs font-black text-vibrant uppercase">{currentMood || "Chill"}</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        ref={sceneRef}
        animate={{
          scale: isHovered ? 1.05 : 1,
          rotateX: rotation.x,
          rotateY: rotation.y
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative w-[450px] h-[450px] flex items-center justify-center cursor-grab active:cursor-grabbing preserve-3d"
      >
        {/* Deep 3D Atmosphere Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)] rounded-full pointer-events-none" />

        {/* 3D Globe Grid - Multiple layers for real 3D effect */}
         <div className={`absolute w-[240px] h-[240px] rounded-full transition-opacity duration-500 ${isHovered ? 'opacity-60' : 'opacity-30'} border border-white/10 preserve-3d shadow-[0_0_100px_rgba(139,92,246,0.2)]`}>
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,rgba(255,255,255,0.05)_100%)] rounded-full" />
           
           {/* Latitude rings */}
           {[...Array(18)].map((_, i) => (
             <div 
               key={`lat-${i}`} 
               className="absolute w-full h-[0.5px] bg-white/20 top-1/2 -translate-y-1/2" 
               style={{ transform: `rotateX(${i * 10}deg) translateZ(0.1px)` }} 
             />
           ))}
           
           {/* Longitude rings */}
           {[...Array(18)].map((_, i) => (
             <div 
               key={`lng-${i}`} 
               className="absolute h-full w-[0.5px] bg-white/20 left-1/2 -translate-x-1/2" 
               style={{ transform: `rotateY(${i * 10}deg) translateZ(0.1px)` }} 
             />
           ))}

           {/* Cross rings for spherical volume */}
           {[...Array(12)].map((_, i) => (
             <div 
               key={`cross-${i}`} 
               className="absolute inset-0 border border-white/10 rounded-full" 
               style={{ transform: `rotateY(${i * 15}deg) rotateX(90deg)` }} 
             />
           ))}
         </div>

      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        @keyframes orbit-ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes beam-flicker {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.85; }
        }
        @keyframes whiteboard-link {
          0% { transform: scaleX(0.7); opacity: 0.35; }
          50% { transform: scaleX(1.1); opacity: 0.7; }
          100% { transform: scaleX(0.7); opacity: 0.35; }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none preserve-3d">
        {[...Array(particleCount)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`absolute rounded-full ${
              baseState === "poll"
                ? "bg-amber-300/60 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                : baseState === "whiteboard"
                  ? "bg-teal-300/55 shadow-[0_0_8px_rgba(45,212,191,0.5)]"
                  : "bg-violet-300/50 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
            }`}
            style={{
              width: `${3 + ((i * 7) % 5)}px`,
              height: `${3 + ((i * 7) % 5)}px`,
              left: `${(i * 13) % 100}%`,
              top: `${(i * 23) % 100}%`,
              transform: `translateZ(${50 + (i % 5) * 15}px)`
            }}
            animate={{
              y: [0, -25 - (i % 9) * 8, 0],
              x: [0, ((i % 2) - 0.5) * 32, 0],
              opacity: [0.1, 0.7, 0.1],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 4 + (i % 6),
              repeat: Infinity,
              delay: (i % 8) * 0.25
            }}
          />
        ))}
      </div>

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: stateConfig.ringDuration, repeat: Infinity, ease: "linear" }}
        className="absolute w-[380px] h-[380px] rounded-full border border-dashed border-white/20 preserve-3d"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: stateConfig.ringDuration + 8, repeat: Infinity, ease: "linear" }}
        className="absolute w-[320px] h-[320px] rounded-full border border-dashed border-white/15 preserve-3d"
      />

      {/* The Central 3D Globe Sphere */}
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          if (!isDragging) {
            setIsMenuOpen((prev) => !prev);
            onOrbClick?.();
          }
        }}
        animate={{
          scale: isHovered ? 1.05 : [1, stateConfig.orbScale, 1],
          rotateY: 360
        }}
        transition={{
          scale: isHovered
            ? { duration: 0.2 }
            : { duration: baseState === "ending" ? 3.5 : 2.8, repeat: Infinity, ease: "easeInOut" },
          rotateY: { duration: rotationDuration, repeat: Infinity, ease: "linear" }
        }}
        className={`relative w-[220px] h-[220px] rounded-full bg-gradient-to-br ${stateConfig.color} cursor-pointer flex items-center justify-center border border-white/30 preserve-3d shadow-[0_0_80px_rgba(0,0,0,0.6)]`}
        style={{ 
          boxShadow: `${stateConfig.glow}, inset 0 0 40px rgba(255,255,255,0.2)`,
          transform: "translateZ(30px)",
          animation: "float-gentle 6s ease-in-out infinite"
        }}
      >
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: baseState === "poll" ? 4 : 7, repeat: Infinity, ease: "linear" }}
          className="absolute w-[295px] h-[80px] rounded-full border border-white/40 bg-white/5"
          style={{ transform: "rotateX(75deg)" }}
        />
        <motion.div className="absolute inset-5 rounded-full bg-black/30 backdrop-blur-md border border-white/10" />
        {currentMood && (
          <div className="absolute top-[70%] left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/80 font-black drop-shadow-lg">
              {currentMood}
            </span>
            <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent mt-1" />
          </div>
        )}

        <AnimatePresence>
          {isHovered && !isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="absolute top-[-44px] text-[10px] font-black uppercase tracking-[0.2em] text-white bg-purple-600/90 border border-white/20 rounded-full px-4 py-1.5 shadow-2xl backdrop-blur-md"
            >
              Control Tools
            </motion.div>
          )}
        </AnimatePresence>

        {baseState === "typing" &&
          [...Array(4)].map((_, i) => (
            <div
              key={`ripple-${i}`}
              className="absolute w-[220px] h-[220px] rounded-full border border-blue-400/60"
              style={{
                animation: "orbit-ripple 1.2s ease-out infinite",
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
      </motion.div>

      {isWhiteboardActive && (
        <div
          className="absolute left-1/2 top-1/2 h-[3px] w-[280px] origin-left"
          style={{
            transform: "translateY(-50%) translateZ(15px)",
            background: "linear-gradient(90deg, rgba(45,212,191,0.95), transparent)",
            animation: "whiteboard-link 1.5s ease-in-out infinite"
          }}
        />
      )}

      {spotlightUserId && (
        <div
          className="absolute left-1/2 top-1/2 h-[2px] origin-left"
          style={{
            width: "190px",
            transform: `rotate(${spotlightAngle}deg) translateZ(35px)`,
            background: "linear-gradient(90deg, rgba(251,191,36,0.9), transparent)",
            animation: "beam-flicker 0.6s ease-in-out infinite",
            boxShadow: "0 0 15px rgba(251,191,36,0.4)"
          }}
        />
      )}
      </motion.div>

      <div className="absolute w-full h-full preserve-3d pointer-events-none" style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}>
        <OrbitActivityRing events={recentEvents} />
        <OrbitAvatarRing participants={participants} spotlightUserId={spotlightUserId} onAvatarClick={onAvatarClick} />
      </div>

      <OrbitRadialMenu
        isOpen={isMenuOpen}
        position={{ x: 0, y: 0 }}
        onOptionSelect={(optionId) => {
          onOptionSelect?.(optionId);
          setIsMenuOpen(false);
        }}
      />

      {/* 3D Interactivity Tooltip */}
      <AnimatePresence>
        {isHovered && !isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-10 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest pointer-events-none z-[110]"
          >
            Click center for tools · Drag to rotate
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
