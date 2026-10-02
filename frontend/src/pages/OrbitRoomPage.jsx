import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Share2, LogOut, Shield, Clock, Disc3, Timer, Users, MessageSquare, BarChart2, Edit3, Heart, Star } from "lucide-react";
import { orbitService, userService } from "../services/api";
import { useCharacter } from "../context/CharacterContext";
import { useCompanion } from "../hooks/useCompanion";
import OrbScene3D from "../components/orbit/OrbScene3D";
import OrbitRadialMenu from "../components/orbit/OrbitRadialMenu";
import OrbitAvatarRing from "../components/orbit/OrbitAvatarRing";
import WhiteboardOverlay from "../components/orbit/WhiteboardOverlay";
import PollsModal from "../components/orbit/PollsModal";
import ChallengeCreator from "../components/orbit/ChallengeCreator";
import CharacterCompanion from "../components/companion/CharacterCompanion";
import "./orbit.css";

const OrbitMessage = memo(({ message, isOwn }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-4`}
  >
    <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed ${
      isOwn 
        ? 'bg-white text-black font-bold shadow-lg shadow-white/5' 
        : 'bg-white/5 text-white/90 border border-white/10 backdrop-blur-md'
    }`}>
      {message.text}
    </div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mt-2 px-1">
      {message.senderUsername || 'Member'} • {new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  </motion.div>
));


const SuggestionCard = memo(({ text, onDismiss }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-4 w-[240px]"
  >
    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
      <Shield size={16} />
    </div>
    <p className="text-[10px] font-bold text-white/60 leading-tight flex-1">{text}</p>
    <button onClick={onDismiss} className="text-white/20 hover:text-white transition">
      <LogOut size={14} className="rotate-180" />
    </button>
  </motion.div>
));

