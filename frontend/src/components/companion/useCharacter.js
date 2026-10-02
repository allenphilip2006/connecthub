import { useContext } from "react";
import { CharacterContext } from "../../context/CharacterContext";

export const useCharacter = () => {
  const ctx = useContext(CharacterContext);
  if (!ctx) {
    const noop = () => {};
    return {
      setEmotion: noop,
      triggerAction: noop,
      showBubble: noop,
      setPosition: noop,
      minimize: noop,
      expand: noop,
      isEnabled: false,
      settings: {
        enabled: false,
        bubbles: false,
        size: "medium",
        idleAnimations: false,
        reactToActions: false,
        sound: false,
      },
    };
  }
  return ctx;
};

export default useCharacter;

