export const CHARACTER_EMOTIONS = {
  neutral: {
    bodyTilt: 0,
    headTilt: 0,
    eyeOpen: 1,
    glow: 0.6,
  },
  happy: {
    bodyTilt: 0.08,
    headTilt: 0.12,
    eyeOpen: 1,
    glow: 1.0,
  },
  excited: {
    bodyTilt: 0.18,
    headTilt: 0.2,
    eyeOpen: 1,
    glow: 1.3,
  },
  surprised: {
    bodyTilt: 0.05,
    headTilt: -0.1,
    eyeOpen: 1.3,
    glow: 1.1,
  },
  sad: {
    bodyTilt: -0.15,
    headTilt: -0.12,
    eyeOpen: 0.7,
    glow: 0.4,
  },
  focused: {
    bodyTilt: 0.02,
    headTilt: 0.1,
    eyeOpen: 0.9,
    glow: 0.8,
  },
  proud: {
    bodyTilt: 0.22,
    headTilt: 0.05,
    eyeOpen: 1,
    glow: 1.2,
  },
  sleep: {
    bodyTilt: -0.25,
    headTilt: -0.25,
    eyeOpen: 0.1,
    glow: 0.2,
  },
  idle: {
    bodyTilt: 0.03,
    headTilt: 0.04,
    eyeOpen: 1,
    glow: 0.7,
  },
};

export const getEmotionConfig = (name) => {
  if (!name) return CHARACTER_EMOTIONS.neutral;
  return CHARACTER_EMOTIONS[name] || CHARACTER_EMOTIONS.neutral;
};

