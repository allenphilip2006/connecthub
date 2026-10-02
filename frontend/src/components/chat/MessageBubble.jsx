import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const timeText = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function MessageBubble({
  msg,
  isMine,
  showTail,
  onReact,
  reactions = {},
  status, // 'sent' | 'delivered' | 'seen' | undefined
  children
}) {
  const [showTime, setShowTime] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pressTimer = useRef(null);

  const onLongPressStart = () => {
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setPickerOpen(true);
    }, 500);
  };
  const onLongPressEnd = () => clearTimeout(pressTimer.current);

  const bubbleCls = isMine
    ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-tr-none"
    : "bg-[#1a1a2e] text-gray-100 rounded-tl-none border border-white/5";

  const containerCls = isMine ? "justify-end" : "justify-start";
  const tail = showTail
    ? isMine
      ? "after:content-[''] after:absolute after:-right-2 after:bottom-0 after:border-8 after:border-transparent after:border-t-pink-600 after:border-l-pink-600"
      : "after:content-[''] after:absolute after:-left-2 after:bottom-0 after:border-8 after:border-transparent after:border-t-[#1a1a2e] after:border-r-[#1a1a2e]"
    : "";

  const reactionList = useMemo(() => {
    const arr = [];
    Object.entries(reactions).forEach(([emoji, count]) => {
      if (count > 0) arr.push({ emoji, count });
    });
    return arr;
  }, [reactions]);

  const quick = ["❤️", "😂", "😮", "😢", "😡", "👍", "🔥", "✨"];

  const handleContextMenu = (e) => {
    e.preventDefault();
    setPickerOpen(true);
  };

  return (
    <div className={`flex ${containerCls}`}>
      <div className="max-w-[72%]">
        <motion.div
          onPointerDown={onLongPressStart}
          onPointerUp={onLongPressEnd}
          onMouseEnter={() => setShowTime(true)}
          onMouseLeave={() => setShowTime(false)}
          onContextMenu={handleContextMenu}
          className={`relative p-4 px-5 rounded-2xl shadow-xl ${bubbleCls} ${tail}`}
        >
          {children}
          {isMine && status && (
            <div className="absolute -bottom-4 right-2 text-[11px] text-gray-400 flex items-center gap-1">
              {status === "seen" ? (
                <span className="text-sky-400">✓✓</span>
              ) : status === "delivered" ? (
                <span className="text-gray-400">✓✓</span>
              ) : (
                <span className="text-gray-500">✓</span>
              )}
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {reactionList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex gap-1 mt-1"
            >
              {reactionList.map((r) => (
                <div
                  key={r.emoji}
                  className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-bold backdrop-blur"
                >
                  <span className="mr-1">{r.emoji}</span>
                  {r.count > 1 ? r.count : null}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTime && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="text-[10px] text-gray-400 text-center mt-1"
            >
              {timeText(msg.createdAt)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            className="z-20 -mt-10 mx-2 px-2 py-1 bg-black/80 border border-white/10 rounded-full backdrop-blur flex items-center gap-1"
            onMouseLeave={() => setPickerOpen(false)}
          >
            {quick.map((e) => (
              <motion.button
                key={e}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setPickerOpen(false);
                  onReact?.(e, msg);
                }}
                className="text-lg leading-none"
              >
                {e}
              </motion.button>
            ))}
            <button
              onClick={() => setPickerOpen(false)}
              className="ml-1 text-xs px-2 py-1 rounded bg-white/10"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
