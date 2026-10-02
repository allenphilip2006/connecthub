import { useState, useEffect, useCallback, useRef } from 'react';
import { useCharacter } from '../context/CharacterContext';
import companionDialogues from '../data/companionDialogues';

export const useCompanion = (roomState, userActivity) => {
  const [companionState, setCompanionState] = useState({
    emotion: 'neutral',
    activity: 'idle',
    lastInteraction: Date.now(),
    responseQueue: []
  });
  
  const { setEmotion, showBubble } = useCharacter();
  const activityTimeoutRef = useRef(null);
  const emotionTimeoutRef = useRef(null);
  const responseTimeoutRef = useRef(null);
  const dialogueHistoryRef = useRef([]);

  // Dialogue selection engine
  const getDialogue = useCallback((category, data = {}) => {
    const dialogues = companionDialogues[category];
    if (!dialogues || dialogues.length === 0) return "";

    // Filter out last 10 shown dialogues to avoid repetition
    const available = dialogues.filter(d => !dialogueHistoryRef.current.includes(d));
    const pool = available.length > 0 ? available : dialogues;
    
    let dialogue = pool[Math.floor(Math.random() * pool.length)];
    
    // Replace placeholders like {name} or {n}
    Object.entries(data).forEach(([key, value]) => {
      dialogue = dialogue.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    // Update history
    dialogueHistoryRef.current = [dialogue, ...dialogueHistoryRef.current].slice(0, 10);
    
    return dialogue;
  }, []);

  // Map emotion to dialogue category
  const triggerEmotionDialogue = useCallback((emotion) => {
    const emotionMap = {
      happy: ['LOGIN_SUCCESS', 'FEED_LIKE', 'ORBIT_ENTER'],
      excited: ['STORY_SHARED', 'CREATE_POST_SHARED', 'ORBIT_SPOTLIGHT'],
      sad: ['LOGOUT_HOVER', 'FEED_UNLIKE'],
      shocked: ['FEED_SCROLL_FAST', 'LOGIN_ERROR'],
      thinking: ['CHAT_TYPING', 'SEARCH_TYPING'],
      curious: ['EXPLORE_OPEN', 'ORBIT_POLL_START'],
      waving: ['LANDING_SIGNUP_HOVER', 'IDLE_WAKEUP']
    };

    const categories = emotionMap[emotion] || ['IDLE_30S'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const dialogue = getDialogue(category);
    showBubble?.(dialogue, 3500);
  }, [getDialogue, showBubble]);

  // Generate companion responses - Moved to TOP to fix hoisting
  const generateResponse = useCallback((triggerType, data) => {
    const categoryMap = {
      message_sent: 'CHAT_MESSAGE_SENT',
      poll_created: 'ORBIT_POLL_START',
      challenge_launched: 'ORBIT_ENTER',
      user_joined: 'ORBIT_PARTICIPANT_JOIN',
      mood_changed: 'ORBIT_ENTER'
    };

    const category = categoryMap[triggerType] || 'CHAT_MESSAGE_SENT';
    const dialogue = getDialogue(category, data);
    
    showBubble?.(dialogue, 3500);
    
    // Set appropriate emotion for the dialogue
    const triggerEmotions = {
      message_sent: 'happy',
      poll_created: 'curious',
      challenge_launched: 'excited',
      user_joined: 'waving',
      mood_changed: 'happy'
    };
    setEmotion?.(triggerEmotions[triggerType] || 'happy', 3000);
  }, [showBubble, setEmotion, getDialogue]);

  // Analyze room state and update companion reactions
  useEffect(() => {
    const analyzeRoomActivity = () => {
      const currentMood = roomState?.currentMood || 'Chill';
      const participantCount = roomState?.participants?.length || 0;
      const recentMessages = roomState?.messages?.slice(-3) || [];
      const activePolls = roomState?.polls?.filter(p => p.status === 'ACTIVE') || [];
      const hasChallenge = roomState?.currentChallenge;

      // Determine companion emotion based on room activity
      let newEmotion = 'neutral';
      let newActivity = 'idle';
      
      if (hasChallenge) {
        newEmotion = 'excited';
        newActivity = 'responding';
      } else if (activePolls.length > 0) {
        newEmotion = 'curious';
        newActivity = 'listening';
      } else if (recentMessages.length > 0) {
        const lastMessage = recentMessages[recentMessages.length - 1];
        const timeDiff = Date.now() - (lastMessage.timestamp || Date.now());
        
        if (timeDiff < 5000) { // Recent message
          newEmotion = 'happy';
          newActivity = 'listening';
        }
      } else if (participantCount > 1) {
        newEmotion = 'curious';
        newActivity = 'observing';
      }

      // Mood-based adjustments
      switch (currentMood) {
        case 'Energy':
          newEmotion = 'excited';
          newActivity = 'responding';
          break;
        case 'Focus':
          newEmotion = 'thinking';
          newActivity = 'observing';
          break;
        case 'Vibe':
          newEmotion = 'happy';
          newActivity = 'listening';
          break;
        case 'Chill':
          // Keep the existing emotion if it was set by something else
          if (newEmotion === 'neutral') {
            newEmotion = 'neutral';
            newActivity = 'idle';
          }
          break;
      }

      // Only update if state actually changed to prevent unnecessary re-renders
      setCompanionState(prev => {
        if (prev.emotion === newEmotion && prev.activity === newActivity) {
          return prev;
        }
        
        // Also trigger the actual emotion change in the context if it's different
        if (prev.emotion !== newEmotion) {
          setEmotion(newEmotion, 3000);
        }
        
        return {
          ...prev,
          emotion: newEmotion,
          activity: newActivity,
          lastInteraction: Date.now()
        };
      });
    };

    analyzeRoomActivity();
    const interval = setInterval(analyzeRoomActivity, 5000); // Check every 5 seconds instead of 3
    
    return () => clearInterval(interval);
  }, [roomState, setEmotion]);

  // React to user activity
  useEffect(() => {
    if (userActivity) {
      const { type, data } = userActivity;
      
      let targetEmotion = null;
      let targetActivity = null;

      switch (type) {
        case 'typing':
          targetEmotion = 'curious';
          targetActivity = 'listening';
          break;
          
        case 'message_sent':
          targetEmotion = 'happy';
          targetActivity = 'responding';
          // Add response to queue
          setTimeout(() => {
            generateResponse('message_sent', data);
          }, 1000 + Math.random() * 2000);
          break;
          
        case 'poll_created':
          targetEmotion = 'excited';
          targetActivity = 'responding';
          setTimeout(() => {
            generateResponse('poll_created', data);
          }, 1500);
          break;
          
        case 'challenge_launched':
          targetEmotion = 'excited';
          targetActivity = 'responding';
          setTimeout(() => {
            generateResponse('challenge_launched', data);
          }, 1000);
          break;
          
        case 'mood_changed':
          targetEmotion = data.mood === 'Energy' ? 'excited' : 'happy';
          targetActivity = 'responding';
          break;
          
        case 'user_joined':
          targetEmotion = 'happy';
          targetActivity = 'listening';
          setTimeout(() => {
            generateResponse('user_joined', data);
          }, 2000);
          break;
      }

      if (targetEmotion) {
        setEmotion(targetEmotion, 3000);
        setCompanionState(prev => ({
          ...prev,
          emotion: targetEmotion,
          activity: targetActivity,
          lastInteraction: Date.now()
        }));
      }
      
      // Reset to idle after delay
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      activityTimeoutRef.current = setTimeout(() => {
        setCompanionState(prev => ({
          ...prev,
          activity: 'idle'
        }));
      }, 5000);
    }
  }, [userActivity, setEmotion, generateResponse]);

  // Companion interaction handler
  const handleCompanionInteraction = useCallback(() => {
    const dialogue = getDialogue('HOVER_COMPANION_SELF');
    showBubble?.(dialogue, 2500);
    setEmotion?.('excited', 2000);
    
    setCompanionState(prev => ({
      ...prev,
      emotion: 'excited',
      activity: 'responding',
      lastInteraction: Date.now()
    }));
    
    // Reset after interaction
    setTimeout(() => {
      setCompanionState(prev => ({
        ...prev,
        activity: 'idle'
      }));
    }, 3000);
  }, [showBubble, setEmotion, getDialogue]);

  // Auto-idle behavior
  useEffect(() => {
    const timeSinceLastInteraction = Date.now() - companionState.lastInteraction;
    
    if (timeSinceLastInteraction > 30000 && companionState.activity === 'idle') {
      // Start idle animation
      const dialogue = getDialogue('IDLE_30S');
      showBubble?.(dialogue, 4000);
      
      const idleBehaviors = ['observing', 'thinking', 'listening'];
      const randomBehavior = idleBehaviors[Math.floor(Math.random() * idleBehaviors.length)];
      
      setCompanionState(prev => ({
        ...prev,
        activity: randomBehavior
      }));
      
      // Reset after idle behavior
      if (emotionTimeoutRef.current) {
        clearTimeout(emotionTimeoutRef.current);
      }
      emotionTimeoutRef.current = setTimeout(() => {
        setCompanionState(prev => ({
          ...prev,
          activity: 'idle'
        }));
      }, 4000);
    }
  }, [companionState.lastInteraction, companionState.activity, getDialogue, showBubble]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current);
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    };
  }, []);

  return {
    companionState,
    handleCompanionInteraction,
    getDialogue
  };
};
