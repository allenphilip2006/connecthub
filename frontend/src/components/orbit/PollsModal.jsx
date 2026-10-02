import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, X, Check, CheckCircle2, 
  AlertCircle, Plus, Send, Disc3 
} from "lucide-react";
import { useState, useMemo, memo } from "react";

const PollCard = memo(({ poll, onVote, onEnd, isHost, userId }) => {
  const totalVotes = useMemo(() => 
    poll.votes?.length || 0, 
  [poll.votes]);

  const stats = useMemo(() => {
    const counts = {};
    poll.options.forEach(opt => counts[opt] = 0);
    poll.votes?.forEach(v => counts[v.option] = (counts[v.option] || 0) + 1);
    return counts;
  }, [poll.options, poll.votes]);

  const hasVoted = useMemo(() => 
    poll.votes?.some(v => v.userId === userId), 
  [poll.votes, userId]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-white leading-tight pr-12">{poll.question}</h4>
        {isHost && (
          <button 
            onClick={() => onEnd(poll.id)}
            className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition"
          >
            End
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {poll.options.map((opt, i) => {
          const count = stats[opt] || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isYes = opt.toLowerCase() === 'yes';
          const isNo = opt.toLowerCase() === 'no';

          return (
            <button
              key={i}
              disabled={hasVoted}
              onClick={() => onVote(poll.id, opt)}
              className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                hasVoted ? 'bg-white/5 border-white/5 cursor-default' : 'bg-white/5 border-white/5 hover:border-white/20 active:scale-95'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isYes ? 'bg-green-500/20 text-green-400' : 
                isNo ? 'bg-red-500/20 text-red-400' : 
                'bg-purple-500/20 text-purple-400'
              }`}>
                {isYes ? <Check size={20} /> : isNo ? <X size={20} /> : <span className="text-xl font-black">?</span>}
              </div>
              <div className="text-center">
                <span className="block text-[10px] font-black uppercase tracking-widest text-white mb-1">{opt}</span>
                <span className="block text-[10px] font-black text-white/30">{percentage}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default function PollsModal({ polls = [], isHost, onVote, onEnd, onCreate, onClose, userId }) {
  const [newQuestion, setNewQuestion] = useState("");

  const activePolls = useMemo(() => 
    polls.filter(p => p.status !== 'CLOSED' && p.status !== 'ENDED'), 
  [polls]);

  const handleCreate = (e) => {
    if (e.key === 'Enter' && newQuestion.trim()) {
      onCreate(newQuestion.trim(), ["YES", "NO", "MAYBE"]);
      setNewQuestion("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card rounded-[2.5rem] border border-white/10 p-8 w-full max-w-lg shadow-2xl relative bg-[#0a0a0f]/90 backdrop-blur-3xl"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <Disc3 size={24} className="animate-spin-slow" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white leading-none mb-1">Room Polls</h3>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Voice your opinion</p>
        </div>
        <button onClick={onClose} className="ml-auto p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {activePolls.length > 0 ? (
          activePolls.map(poll => (
            <PollCard 
              key={poll.id} 
              poll={poll} 
              onVote={onVote} 
              onEnd={onEnd} 
              isHost={isHost} 
              userId={userId}
            />
          ))
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
            <p className="text-sm font-bold text-white/20">No active polls in orbit.</p>
          </div>
        )}
      </div>

      {isHost && (
        <div className="mt-8 pt-8 border-t border-white/5">
          <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] px-2 mb-3 block">Create New Poll</label>
          <div className="relative group">
            <input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={handleCreate}
              placeholder="Type question & press Enter..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm font-medium text-white outline-none focus:border-purple-500/40 transition-all placeholder-white/10 group-hover:border-white/10"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-purple-500 transition-colors">
              <Send size={18} />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
