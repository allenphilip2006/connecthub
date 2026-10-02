import React, { useMemo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacter } from '../../context/CharacterContext';
import { useHoverDetection } from './useHoverDetection';
import ParticleEffect from './ParticleEffect';
import './companion.css';

// Vite-native asset loading for mixed extensions
const IMAGES = import.meta.glob('../../assets/companion/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' });

const getSprite = (name) => {
  // Try to find exact match first
  const match = Object.entries(IMAGES).find(([path]) => path.toLowerCase().includes(`/${name.toLowerCase()}.`));
  if (match) return match[1];

  // Fallback map
  const fallbackMap = {
    happy: 'neutral', excited: 'happy', celebrating: 'excited',
    sad: 'neutral', shocked: 'curious', thinking: 'neutral',
    curious: 'neutral', waving: 'happy', thumbsup: 'happy',
    sleepy: 'sad', error: 'sad', coveringeyes: 'close',
    peek: 'curious', close: 'neutral', angry: 'neutral'
  };

  const fallback = fallbackMap[name];
  if (fallback) return getSprite(fallback);

  // Ultimate fallback to neutral
  const neutralMatch = Object.entries(IMAGES).find(([path]) => path.toLowerCase().includes('/neutral.'));
  return neutralMatch ? neutralMatch[1] : '';
};

const CharacterCompanion = () => {
  const { currentEmotion, bubble, isMinimized, minimize, expand, setEmotion, showBubble } = useCharacter();
  const spriteRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const nearTriggered = useRef(false);
  const watchTriggered = useRef(false);
  const [scrollPos, setScrollPos] = useState(0);
  const lastScrollTime = useRef(null);
  useEffect(() => {
    if (lastScrollTime.current === null) {
      lastScrollTime.current = Date.now();
    }
  }, []);

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

  // Initialize global hover detection
  useHoverDetection();

  const isEnabled = localStorage.getItem('ch_companion_enabled') !== 'false';
  
  // Preload all sprites
  useEffect(() => {
    if (!isEnabled) return;
    Object.values(IMAGES).forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [isEnabled]);

  // Eye tracking & Proximity
  useEffect(() => {
    if (isMinimized || !isEnabled) return;

    const onMouseMove = throttle((e) => {
      if (!spriteRef.current) return;
      const rect = spriteRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.3;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Eye movement
      const maxEyeMove = 6;
      const ex = (dx / Math.max(dist, 1)) * Math.min(dist / 30, 1) * maxEyeMove;
      const ey = (dy / Math.max(dist, 1)) * Math.min(dist / 30, 1) * maxEyeMove;

      if (leftEyeRef.current) leftEyeRef.current.style.transform = `translate(${ex}px, ${ey}px)`;
      if (rightEyeRef.current) rightEyeRef.current.style.transform = `translate(${ex}px, ${ey}px)`;

      // Proximity
      if (dist < 40 && !nearTriggered.current) {
        nearTriggered.current = true;
        setEmotion('coveringeyes', 0);
        showBubble('Too close! 😳', 2000);
      } else if (dist < 80 && dist >= 40 && !watchTriggered.current) {
        watchTriggered.current = true;
        setEmotion('curious', 0);
      } else if (dist >= 100) { // Added 20px buffer to prevent rapid switching
        if (nearTriggered.current || watchTriggered.current) {
          nearTriggered.current = false;
          watchTriggered.current = false;
          setEmotion('neutral', 1000);
        }
      }
    }, 32); // Throttle to ~30fps for eye tracking

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [isMinimized, isEnabled, setEmotion, showBubble]);

  // Scroll Detection
  useEffect(() => {
    const handleScroll = throttle(() => {
      const now = Date.now();
      const newPos = window.scrollY;
      const diff = Math.abs(newPos - scrollPos);
      const timeDiff = now - lastScrollTime.current;
      
      if (timeDiff > 0) {
        const speed = (diff / timeDiff) * 1000;
        if (speed > 1500) {
          setEmotion('shocked', 1000);
        }
      }

      if (newPos > 3000 && scrollPos <= 3000) {
        setEmotion('sleepy', 0);
        showBubble('Quite the scroll marathon 👀', 2000);
      }

      setScrollPos(newPos);
      lastScrollTime.current = now;
    }, 100); // Throttle scroll detection to 100ms

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollPos, setEmotion, showBubble]);

  const spriteSrc = useMemo(() => getSprite(currentEmotion), [currentEmotion]);

  const animationClass = useMemo(() => {
    if (['neutral', 'thinking', 'coveringeyes', 'close', 'angry'].includes(currentEmotion)) return 'emotion-neutral';
    if (currentEmotion === 'peek') return 'emotion-peek';
    if (['happy', 'excited', 'waving', 'thumbsup'].includes(currentEmotion)) return 'emotion-happy';
    if (currentEmotion === 'celebrating') return 'emotion-celebrating';
    if (['sad', 'sleepy'].includes(currentEmotion)) return 'emotion-sad';
    if (['shocked', 'error'].includes(currentEmotion)) return 'emotion-shocked';
    return 'emotion-neutral';
  }, [currentEmotion]);

  if (!isEnabled) return null;

  if (isMinimized) {
    return (
      <div className="companion-orb" onClick={expand}>
        <div className="orb-glow" style={{ backgroundColor: '#8b5cf6' }} />
      </div>
    );
  }

  return (
    <div 
      className="companion-container" 
      data-companion-hover="companion"
      onContextMenu={(e) => {
        e.preventDefault();
        setEmotion('shocked', 2000);
        showBubble('Hey! No right clicking! 😤', 2000);
      }}
    >
      <AnimatePresence>
        {bubble && (
          <motion.div
            key="bubble"
            className="companion-bubble"
            initial={{ opacity: 0, y: 15, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {bubble}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        <motion.div
          key={currentEmotion}
          className={`companion-sprite-wrapper ${animationClass}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3, ease: "easeInOut" }} // Smoother transition
          style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }}
        >
          <ParticleEffect emotion={currentEmotion} />
          <img
            ref={spriteRef}
            src={spriteSrc}
            alt="Companion"
            className="companion-image"
            onClick={minimize}
            onError={(e) => { 
              console.error(`Failed to load sprite: ${currentEmotion}`, e);
              // Try falling back to neutral manually if everything fails
              const neutralSrc = getSprite('neutral');
              if (e.target.src !== neutralSrc) e.target.src = neutralSrc; 
            }}
          />
          
          {/* Eye Overlays for tracking */}
          {!['coveringeyes', 'sleepy', 'close'].includes(currentEmotion) && (
            <>
              <div ref={leftEyeRef} className="companion-eye" style={{ top: '28%', left: '35%' }} />
              <div ref={rightEyeRef} className="companion-eye" style={{ top: '28%', left: '58%' }} />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CharacterCompanion;
