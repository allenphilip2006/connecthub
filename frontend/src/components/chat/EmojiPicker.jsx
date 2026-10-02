import { motion } from "framer-motion";

const TABS = [
  { key: "recents", label: "Recents" },
  { key: "smileys", label: "Smileys" },
  { key: "people", label: "People" },
  { key: "nature", label: "Nature" },
  { key: "food", label: "Food" },
  { key: "activities", label: "Activities" },
  { key: "objects", label: "Objects" },
  { key: "symbols", label: "Symbols" }
];

const DEFAULTS = ["😀","😁","😂","🤣","😊","😍","😘","😜","🤩","😎","😭","😡","🤔","👍","👏","🙏","🔥","✨","💯","🎉"];

export default function EmojiPicker({ onPick, onClose }) {
  const recents = JSON.parse(localStorage.getItem("emoji_recents") || "[]");

  const pick = (e) => {
    const updated = [e, ...recents.filter((x) => x !== e)].slice(0, 30);
    localStorage.setItem("emoji_recents", JSON.stringify(updated));
    onPick?.(e);
  };

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 30, opacity: 0 }}
      className="absolute bottom-full left-0 right-0 mx-auto w-full max-w-lg glass rounded-2xl border border-white/10 p-3"
      style={{ height: "40vh" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2 text-[11px] font-black uppercase tracking-widest">
          {TABS.map(t => (
            <span key={t.key} className="px-2 py-1 rounded bg-white/5 border border-white/10">{t.label}</span>
          ))}
        </div>
        <button onClick={onClose} className="text-white/70 text-sm">✕</button>
      </div>
      <div className="h-[calc(40vh-42px)] overflow-y-auto thin-purple-scroll grid grid-cols-8 gap-2 p-2">
        {(recents.length > 0 ? recents : DEFAULTS).map(e => (
          <button
            key={e}
            onClick={() => pick(e)}
            className="text-2xl hover:scale-125 transition"
          >
            {e}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
