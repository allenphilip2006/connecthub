import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SPRITE_BASE = "/companion";
const sprites = {
  neutral: `${SPRITE_BASE}/neutral.png`,
  happy: `${SPRITE_BASE}/happy.png`,
  excited: `${SPRITE_BASE}/excited.png`,
  celebrating: `${SPRITE_BASE}/celebrating.png`,
  sad: `${SPRITE_BASE}/sad.png`,
  shocked: `${SPRITE_BASE}/shocked.png`,
  thinking: `${SPRITE_BASE}/thinking.png`,
  curious: `${SPRITE_BASE}/curious.png`,
  waving: `${SPRITE_BASE}/waving.png`,
  thumbsup: `${SPRITE_BASE}/thumbsup.png`,
  sleepy: `${SPRITE_BASE}/sleepy.png`,
  error: `${SPRITE_BASE}/error.png`,
  coveringeyes: `${SPRITE_BASE}/coveringeyes.png`,
};

const HALO_COLORS = {
  neutral: "rgba(124,58,237,0.25)",
  happy: "rgba(236,72,153,0.35)",
  excited: "rgba(251,191,36,0.4)",
  celebrating: "rgba(251,191,36,0.5)",
  sad: "rgba(59,130,246,0.3)",
  shocked: "rgba(239,68,68,0.3)",
  thinking: "rgba(139,92,246,0.3)",
  curious: "rgba(52,211,153,0.3)",
  waving: "rgba(236,72,153,0.3)",
  thumbsup: "rgba(52,211,153,0.35)",
  sleepy: "rgba(99,102,241,0.2)",
  error: "rgba(239,68,68,0.4)",
  coveringeyes: "rgba(139,92,246,0.3)",
};

const CharacterSprite = ({ emotion, isMinimized }) => {
  const displayEmotion = emotion && sprites[emotion] ? emotion : "neutral";
  const src = sprites[displayEmotion] || sprites.neutral;

  const animationClass = useMemo(() => {
    if (["happy", "excited"].includes(displayEmotion)) return "emotion-float";
    if (displayEmotion === "error") return "emotion-shake";
    if (displayEmotion === "celebrating") return "emotion-bounce";
    if (["thinking", "thumbsup"].includes(displayEmotion)) return "emotion-nod";
    if (displayEmotion === "sleepy") return "emotion-sway";
    return "emotion-breathe";
  }, [displayEmotion]);

  const haloColor = HALO_COLORS[displayEmotion] || HALO_COLORS.neutral;

  if (isMinimized) return null;

  return (
    <div className="companion-sprite-wrapper">
      <div
        className="companion-halo"
        style={{ backgroundColor: haloColor }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={displayEmotion}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: "spring", stiffness: 380, damping: 22 },
          }}
          exit={{ opacity: 0, scale: 0.85, y: 8, transition: { duration: 0.12 } }}
        >
          <img
            src={src}
            alt=""
            className={`companion-sprite-img ${animationClass}`}
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CharacterSprite;
