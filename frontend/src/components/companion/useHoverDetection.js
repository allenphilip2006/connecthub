import { useEffect, useCallback } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { useCompanion } from '../../hooks/useCompanion';

export function useHoverDetection() {
  const { setEmotion, showBubble, clearBubble } = useCharacter();
  const { getDialogue } = useCompanion();

  const handleHoverReaction = useCallback((type) => {
    let emotion = 'happy';
    let category = '';

    switch (type) {
      case 'logout':
        emotion = 'sad';
        category = 'LOGOUT_HOVER';
        break;
      case 'login':
        emotion = 'excited';
        category = 'LANDING_LOGIN_HOVER';
        break;
      case 'signup':
        emotion = 'happy';
        category = 'LANDING_SIGNUP_HOVER';
        break;
      case 'companion':
        emotion = 'coveringeyes';
        category = 'HOVER_COMPANION_SELF';
        break;
      case 'like':
        emotion = 'happy';
        category = 'HOVER_LIKE';
        break;
      case 'comment':
        emotion = 'thinking';
        category = 'HOVER_COMMENT';
        break;
      case 'share':
        emotion = 'excited';
        category = 'HOVER_SHARE';
        break;
      case 'save':
        emotion = 'happy';
        category = 'HOVER_SAVE';
        break;
      case 'delete':
        emotion = 'shocked';
        category = 'HOVER_DELETE';
        break;
      case 'explore':
        emotion = 'curious';
        category = 'HOVER_EXPLORE';
        break;
      case 'chat':
        emotion = 'happy';
        category = 'HOVER_CHAT';
        break;
      case 'create':
        emotion = 'excited';
        category = 'HOVER_CREATE';
        break;
      case 'notifications':
        emotion = 'peek';
        category = 'HOVER_NOTIFICATIONS';
        break;
      case 'settings':
        emotion = 'neutral';
        category = 'HOVER_SETTINGS';
        break;
      case 'orbit-room':
        emotion = 'excited';
        category = 'HOVER_ORBIT_ROOM';
        break;
      default:
        emotion = 'neutral';
        category = 'IDLE_30S';
    }

    setEmotion(emotion, 0); // Stays until mouseout
    if (category) {
      const dialogue = getDialogue(category);
      showBubble(dialogue, 0); // Stays until mouseout
    }
  }, [setEmotion, showBubble, getDialogue]);

  const handleHoverLeave = useCallback((type) => {
    if (type === 'logout') {
      setEmotion('neutral', 1000);
      clearBubble();
    } else {
      setEmotion('neutral', 800);
      clearBubble();
    }
  }, [setEmotion, clearBubble]);

  useEffect(() => {
    const onMouseOver = (e) => {
      const target = e.target.closest("[data-companion-hover]");
      if (!target) return;
      const type = target.getAttribute("data-companion-hover");
      handleHoverReaction(type);
    };

    const onMouseOut = (e) => {
      const target = e.target.closest("[data-companion-hover]");
      if (!target) return;
      const type = target.getAttribute("data-companion-hover");
      handleHoverLeave(type);
    };

    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    return () => {
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [handleHoverReaction, handleHoverLeave]);
}
