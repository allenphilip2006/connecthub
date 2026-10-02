import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Clock, Send, X, Camera, Image as ImageIcon,
  CheckCircle2, Sparkles, Timer, Crown, AlertCircle
} from "lucide-react";
import { useState } from "react";

export default function ChallengeCreator({ onLaunch, onClose }) {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(3); // minutes

  const durations = [1, 3, 5, 10];

  const handleLaunch = () => {
    if (!prompt.trim()) return;
    onLaunch({
      id: crypto.randomUUID(),
      prompt: prompt.trim(),
      duration: duration * 60,
      startTime: Date.now(),
      status: "ACTIVE",
      responses: []
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass rounded-3xl border border-white/10 p-6 w-full max-w-md shadow-2xl relative"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
          <Trophy size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black text-white leading-none mb-1">New Challenge</h3>
          <p className="text-xs font-black text-white/30 uppercase tracking-widest">Boost engagement</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Share your best photo from today!"
            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-medium outline-none focus:border-yellow-500/40 transition-all resize-none h-24 placeholder-white/10"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Duration (Minutes)</label>
          <div className="flex gap-2">
            {durations.map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border ${duration === d ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"}`}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleLaunch}
            disabled={!prompt.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black uppercase tracking-widest shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            Launch Challenge
          </button>
        </div>
      </div>

      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition"><X size={20} /></button>
    </motion.div>
  );
}
