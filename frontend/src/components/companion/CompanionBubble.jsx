import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const CompanionBubble = ({ text, durationMs = 4000, onDismiss }) => {
  if (!text) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={text}
        initial={{ scale: 0.5, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: -5 }}
        transition={{
          enter: { type: "spring", stiffness: 400, damping: 25 },
          exit: { duration: 0.15, ease: "easeIn" },
        }}
        className="companion-bubble"
        style={{
          position: "absolute",
          bottom: "105%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(10,10,20,0.95)",
          border: "1px solid rgba(139,92,246,0.6)",
          borderRadius: 16,
          padding: "10px 14px",
          maxWidth: 200,
          minWidth: 100,
          color: "white",
          fontSize: 12,
          textAlign: "center",
          boxShadow: "0 0 20px rgba(139,92,246,0.3)",
          zIndex: 10002,
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 16,
            height: 16,
            opacity: 0.5,
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
        <div style={{ paddingRight: 20 }}>{text}</div>
        <div
          className="companion-bubble-progress"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            borderRadius: "0 0 16px 16px",
            background: "linear-gradient(90deg, #7c3aed, #ec4899)",
            transformOrigin: "left",
            animation: `companionBubbleShrink ${durationMs}ms linear forwards`,
          }}
        />
        <div
          className="companion-bubble-tail"
          style={{
            position: "absolute",
            bottom: -8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "8px solid rgba(10,10,20,0.95)",
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default CompanionBubble;
