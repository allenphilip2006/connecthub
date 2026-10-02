import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PARTICLE_CONFIG = {
  happy: { type: "hearts", count: 5 },
  excited: { type: "sparkles", count: 6 },
  celebrating: { type: "sparkles", count: 6 },
  sad: { type: "tears", count: 2 },
  sleepy: { type: "zzz", count: 3 },
  shocked: { type: "exclamation", count: 2 },
  error: { type: "exclamation", count: 2 },
};

const ParticleEffect = ({ emotion }) => {
  const [particles, setParticles] = useState([]);
  const prevEmotionRef = useRef(null);
  const idRef = useRef(0);

  useEffect(() => {
    const config = PARTICLE_CONFIG[emotion];
    if (!config || emotion === prevEmotionRef.current) return;
    prevEmotionRef.current = emotion;

    const newParticles = [];
    const count = Math.min(config.count, 10);
    const baseId = idRef.current;

    for (let i = 0; i < count; i++) {
      const id = `${baseId}-${i}`;
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 30 + Math.random() * 40;
      const endX = Math.cos(angle) * dist;
      const endY = -Math.sin(angle) * dist - 20;

      if (config.type === "hearts") {
        newParticles.push({
          id,
          type: "heart",
          content: Math.random() > 0.5 ? "❤️" : "💕",
          endX: (Math.random() - 0.5) * 40,
          endY: -50 - Math.random() * 20,
          duration: 900 + Math.random() * 200,
        });
      } else if (config.type === "sparkles") {
        newParticles.push({
          id,
          type: "sparkle",
          content: Math.random() > 0.5 ? "✦" : "⭐",
          endX,
          endY,
          duration: 700,
        });
      } else if (config.type === "tears") {
        newParticles.push({
          id,
          type: "tear",
          content: "💧",
          endX: (Math.random() - 0.5) * 20,
          endY: 30,
          duration: 1200,
        });
      } else if (config.type === "zzz") {
        newParticles.push({
          id,
          type: "zzz",
          content: ["z", "z", "Z"][i % 3],
          endX: 15 + i * 8,
          endY: -40 - i * 10,
          duration: 2000,
          delay: i * 500,
        });
      } else if (config.type === "exclamation") {
        newParticles.push({
          id,
          type: "exclamation",
          content: "!",
          endX: (i === 0 ? -1 : 1) * 25,
          endY: -15,
          duration: 600,
        });
      }
    }

    if (emotion === "celebrating") {
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10 + Math.random();
        const dist = 40 + Math.random() * 40;
        newParticles.push({
          id: `confetti-${baseId}-${i}`,
          type: "confetti",
          color: ["#ec4899", "#7c3aed", "#fbbf24", "#3b82f6"][i % 4],
          endX: Math.cos(angle) * dist,
          endY: -Math.sin(angle) * dist,
          duration: 1000,
        });
      }
    }

    idRef.current += count + 10;
    queueMicrotask(() => setParticles(newParticles));
  }, [emotion]);

  const removeParticle = (id) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="companion-particle-container" style={{ position: "absolute", bottom: "50%", left: "50%", pointerEvents: "none", zIndex: 10000 }}>
      <AnimatePresence>
        {particles.map((p) => {
          if (p.type === "confetti") {
            return (
              <motion.div
                key={p.id}
                className="particle"
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: 0,
                  x: p.endX,
                  y: p.endY,
                  scale: 0,
                  rotate: 360,
                }}
                transition={{ duration: p.duration / 1000, ease: "easeOut" }}
                onAnimationComplete={() => removeParticle(p.id)}
                style={{
                  position: "absolute",
                  width: 6,
                  height: 6,
                  left: 0,
                  top: 0,
                  backgroundColor: p.color,
                  borderRadius: 1,
                }}
              />
            );
          }
          if (p.type === "heart") {
            return (
              <motion.div
                key={p.id}
                className="particle"
                initial={{ opacity: 1, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  x: p.endX,
                  y: p.endY,
                }}
                transition={{ duration: p.duration / 1000, ease: "easeOut" }}
                onAnimationComplete={() => removeParticle(p.id)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  fontSize: 14,
                }}
              >
                {p.content}
              </motion.div>
            );
          }
          if (p.type === "sparkle") {
            return (
              <motion.div
                key={p.id}
                className="particle"
                initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                animate={{
                  opacity: 0,
                  x: p.endX,
                  y: p.endY,
                  scale: 0,
                  rotate: 360,
                }}
                transition={{ duration: p.duration / 1000, ease: "easeOut" }}
                onAnimationComplete={() => removeParticle(p.id)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  fontSize: 12,
                  color: "#fbbf24",
                }}
              >
                {p.content}
              </motion.div>
            );
          }
          if (p.type === "tear") {
            return (
              <motion.div
                key={p.id}
                className="particle"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: 30 }}
                transition={{ duration: p.duration / 1000, ease: "easeOut" }}
                onAnimationComplete={() => removeParticle(p.id)}
                style={{
                  position: "absolute",
                  left: p.endX,
                  top: -20,
                  fontSize: 10,
                }}
              >
                {p.content}
              </motion.div>
            );
          }
          if (p.type === "zzz") {
            return (
              <motion.div
                key={p.id}
                className="particle"
                initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                animate={{
                  opacity: 0,
                  x: p.endX,
                  y: p.endY,
                  rotate: 15,
                }}
                transition={{
                  duration: p.duration / 1000,
                  delay: (p.delay || 0) / 1000,
                  ease: "easeOut",
                }}
                onAnimationComplete={() => removeParticle(p.id)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  fontSize: 10,
                  color: "#9ca3af",
                  fontStyle: "italic",
                }}
              >
                {p.content}
              </motion.div>
            );
          }
          if (p.type === "exclamation") {
            return (
              <motion.div
                key={p.id}
                className="particle"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1.5,
                  x: p.endX,
                  y: p.endY,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: p.duration / 1000 }}
                onAnimationComplete={() => removeParticle(p.id)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#ef4444",
                }}
              >
                {p.content}
              </motion.div>
            );
          }
          return null;
        })}
      </AnimatePresence>
    </div>
  );
};

export default ParticleEffect;
