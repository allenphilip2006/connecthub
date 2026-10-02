import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Heart, Zap, Music, Star, Wind,
  Sparkles, Smile, CloudRain, Check, Palette
} from "lucide-react";

export default function MoodSync({ currentMood, onMoodSelect, onClose }) {
  const moods = [
    { id: "Hype", icon: Flame, color: "#f59e0b", particles: 1.5 },
    { id: "Chill", icon: Wind, color: "#3b82f6", particles: 0.4 },
    { id: "Focus", icon: Zap, color: "#10b981", particles: 0.2 },
    { id: "Party", icon: Music, color: "#ec4899", particles: 2.5 },
    { id: "Emotional", icon: CloudRain, color: "#8b5cf6", particles: 0.6 },
    { id: "Energy", icon: Sparkles, color: "#7c3aed", particles: 1.2 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass rounded-3xl border border-white/10 p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-xl shadow-purple-500/10">
          <Palette size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black text-white leading-none mb-1">Room Mood</h3>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Affects visual vibe</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {moods.map(mood => (
          <button
            key={mood.id}
            onClick={() => { onMoodSelect(mood); onClose(); }}
            className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all ${currentMood === mood.id ? "bg-white text-black border-white shadow-xl scale-[1.05]" : "bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:bg-white/10 hover:scale-[1.02]"}`}
          >
            <mood.icon size={28} className={currentMood === mood.id ? "text-black" : "text-white/40 group-hover:text-white transition-colors"} />
            <span className="text-[11px] font-black uppercase tracking-widest">{mood.id}</span>
            {currentMood === mood.id && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-black flex items-center justify-center text-[10px] text-white"><Check size={10} /></div>
            )}
          </button>
        ))}
      </div>

      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition"><X size={20} /></button>
    </motion.div>
  );
}

function X({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>; }
