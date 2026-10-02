import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import companionDialogues from '../data/companionDialogues';

const CharacterContext = createContext(null);

const playFeedbackSound = (type = 'pop') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'notification') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    console.warn("Audio feedback failed:", e);
  }
};

const EMOTION_PRIORITY = {
  coveringeyes: 5,
  celebrating: 4,
  shocked: 4,
  error: 4,
  happy: 3,
  sad: 3,
  excited: 3,
  curious: 2,
  thinking: 2,
  waving: 2,
  thumbsup: 2,
  neutral: 0
};

// Throttle utility
const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function(...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

export const CharacterProvider = ({ children }) => {
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [bubble, setBubble] = useState(null);
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem('ch_companion_minimized') === 'true';
  });

  const lastBubbleTime = useRef(0);
  const lastBubbleText = useRef("");
  const emotionTimeoutRef = useRef(null);
  const bubbleTimeoutRef = useRef(null);
  const currentEmotionRef = useRef('neutral');
  const lastEmotionChangeRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const charCountRef = useRef(0);
  const lastBackspaceTimeRef = useRef(0);
  const backspaceCountRef = useRef(0);
  const passwordFocusedRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const isSleepingRef = useRef(false);

  // Clear a specific bubble
  const clearBubble = useCallback(() => {
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    setBubble(null);
  }, []);

  // Define showBubble FIRST so others can use it
  const showBubble = useCallback((text, durationMs = 4000) => {
    const now = Date.now();
    const activeElement = document.activeElement;
    const isTyping = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.isContentEditable
    );

    const isPassword = activeElement && activeElement.type === 'password';
    
    // Block normal bubbles while typing, but allow password one
    if (isTyping && charCountRef.current > 10 && !isPassword) return;

    // If password is focused and we're NOT showing the password bubble, block it
    if (passwordFocusedRef.current && text && !text.includes("looking")) {
      return;
    }

    // SLOW DOWN: Balanced gap for readability and liveliness
    const gap = (text === lastBubbleText.current && !isPassword) ? 3000 : 1500;
    
    if (now - lastBubbleTime.current < gap && !isPassword && text !== null) return;

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);

    setBubble(text);
    if (text) {
      lastBubbleText.current = text;
      lastBubbleTime.current = now;
    }

    if (durationMs !== Infinity && text !== null) {
      bubbleTimeoutRef.current = setTimeout(() => {
        setBubble(null);
      }, durationMs);
    }
  }, []);

  // Define triggerReaction SECOND
  const triggerReaction = useCallback((type) => {
    // Map internal types to library categories
    const categoryMap = {
      like: 'FEED_LIKE',
      unlike: 'FEED_UNLIKE',
      comment: 'FEED_COMMENT',
      post: 'CREATE_POST_SHARED',
      delete: 'HOVER_DELETE',
      error: 'LOGIN_ERROR',
      welcome: 'LOGIN_SUCCESS',
      orbit: 'ORBIT_ENTER',
      typing: 'CHAT_TYPING',
      sent: 'CHAT_MESSAGE_SENT',
      hover_logout: 'LOGOUT_HOVER',
      story: 'STORY_SHARED'
    };

    const category = categoryMap[type] || 'IDLE_30S';
    const pool = companionDialogues[category] || ["Hmm... 🤔"];
    const text = pool[Math.floor(Math.random() * pool.length)];
    
    const emotions = {
      like: ['happy', 'excited', 'thumbsup'],
      unlike: ['sad', 'curious'],
      comment: ['thinking', 'curious', 'happy'],
      post: ['excited', 'celebrating', 'waving'],
      delete: ['shocked', 'sad'],
      error: ['error', 'sad'],
      welcome: ['waving', 'happy', 'excited'],
      orbit: ['excited', 'curious', 'happy'],
      typing: ['thinking', 'curious'],
      sent: ['thumbsup', 'happy'],
      hover_logout: ['sad'],
      story: ['celebrating', 'excited']
    };
    const emotionPool = emotions[type] || ['neutral'];
    const emotion = emotionPool[Math.floor(Math.random() * emotionPool.length)];
    
    setCurrentEmotion(emotion);
    currentEmotionRef.current = emotion;
    showBubble(text, 3500);
  }, [showBubble]);

  // Define setEmotion THIRD
  const setEmotion = useCallback((newEmotion, durationMs) => {
    const now = Date.now();
    const current = currentEmotionRef.current;
    
    if (passwordFocusedRef.current && newEmotion !== 'coveringeyes' && newEmotion !== 'neutral') {
      return;
    }

    const currentPriority = EMOTION_PRIORITY[current] || 0;
    const newPriority = EMOTION_PRIORITY[newEmotion] || 0;

    if (currentPriority > newPriority && newEmotion !== 'neutral') {
      return;
    }

    if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current);
    
    setCurrentEmotion(newEmotion);
    currentEmotionRef.current = newEmotion;
    lastEmotionChangeRef.current = now;

    // Trigger a relevant dialogue for significant emotion changes if no bubble is active
    if (!bubble && newEmotion !== 'neutral') {
      const typeMap = {
        happy: 'like',
        excited: 'welcome',
        celebrating: 'post',
        shocked: 'delete',
        error: 'error',
        sad: 'unlike',
        thinking: 'typing',
        curious: 'orbit'
      };
      if (typeMap[newEmotion]) {
        triggerReaction(typeMap[newEmotion]);
      }
    }

    if (durationMs && durationMs !== Infinity) {
      emotionTimeoutRef.current = setTimeout(() => {
        if (currentEmotionRef.current === newEmotion) {
          if (passwordFocusedRef.current) {
            setCurrentEmotion('coveringeyes');
            currentEmotionRef.current = 'coveringeyes';
          } else {
            setCurrentEmotion('neutral');
            currentEmotionRef.current = 'neutral';
          }
        }
      }, durationMs);
    }
  }, [bubble, triggerReaction]);

  const minimize = useCallback(() => {
    setIsMinimized(true);
    localStorage.setItem('ch_companion_minimized', 'true');
    setEmotion('sad', 2000);
    showBubble("Fine I'll be quiet... 😔", 2000);
  }, [setEmotion, showBubble]);

  const expand = useCallback(() => {
    setIsMinimized(false);
    localStorage.setItem('ch_companion_minimized', 'false');
    setEmotion('waving', 2000);
    showBubble('You called? 👋', 2000);
  }, [setEmotion, showBubble]);

  // Global Input/Focus Detection
  useEffect(() => {
    const handleFocus = (e) => {
      lastActivityRef.current = Date.now();
      if (e.target.type === 'password') {
        passwordFocusedRef.current = true;
        setEmotion('coveringeyes');
        showBubble("I'm not looking! 🙈 Pinky promise! 💖", Infinity);
      }
    };

    const handleBlur = (e) => {
      lastActivityRef.current = Date.now();
      if (e.target.type === 'password') {
        passwordFocusedRef.current = false;
        clearBubble();
        setEmotion('neutral', 1000);
      }
    };

    const checkKeywords = (text) => {
      if (text.includes("sad") || text.includes("cry") || text.includes("sorry") || text.includes("bad")) {
        setEmotion('sad', 2000);
      } else if (text.includes("shock") || text.includes("wow") || text.includes("omg") || text.includes("!") || text.includes("wtf")) {
        setEmotion('shocked', 2000);
      } else if (text.includes("love") || text.includes("happy") || text.includes("yay") || text.includes("good")) {
        setEmotion('happy', 2000);
      } else if (text.includes("?") || text.includes("what") || text.includes("how") || text.includes("why")) {
        setEmotion('curious', 2000);
      } else if (text.includes("angry") || text.includes("hate") || text.includes("stupid") || text.includes("dumb") || text.includes("stop")) {
        setEmotion('angry', 2000);
        if (Math.random() < 0.3) showBubble("That's mean! 😤", 1500);
      } else if (text.includes("companion") || text.includes("you") || text.includes("girl") || text.includes("hey")) {
        setEmotion('waving', 2000);
        if (Math.random() < 0.3) showBubble("You're talking about me? 😊", 1500);
      }
    };

    const handleKeyDown = (e) => {
      lastActivityRef.current = Date.now();
      const active = document.activeElement;
      const isTypingField = active && (
        active.tagName === 'INPUT' || 
        active.tagName === 'TEXTAREA' || 
        active.contentEditable === 'true'
      );
      if (!isTypingField) return;

      if (passwordFocusedRef.current) return;

      const now = Date.now();

      if (e.key === 'Backspace') {
        backspaceCountRef.current++;
        lastBackspaceTimeRef.current = now;
        if (backspaceCountRef.current > 5) {
          setEmotion('sad', 2000);
          showBubble('Mistakes happen! ✏️', 1500);
          backspaceCountRef.current = 0;
        }
      }

      const text = (active.value || active.innerText || "").toLowerCase();
      checkKeywords(text);
      charCountRef.current++;

      // Typing detection ranges - use smaller intervals for efficiency
      if (charCountRef.current % 3 === 0) { // Update every 3 characters for more activity
        if (charCountRef.current >= 1 && charCountRef.current <= 5) {
          setEmotion('thinking', 1500);
        } else if (charCountRef.current >= 6 && charCountRef.current <= 15) {
          setEmotion('curious', 1500);
        } else if (charCountRef.current >= 16 && charCountRef.current <= 30) {
          setEmotion('excited', 2000);
          if (Math.random() < 0.4) showBubble('Writing something amazing? ✨', 1500);
        } else if (charCountRef.current > 30) {
          setEmotion('celebrating', 1500);
          if (Math.random() < 0.3) showBubble('You are on fire! 🔥', 1500);
        }
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      if (e.key === 'Enter') {
        setEmotion('thumbsup', 2000);
        showBubble('Sent! ✓', 1500);
      }
      if (e.key === 'Escape') {
        setEmotion('shocked', 2000);
        showBubble('Aborted! 😱', 1500);
      }

      typingTimeoutRef.current = setTimeout(() => {
        const text = (active.value || active.innerText || "").toLowerCase();
        if (text) checkKeywords(text);
        
        charCountRef.current = 0;
        backspaceCountRef.current = 0;
        if (!passwordFocusedRef.current) setEmotion('neutral', 1000);
      }, 1500);
    };

    const handleMouseMove = throttle((e) => {
      lastActivityRef.current = Date.now();
      
      // Detect hover over logout buttons
      const target = e.target;
      const isLogout = target && (
        target.innerText?.toLowerCase().includes('logout') || 
        target.innerText?.toLowerCase().includes('sign out') ||
        target.closest('button')?.innerText?.toLowerCase().includes('logout') ||
        target.closest('a')?.innerText?.toLowerCase().includes('logout')
      );

      if (isLogout) {
        setEmotion('sad', 3000);
        showBubble("Are you leaving me already? 😔", 3000);
      } else if (isSleepingRef.current) {
        isSleepingRef.current = false;
        const pool = companionDialogues.IDLE_WAKEUP;
        const wakeMsg = pool[Math.floor(Math.random() * pool.length)];
        setEmotion('excited', 2000);
        showBubble(wakeMsg, 3000);
      }
    }, 200);

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [setEmotion, showBubble, clearBubble]);

  // Idle & Sleep Detection
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;

      if (isMinimized || passwordFocusedRef.current) return;

      if (idleTime > 60000) {
        if (!isSleepingRef.current) {
          isSleepingRef.current = true;
          const pool = companionDialogues.IDLE_SLEEPING;
          const sleepMsg = pool[Math.floor(Math.random() * pool.length)];
          setEmotion('sad', 0);
          showBubble(sleepMsg, Infinity);
        }
      } else if (idleTime > 30000) {
        if (!bubble && !isSleepingRef.current) {
          const pool = companionDialogues.IDLE_30S;
          const randomComment = pool[Math.floor(Math.random() * pool.length)];
          const randomEmotions = ['happy', 'excited', 'thinking', 'curious', 'waving'];
          const randomEmotion = randomEmotions[Math.floor(Math.random() * randomEmotions.length)];
          setEmotion(randomEmotion, 3000);
          showBubble(randomComment, 4000);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isMinimized, bubble, showBubble, setEmotion]);

  const value = {
    currentEmotion,
    bubble,
    isMinimized,
    setEmotion,
    showBubble,
    triggerReaction,
    clearBubble,
    minimize,
    expand
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    return {
      setEmotion: () => {},
      showBubble: () => {},
      clearBubble: () => {},
      minimize: () => {},
      expand: () => {},
      triggerReaction: () => {},
      currentEmotion: 'neutral',
      bubble: null,
      isMinimized: false,
    };
  }
  return context;
};