export default function OrbitRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { setEmotion, showBubble } = useCharacter();
  const feedRef = useRef();

  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showMoodPanel, setShowMoodPanel] = useState(false);
  const [inputText, setInputText] = useState("");
  const [spotlightUserId, setSpotlightUserId] = useState(null);
  const [orbState, setOrbState] = useState("idle");
  const [userActivity, setUserActivity] = useState(null);
  const [suggestions, setSuggestions] = useState([
    { id: 1, text: "The energy is high! Why not launch a quick poll?" },
    { id: 2, text: "Someone is typing... wait for their vibe." }
  ]);

  // Companion system
  const { companionState, handleCompanionInteraction } = useCompanion(room, userActivity);

  const currentEmail = localStorage.getItem('userEmail');
  const isHost = room?.hostEmail === currentEmail;

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [room?.messages]);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const res = await orbitService.getRoom(roomId);
        if (!res?.room) throw new Error("Not found");
        setRoom(res.room);
        setParticipants(res.participants || []);
        setLoading(false);
        setEmotion?.('excited', 2000);
        showBubble?.(`WELCOME TO THE ORBIT!! 🌐🎉`, 2500);
      } catch (err) {
        console.error(err);
        navigate("/chat");
      }
    };
    loadRoom();
  }, [roomId, navigate, setEmotion, showBubble]);

  const timeLeft = useMemo(() => {
    const expiresAt = new Date(room?.expiresAt || Date.now());
    const diff = Math.max(0, expiresAt.getTime() - Date.now());
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [room?.expiresAt]);

  const send = useCallback(async () => {
    if (!inputText.trim()) return;
    try {
      const msg = { text: inputText.trim(), senderId: currentEmail, senderUsername: 'You', timestamp: Date.now() };
      setRoom(prev => ({ ...prev, messages: [...(prev.messages || []), msg] }));
      setInputText("");
      setOrbState("typing");
      setTimeout(() => setOrbState("idle"), 2000);
      
      setUserActivity({ type: 'message_sent', data: { message: msg.text } });
      setTimeout(() => setUserActivity(null), 5000);
    } catch (err) {
      console.error(err);
    }
  }, [inputText, currentEmail]);

  const handleMenuAction = useCallback((id) => {
    if (id === 'board') {
      setShowWhiteboard(prev => !prev);
      setUserActivity({ type: 'tool_opened', data: { tool: 'whiteboard' } });
    }
    if (id === 'poll') {
      setShowPolls(true);
      setUserActivity({ type: 'tool_opened', data: { tool: 'polls' } });
    }
    if (id === 'invite') {
      // Create a specific Invite message in the chat
      const inviteMsg = { 
        text: `Hey! Join my orbit room! Link: ${window.location.href} Code: ${room.inviteCode || 'No Code'}`, 
        senderId: currentEmail, 
        senderUsername: 'Orbit Host', 
        timestamp: Date.now() 
      };
      setRoom(prev => ({ ...prev, messages: [...(prev.messages || []), inviteMsg] }));
      
      navigator.clipboard.writeText(window.location.href);
      showBubble?.("Invite link copied & shared in chat! 👤+", 3000);
      setEmotion?.('happy', 2000);
      setUserActivity({ type: 'invite_copied', data: {} });
    }
    if (id === 'members') {
      setShowMembers(prev => !prev);
    }
    if (id === 'mood') {
      setShowMoodPanel(prev => !prev);
    }
    if (id === 'help') {
      showBubble?.("Click the CENTER ORB to open the quick menu! 🌐✨", 5000);
      setEmotion?.('happy', 3000);
    }
    if (id === 'timer') {
      // Toggle a simple 25 min focus timer
      showBubble?.("Focus timer started for 25 mins! ⏱️", 3000);
      setEmotion?.('thinking', 2000);
    }
    if (id === 'leave') {
      if (window.confirm("Leave the orbit?")) {
        navigate("/chat");
      }
    }
    setMenuOpen(false);
    setTimeout(() => setUserActivity(null), 3000);
  }, [showBubble, setEmotion, navigate, room, currentEmail]);

  const handleCreatePoll = useCallback((question, options) => {
    const newPoll = {
      id: crypto.randomUUID(),
      question,
      options,
      status: 'ACTIVE',
      votes: []
    };
    setRoom(prev => ({ ...prev, polls: [...(prev.polls || []), newPoll] }));
    showBubble?.("Poll launched!! Cast your vote! 📊", 2500);
    setEmotion?.('excited', 2000);
  }, [showBubble, setEmotion]);

  const handleLaunchChallenge = useCallback((challenge) => {
    setRoom(prev => ({ ...prev, currentChallenge: challenge }));
    showBubble?.("Challenge accepted! Let's go! 🎯", 2500);
    setEmotion?.('excited', 2000);
  }, [showBubble, setEmotion]);

  const handleVote = useCallback((pollId, option) => {
    setRoom(prev => ({
      ...prev,
      polls: prev.polls.map(p => p.id === pollId ? { ...p, votes: [...(p.votes || []), { userId: currentEmail, option }] } : p)
    }));
    showBubble?.("Vote registered! Nice! ✅", 1500);
    setEmotion?.('happy', 1500);
  }, [currentEmail, showBubble, setEmotion]);

  const changeMood = useCallback((mood) => {
    setRoom(prev => ({ ...prev, currentMood: mood }));
    setShowMoodPanel(false);
    showBubble?.(`Mood changed to ${mood}! 🎵`, 2000);
    setEmotion?.('happy', 2000);
    setUserActivity({ type: 'mood_changed', data: { mood } });
    setTimeout(() => setUserActivity(null), 3000);
  }, [showBubble, setEmotion]);

  const dismissSuggestion = useCallback((id) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  if (loading || !room) return null;

  return (
    <div className="orbit-page">
      {/* Header */}
      <div className="orbit-header">
        <div className="orbit-header-left">
          <span className="live-badge">LIVE ORBIT</span>
          <h1 className="room-name">{room.name}</h1>
          <span className="hosted-by">
            Hosted by {isHost ? 'You' : room.hostName || 'Orbit Host'}
          </span>
        </div>
        <div className="orbit-header-center">
          <span className="timer">{timeLeft}</span>
          <span className="mood-badge">{room.currentMood || 'Chill'}</span>
          <span className="status-badge">{orbState.toUpperCase()}</span>
        </div>
        <div className="orbit-header-right">
          <button className="share-btn" data-tooltip="Copy Invite Link" onClick={() => handleMenuAction('invite')}>Share</button>
          <button className="leave-btn" data-tooltip="Exit Room" onClick={() => handleMenuAction('leave')}>Leave Orbit</button>
        </div>
      </div>

      {/* Main body */}
      <div className="orbit-body">
        {/* Left: 3D scene or whiteboard */}
        <div className="orbit-left">
          {showWhiteboard ? (
            <div className="absolute inset-0 z-[50] bg-black">
              <WhiteboardOverlay 
                room={room} 
                onClose={() => setShowWhiteboard(false)} 
                onUpdate={() => {}} 
              />
            </div>
          ) : (
            <OrbScene3D 
              orbState={orbState}
              onOrbClick={() => setMenuOpen(!menuOpen)}
              currentMood={room.currentMood || 'Chill'}
              onMenuAction={handleMenuAction}
              companionState={companionState}
              onCompanionInteraction={handleCompanionInteraction}
              participants={participants}
              spotlightUserId={spotlightUserId}
              onParticipantClick={(p) => {
                setSpotlightUserId(p.id || p.email);
                showBubble?.(`Spotlight on ${p.username}! ✨`, 2000);
                setEmotion?.('excited', 2000);
                setUserActivity({ type: 'spotlight_changed', data: { user: p.username } });
                setTimeout(() => setUserActivity(null), 3000);
              }}
            />
          )}

          {/* Dedicated Companion Zone */}
          <div className="orbit-companion-zone">
            <CharacterCompanion />
          </div>

          {/* Overlays */}
          <AnimatePresence>
            {menuOpen && (
              <OrbitRadialMenu 
                onSelect={handleMenuAction} 
                onClose={() => setMenuOpen(false)} 
              />
            )}

            {showPolls && (
              <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && setShowPolls(false)}>
                <PollsModal 
                  polls={room.polls || []}
                  isHost={isHost}
                  onVote={handleVote}
                  onEnd={(id) => setRoom(prev => ({ ...prev, polls: prev.polls.map(p => p.id === id ? { ...p, status: 'CLOSED' } : p) }))}
                  onCreate={handleCreatePoll}
                  onClose={() => setShowPolls(false)}
                  userId={currentEmail}
                />
              </div>
            )}

            {showMembers && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="absolute right-0 top-0 bottom-0 w-64 bg-black/90 backdrop-blur-xl border-l border-white/10 z-[100] p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-purple-400">Participants</h3>
                  <button onClick={() => setShowMembers(false)} className="text-white/40 hover:text-white"><LogOut size={16} /></button>
                </div>
                <div className="space-y-4">
                  {participants.map(p => (
                    <div key={p.id || p.email} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-vibrant/20 border border-vibrant/30 flex items-center justify-center text-[10px]">
                          {p.username?.[0] || 'U'}
                        </div>
                        <span className="text-sm font-bold text-white/80">{p.username}</span>
                      </div>
                      {isHost && (
                        <button 
                          onClick={() => setSpotlightUserId(p.id || p.email)}
                          className={`p-1.5 rounded-lg transition ${spotlightUserId === (p.id || p.email) ? 'bg-vibrant text-white' : 'bg-white/5 text-white/20 hover:text-vibrant'}`}
                          data-tooltip="Spotlight User"
                        >
                          <Star size={12} fill={spotlightUserId === (p.id || p.email) ? 'currentColor' : 'none'} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {showMoodPanel && (
              <div className="modal-backdrop" onClick={() => setShowMoodPanel(false)}>
                <div className="glass-card p-8 rounded-[2rem] border-white/10 max-w-sm w-full grid grid-cols-2 gap-4">
                  {['Hype', 'Chill', 'Focus', 'Party', 'Emotional', 'Energy'].map(m => (
                    <button 
                      key={m}
                      onClick={() => changeMood(m)}
                      className={`p-4 rounded-2xl border transition-all ${room.currentMood === m ? 'bg-vibrant/20 border-vibrant text-vibrant' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">{m}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Host Suggestions */}
          {isHost && (
            <div className="absolute top-20 left-6 flex flex-col gap-4 pointer-events-none">
              <AnimatePresence>
                {suggestions.map(s => (
                  <div key={s.id} className="pointer-events-auto">
                    <SuggestionCard text={s.text} onDismiss={() => dismissSuggestion(s.id)} />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: chat always visible */}
        <div className="orbit-right">
          <div className="orbit-chat-header">
            <span className="chat-title">ORBIT CHAT</span>
            <span className="participant-count">
              {participants.length} IN ORBIT
            </span>
          </div>

          <div className="orbit-chat-feed" ref={feedRef}>
            {(room.messages || []).map((msg, i) => (
              <OrbitMessage 
                key={msg.id || i} 
                message={msg} 
                isOwn={msg.senderId === currentEmail} 
              />
            ))}
          </div>

          <div className="orbit-chat-input-bar">
            <input 
              value={inputText} 
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()} 
              placeholder="Send to orbit..." 
              data-companion-hover="chat"
            />
            <button onClick={send} data-tooltip="Send Message">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="orbit-toolbar">
        {[
          { id: 'poll', label: 'VOTE', icon: BarChart2 },
          { id: 'board', label: 'BOARD', icon: Edit3 },
          { id: 'mood', label: 'MOOD', icon: Heart },
          { id: 'members', label: 'MEMBERS', icon: Users },
          { id: 'timer', label: 'TIMER', icon: Clock },
          { id: 'invite', label: 'INVITE', icon: Share2 },
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => handleMenuAction(item.id)}
            data-companion-hover="orbit-room"
            data-tooltip={item.label}
            className={`orbit-toolbar-btn ${ (item.id === 'board' && showWhiteboard) || (item.id === 'members' && showMembers) || (item.id === 'mood' && showMoodPanel) ? 'active' : '' }`}
          >
            <item.icon />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
