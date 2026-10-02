import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { orbitService, userService } from "@/services/api";
import { X, Search, Users, Plus, Check } from "lucide-react";
import { saveRoomToUserIndex, sendInvite } from "@/utils/orbitUtils";

export default function CreateOrbitRoomModal({ open, onClose }) {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(3600); // 1h
  const [maxP, setMaxP] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]); // Array of user objects
  const myEmail = localStorage.getItem("userEmail") || "me";

  useEffect(() => {
    if (searchQuery.length > 1) {
      userService.searchUsers(searchQuery).then(setUserResults);
    } else {
      setUserResults([]);
    }
  }, [searchQuery]);

  const toggleInvite = (user) => {
    setInvitedUsers(prev => {
      const exists = prev.find(u => u.email === user.email);
      if (exists) return prev.filter(u => u.email !== user.email);
      return [...prev, user];
    });
    setSearchQuery("");
  };

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const id = crypto.randomUUID();
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const room = await orbitService.createRoom({
        id,
        name: name.trim(),
        hostEmail: myEmail,
        duration,
        maxParticipants: maxP,
        inviteCode
      });
      
      // Save to host index
      saveRoomToUserIndex(myEmail, id);
      localStorage.setItem(`ch_orbit_${id}`, JSON.stringify({ ...room, id }));

      // Send invites
      invitedUsers.forEach(user => {
        sendInvite(id, name.trim(), { 
          username: localStorage.getItem("username"), 
          avatar: localStorage.getItem("profileImage") 
        }, user.email);
      });

      onClose?.();
      nav(`/orbit/${id}`);
    } catch (err) {
      console.error("Failed to create room", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] bg-black/70 grid place-items-center p-4"
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, rotateX: -10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.92, rotateX: -10 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
            className="glass rounded-2xl border border-white/10 p-6 w-[min(520px,92vw)] card-3d"
          >
            <h3 className="text-xl font-black text-vibrant mb-4">Create Orbit Room</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Room Name</label>
                <input 
                  value={name} onChange={(e)=>setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-purple-500/50 transition-all"
                  placeholder="e.g. Design Review"
                />
              </div>

              {/* Invite Section */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Invite People</label>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-purple-500 transition-colors">
                    <Search size={14} />
                  </div>
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-purple-500/50 transition-all"
                    placeholder="Search by username..."
                  />
                  
                  <AnimatePresence>
                    {userResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto thin-purple-scroll"
                      >
                        {userResults.map(u => (
                          <button 
                            key={u.id}
                            onClick={() => toggleInvite(u)}
                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <img src={u.profileImage ? `http://localhost:62223${u.profileImage}` : '/placeholder-avatar.svg'} className="w-8 h-8 rounded-full" alt="av" />
                              <span className="text-xs font-bold text-white">{u.username}</span>
                            </div>
                            {invitedUsers.find(iu => iu.email === u.email) ? (
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white"><Check size={12} /></div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-white/20"><Plus size={12} /></div>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Invited List */}
                <div className="flex flex-wrap gap-2 px-1">
                  <AnimatePresence>
                    {invitedUsers.map(u => (
                      <motion.div
                        key={u.email}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full pl-1 pr-2.5 py-1"
                      >
                        <img src={u.profileImage ? `http://localhost:62223${u.profileImage}` : '/placeholder-avatar.svg'} className="w-5 h-5 rounded-full" alt="av" />
                        <span className="text-[10px] font-black text-white">{u.username}</span>
                        <button onClick={() => toggleInvite(u)} className="text-white/40 hover:text-white transition-colors"><X size={10} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Duration</label>
                  <select 
                    value={duration} onChange={(e)=>setDuration(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none"
                  >
                    <option value={600} className="bg-[#1a1a24]">10 Minutes</option>
                    <option value={1800} className="bg-[#1a1a24]">30 Minutes</option>
                    <option value={3600} className="bg-[#1a1a24]">1 Hour</option>
                    <option value={7200} className="bg-[#1a1a24]">2 Hours</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Max Participants</label>
                  <input 
                    type="number" value={maxP} onChange={(e)=>setMaxP(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={create}
                disabled={!name.trim() || loading}
                className="w-full py-4 rounded-[1.5rem] bg-vibrant-gradient text-white font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {loading ? "Launching Orbit..." : "Launch Orbit Room"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
