// Simple gesture timing helpers. The heavy lifting happens in CharacterScene.

export const GESTURE_DEFINITIONS = {
  wave: { duration: 1400 },
  thumbsUp: { duration: 1200 },
  thumbsDown: { duration: 1200 },
  bow: { duration: 1400 },
  jump: { duration: 900 },
  spin180: { duration: 900 },
  spin360: { duration: 1200 },
  dance: { duration: 1800 },
  shrug: { duration: 900 },
  facepalm: { duration: 1200 },
  point: { duration: 900 },
  think: { duration: 1500 },
  examine: { duration: 1500 },
  stretch: { duration: 1400 },
  celebrate: { duration: 1600 },
  sleep: { duration: 2000 },
  wakeUp: { duration: 1000 },
  coverEyes: { duration: 900 },
  uncoverEyes: { duration: 900 },
  nod: { duration: 800 },
  shake: { duration: 800 },
  peekLeft: { duration: 900 },
  scanRoom: { duration: 1600 },
};

export const getGestureInfo = (name) => {
  if (!name) return null;
  return GESTURE_DEFINITIONS[name] || { duration: 1000 };
};

