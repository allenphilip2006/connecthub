import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { userService, chatService } from "../services/api";
import { mediaUrl } from '../lib/config';

const ShareSheet = ({ open, onClose, share }) => {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    userService.getAllUsers()
      .then((data) => {
        if (!active) return;
        const myEmail = localStorage.getItem("userEmail");
        setUsers((data || []).filter(u => u.email !== myEmail));
      })
      .catch((e) => { void e; });
    return () => { active = false; };
  }, [open]);

  const resetState = () => {
    setQuery("");
    setSelected([]);
    setSending(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users.slice(0, 30);
    return users.filter(u => (u.username || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
  }, [users, query]);

  const toggle = (u) => {
    setSelected((prev) => prev.some(x => x.email === u.email) ? prev.filter(x => x.email !== u.email) : [...prev, u]);
  };

  const onCopy = () => {
    const url = share?.url || `${window.location.origin}/${share?.type === "story" ? "story" : "post"}/${share?.id}`;
    navigator.clipboard.writeText(url);
    resetState();
    onClose();
  };

  const onShareStory = () => {
    const url = `${window.location.origin}/${share?.type === "story" ? "story" : "post"}/${share?.id}`;
    const dest = `/story/create?shareUrl=${encodeURIComponent(url)}${share?.id ? `&id=${share.id}` : ""}`;
    window.location.href = dest;
  };

  const onSendChat = async () => {
    if (!selected.length || !share) return;
    setSending(true);
    const url = share.url || `${window.location.origin}/${share.type === "story" ? "story" : "post"}/${share.id}`;
    const content = url;
    for (const u of selected) {
      try {
        await chatService.sendMessage({ receiverEmail: u.email, content });
      } catch (e) { void e; }
    }
    setSending(false);
    resetState();
    onClose();
    if (selected.length === 1) {
      window.location.href = `/chat?open=${encodeURIComponent(selected[0].email)}`;
    } else {
      window.location.href = `/chat`;
    }
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-end justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60" />
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          className="w-full max-w-md glass rounded-t-2xl border-white/10 p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-black text-sm tracking-widest uppercase">Share</h3>
            <button onClick={onClose} className="text-white/70">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <button onClick={onCopy} className="btn-gradient rounded-xl py-3 text-sm font-black">Copy Link</button>
            <button onClick={onSendChat} disabled={!selected.length || sending} className="btn-gradient rounded-xl py-3 text-sm font-black disabled:opacity-50">{sending ? "Sending..." : selected.length > 1 ? `Send ${selected.length}` : "Send to Chat"}</button>
            <button onClick={onShareStory} className="btn-gradient rounded-xl py-3 text-sm font-black">Share to Story</button>
          </div>
          <div className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-2 text-sm outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto no-scrollbar space-y-2">
            {filtered.map(u => (
              <button
                key={u.id}
                onClick={() => toggle(u)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl border ${selected.some(x => x.email === u.email) ? 'border-purple-500/40 bg-white/5' : 'border-white/10 hover:bg-white/5'}`}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10">
                  <img src={mediaUrl(u.profileImage) || `/placeholder-avatar.svg`} alt="u" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-white">{u.username}</div>
                  <div className="text-[10px] text-gray-500">{u.email}</div>
                </div>
                <div className={`w-5 h-5 rounded border ${selected.some(x => x.email === u.email) ? 'bg-purple-500 border-purple-400' : 'border-white/20'}`} />
              </button>
            ))}
            {!filtered.length && <div className="text-center text-xs text-gray-500 py-6">No users found</div>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareSheet;
