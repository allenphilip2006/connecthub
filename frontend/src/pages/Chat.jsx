import { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { userService, chatService, postService, storyService } from '../services/api';
import MessageBubble from '../components/chat/MessageBubble';
import EmojiPicker from '../components/chat/EmojiPicker';
import GifPicker from '../components/chat/GifPicker';
import useVoiceRecorder from '../components/chat/useVoiceRecorder';
import CameraModal from '../components/chat/CameraModal';
import CreateOrbitRoomModal from '../components/orbit/CreateOrbitRoomModal';
import { Hash } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationContext from '../context/NotificationContext';
import { getCurrentUserRooms, getMyInvites, acceptInvite, declineInvite, joinByCode } from '../utils/orbitUtils';
import { useCharacter } from '../context/CharacterContext';
import { WS_URL, mediaUrl } from '../lib/config';

function Chat() {
    const { unreadCounts, markAsRead, addNotification } = useContext(NotificationContext);
    const { setEmotion, showBubble, triggerAction } = useCharacter();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [stompClient, setStompClient] = useState(null);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const [isGifOpen, setIsGifOpen] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [sendError, setSendError] = useState('');
    const [lastByUser, setLastByUser] = useState({});
    const [showSidebar, setShowSidebar] = useState(true);
    const [cameraOpen, setCameraOpen] = useState(false);
    const currentConversationIdRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const selectedUserRef = useRef(null);
    const usersRef = useRef([]);
    const reactionsRef = useRef({}); // { messageId: { emoji: count } }
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [invites, setInvites] = useState([]);
    const [inviteCode, setInviteCode] = useState('');

    const location = useLocation();
    const navigate = useNavigate();
    const myEmail = localStorage.getItem('userEmail');

    const loadRooms = async () => {
        const myRooms = getCurrentUserRooms(myEmail);
        setRooms(myRooms);
        const myInvites = getMyInvites(myEmail);
        setInvites(myInvites);
    };
    useEffect(() => { loadRooms(); }, [myEmail]);

    // Handle navigation from notification bubble
    useEffect(() => {
        if (location.state?.selectedEmail) {
            const user = users.find(u => u.email === location.state.selectedEmail);
            if (user) setSelectedUser(user);
        }
    }, [location.state, users]);

    const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 1024, []);

    useEffect(() => {
        if (!myEmail) return;
        let active = true;
        userService.getAllUsers()
            .then((data) => {
                if (!active) return;
                const filtered = data.filter(u => u.email !== myEmail);
                usersRef.current = filtered;
                setUsers(filtered);
                // Load last message previews (lightweight)
                (async () => {
                    const cap = 15; // limit parallel fetches
                    const subset = filtered.slice(0, cap);
                    const previews = {};
                    for (const u of subset) {
                        try {
                            const history = await chatService.getHistory(u.email);
                            if (history && history.length > 0) {
                                previews[u.email] = history[history.length - 1];
                            } else {
                                previews[u.email] = null;
                            }
                        } catch { previews[u.email] = null; }
                    }
                    setLastByUser((m) => ({ ...m, ...previews }));
                })();
            })
            .catch((err) => {
                console.error("Failed to fetch users", err);
            });
        return () => {
            active = false;
        };
    }, [myEmail]);

    useEffect(() => {
        if (!myEmail) return;
        const socket = new SockJS(WS_URL);
        const client = Stomp.over(socket);
        const token = localStorage.getItem('token');

        client.debug = null;

        let connected = false;
        client.connect({ Authorization: `Bearer ${token}` }, () => {
            connected = true;
            setStompClient(client);
            // ✅ Subscribe to personal queue
            client.subscribe(`/user/queue/messages`, (msg) => {
                const receivedMsg = JSON.parse(msg.body);

                // 🛑 IGNORE messages sent by me (avoid duplication in UI)
                if (receivedMsg.senderEmail === myEmail) return;

                const currentUser = selectedUserRef.current;
                const fallbackUser = !currentUser
                    ? usersRef.current.find((u) => u.email === receivedMsg.senderEmail)
                    : null;
                const activeUser = currentUser || fallbackUser;
                if (activeUser && receivedMsg.senderEmail === activeUser.email) {
                    if (!currentConversationIdRef.current || receivedMsg.conversationId === currentConversationIdRef.current) {
                        setMessages((prev) => [...prev, receivedMsg]);
                        currentConversationIdRef.current = receivedMsg.conversationId;
                        setCurrentConversationId(receivedMsg.conversationId);
                        markAsRead(receivedMsg.senderEmail); // Clear global unread if open
                        if (receivedMsg.senderEmail !== myEmail) {
                            setEmotion('shocked', 1500);
                        }
                    }
                    if (!currentUser && fallbackUser) {
                        setSelectedUser(fallbackUser);
                    }
                    setLastByUser((m) => ({ ...m, [receivedMsg.senderEmail]: receivedMsg }));
                } else {
                    // Global unread increment happens in NotificationContext
                    // We just need to re-sort the user list here
                    const idx = usersRef.current.findIndex(u => u.email === receivedMsg.senderEmail);
                    if (idx !== -1) {
                        const arr = usersRef.current.slice();
                        const [u] = arr.splice(idx, 1);
                        arr.unshift(u);
                        usersRef.current = arr;
                        setUsers(arr);
                    }
                    setLastByUser((m) => ({ ...m, [receivedMsg.senderEmail]: receivedMsg }));
                }
                setIsTyping(false);
            });
            client.subscribe(`/user/queue/typing`, (msg) => {
                const data = JSON.parse(msg.body);
                const currentUser = selectedUserRef.current;
                if (currentUser && data.sender === currentUser.email) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 1500);
                }
            });
        });

        return () => {
            if (connected && client) {
                try {
                    client.disconnect();
                } catch (e) {
                    console.error("Chat disconnect failed", e);
                }
            }
        };
    }, [myEmail]);
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            try { Notification.requestPermission(); } catch { /* ignore */ }
        }
    }, []);

    // ✅ Fetch history when selectedUser changes
    useEffect(() => {
        selectedUserRef.current = selectedUser;
        if (selectedUser) {
            const fetchHistory = async () => {
                try {
                    const history = await chatService.getHistory(selectedUser.email);
                    setMessages(history);
                    if (history.length > 0) {
                        currentConversationIdRef.current = history[0].conversationId;
                        setCurrentConversationId(history[0].conversationId);
                        setLastByUser((m) => ({ ...m, [selectedUser.email]: history[history.length - 1] }));
                    } else {
                        currentConversationIdRef.current = null;
                        setCurrentConversationId(null);
                        setLastByUser((m) => ({ ...m, [selectedUser.email]: null }));
                    }
                } catch (err) {
                    console.error("Failed to fetch history", err);
                }
            };
            fetchHistory();
            if (isMobile) setShowSidebar(false);
        }
    }, [selectedUser, isMobile]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const totalUnread = useMemo(() => Object.values(unreadCounts || {}).reduce((a, b) => a + (b || 0), 0), [unreadCounts]);
    useEffect(() => {
        if (totalUnread > 0) {
            setEmotion('curious', 3000);
            showBubble(`You have ${totalUnread} unread 💬`);
        }
    }, [totalUnread, setEmotion, showBubble]);

    const sendMessage = async ({ content = null, file = null } = {}) => {
        if (!selectedUser) return;
        const textContent = content || input.trim();
        if (!textContent && !file) return;

        try {
            const saved = await chatService.sendMessage({
                receiverEmail: selectedUser.email,
                content: textContent || "",
                file
            });
            setMessages((prev) => [...prev, saved]);
            currentConversationIdRef.current = saved.conversationId;
            setCurrentConversationId(saved.conversationId);
            if (!file) setInput('');
            setIsEmojiOpen(false);
            setSendError('');
            if (Math.random() < 0.25) { 
                setEmotion('thumbsup', 2000) 
            }
        } catch (err) {
            if (err?.response?.status === 403) {
                setSendError(err?.response?.data?.error || "Follow this account to message.");
            } else if (err?.response?.status === 404) {
                setSendError("User not available.");
            } else {
                setSendError("Message failed.");
            }
        }
    };

    const onInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        if (stompClient && selectedUser) {
            const payload = { sender: myEmail, receiver: selectedUser.email };
            stompClient.send("/app/chat.typing", {}, JSON.stringify(payload));
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await sendMessage({ file });
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setSendError('');
        markAsRead(user.email);
    };

    // emoji list handled by EmojiPicker

    const LinkPreview = ({ content }) => {
        const [meta, setMeta] = useState(null);
        useEffect(() => {
            const m = content?.match(/\/(post|story)\/(\d+)/);
            if (!m) return;
            const [, type, id] = m;
            let active = true;
            const load = async () => {
                try {
                    if (type === 'post') {
                        const p = await postService.getPostById(id);
                        if (!active) return;
                        setMeta({ type, id, title: p.user?.username || 'Post', img: mediaUrl(p.mediaUrl), subtitle: p.content || '' });
                    } else {
                        const s = await storyService.getById(id);
                        if (!active) return;
                        setMeta({ type, id, title: s.user?.username || 'Story', img: mediaUrl(s.mediaUrl), subtitle: s.caption || '' });
                    }
                } catch (e) { void e; }
            };
            load();
            return () => { active = false; };
        }, [content]);
        if (!meta) return null;
        return (
            <button onClick={() => window.location.href = `/${meta.type}/${meta.id}`} className="mt-2 w-60 text-left rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:bg-white/10 transition">
                {meta.img && <img src={meta.img} alt="preview" className="w-full h-36 object-cover" />}
                <div className="p-3">
                    <div className="text-sm font-bold text-white truncate">{meta.title}</div>
                    <div className="text-[11px] text-gray-400 truncate">{meta.subtitle}</div>
                </div>
            </button>
        );
    };

    const CallOverlay = ({ kind, onClose, onInvite, localStream }) => (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="relative w-[min(520px,92vw)] glass-card p-6 rounded-2xl border-white/10">
                <h3 className="text-lg font-black text-white mb-3">{kind === 'video' ? 'Video Call' : 'Voice Call'}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-video bg-black/60 rounded-xl border border-white/10 grid place-items-center overflow-hidden">
                        {kind === 'video' && localStream ? (
                            <video autoPlay muted playsInline ref={(el) => { if (el && localStream) el.srcObject = localStream; }} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-400 text-sm">Microphone ready</div>
                        )}
                    </div>
                    <div className="aspect-video bg-black/40 rounded-xl border border-white/10 grid place-items-center">
                        <div className="text-gray-500 text-sm">Waiting for {selectedUser?.username}…</div>
                    </div>
                </div>
                <div className="flex gap-3 mt-4">
                    <button onClick={onInvite} className="btn-gradient px-4 py-2 rounded-xl text-sm font-black">Send Invite</button>
                    <button onClick={onClose} className="px-4 py-2 rounded-xl glass text-sm font-black">Hang Up</button>
                </div>
            </div>
        </div>
    );

    const [callKind, setCallKind] = useState(null);
    const [localStream, setLocalStream] = useState(null);

    const startCall = async (kind) => {
        if (!selectedUser) return;
        try {
            if (kind === 'video') {
                const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
                setLocalStream(s);
            } else {
                const s = await navigator.mediaDevices.getUserMedia({ audio: true });
                setLocalStream(s);
            }
            setCallKind(kind);
        } catch {
            setSendError('Permission denied for camera/mic.');
        }
    };
    const closeCall = () => {
        setCallKind(null);
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            setLocalStream(null);
        }
    };
    const sendInvite = async () => {
        if (!selectedUser) return;
        const label = callKind === 'video' ? 'VIDEO_CALL' : 'VOICE_CALL';
        await chatService.sendMessage({ receiverEmail: selectedUser.email, content: `${label}: Invite` });
        setSendError('');
    };

    const { isRecording, audioURL, blob: audioBlob, start: startRec, stop: stopRec, reset: resetRec } = useVoiceRecorder();
    const sendAudio = async () => {
        if (!audioBlob) return;
        await sendMessage({ file: new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }) });
        resetRec();
    };

    const onReact = (emoji, msg) => {
        const id = msg.id || `${msg.createdAt}-${msg.senderEmail}-${msg.content || msg.mediaUrl || ''}`;
        const map = reactionsRef.current[id] || {};
        map[emoji] = (map[emoji] || 0) + 1;
        reactionsRef.current = { ...reactionsRef.current, [id]: map };
        setMessages((prev) => [...prev]);
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex gap-6 p-4">

            {/* User List Sidebar */}
            <div className={`w-80 glass-card rounded-3xl flex-col border-white/5 overflow-hidden ${isMobile ? (showSidebar ? 'flex' : 'hidden') : 'flex'}`} style={{ backgroundColor: '#0d0d14' }}>
                <div className="p-6 border-b border-white/5 bg-white/5">
                    <h2 className="text-xl font-black text-vibrant mb-4 uppercase tracking-tighter">Messages</h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search people..."
                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-5 text-sm outline-none focus:border-purple-500/50 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 thin-purple-scroll">
                    {users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).map(user => {
                        const last = lastByUser[user.email];
                        const preview = (() => {
                            if (!last) return <em className="text-gray-400 italic">Say hello! 👋</em>;
                            if (last.mediaUrl) {
                                const url = String(last.mediaUrl).toLowerCase();
                                if (/\.(mp4|webm|ogg)$/.test(url)) return "🎥 Video";
                                if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(url)) return "📷 Photo";
                                if (/\.(mp3|wav|ogg|webm)$/.test(url)) return "🎤 Voice message";
                            }
                            if (last.content && /\/post\/\d+/.test(last.content)) return "📎 Post";
                            return last.content || "";
                        })();
                        const ts = (() => {
                            if (!last?.createdAt) return "";
                            const d = new Date(last.createdAt);
                            const now = new Date();
                            const diff = (now - d) / 1000;
                            if (diff < 5) return "just now";
                            if (diff < 60) return `${Math.floor(diff)}s`;
                            const m = Math.floor(diff / 60);
                            if (m < 60) return `${m}m`;
                            const h = Math.floor(m / 60);
                            if (h < 24) return `${h}h`;
                            const day = Math.floor(h / 24);
                            if (day < 7) return d.toLocaleDateString([], { weekday: "short" });
                            return d.toLocaleDateString([], { month: "short", day: "numeric" });
                        })();
                        const active = selectedUser?.id === user.id;
                        const unreadCount = unreadCounts[user.email] || 0;
                        return (
                            <motion.button
                                key={user.id}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => handleUserSelect(user)}
                                className={`w-full h-[72px] px-4 rounded-2xl transition-all overflow-hidden ${active ? 'border-l-4 border-l-purple-500 bg-[rgba(124,58,237,0.15)]' : unreadCount ? 'bg-[rgba(124,58,237,0.08)]' : 'hover:bg-[rgba(124,58,237,0.1)]'}`}
                            >
                                <div className="flex items-center gap-4 w-full">
                                    <div className="relative shrink-0" style={{ paddingLeft: 4 }}>
                                        <img
                                            src={mediaUrl(user.profileImage) || `/placeholder-avatar.svg`}
                                            className="w-12 h-12 rounded-full object-cover"
                                            alt="u"
                                        />
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full shadow-lg animate-pulse" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className={`text-sm truncate ${unreadCount ? 'font-black text-white' : 'font-bold text-gray-400'}`}>{user.username}</div>
                                        <div className="text-[13px] text-gray-400 truncate">
                                            {preview}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-center gap-1 shrink-0">
                                        <div className="text-[11px] text-gray-400">{ts}</div>
                                        {unreadCount > 0 && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-5 h-5 rounded-full bg-vibrant-gradient grid place-items-center text-[10px] font-black text-white shadow-lg shadow-purple-500/20"
                                                title={`${unreadCount} unread`}
                                            >
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        )
                    })}
                </div>

                {/* Orbit Rooms Integrated Section */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Orbit Experience</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {(unreadCounts['orbit-invites'] > 0 || rooms.length > 0) && (
                                <button
                                    onClick={() => markAsRead('orbit-invites')}
                                    className="text-[8px] font-black text-white/20 hover:text-purple-400 uppercase tracking-widest transition-colors"
                                >
                                    Mark read
                                </button>
                            )}
                            <button onClick={() => setShowCreateRoom(true)} className="w-6 h-6 rounded-full bg-vibrant-gradient flex items-center justify-center text-white text-xs shadow-lg shadow-purple-500/20 hover:scale-110 transition-transform">＋</button>
                        </div>
                    </div>

                    {/* Pending Invites */}
                    <AnimatePresence>
                        {invites.map(invite => (
                            <motion.div
                                key={invite.roomId}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mb-2 p-2 glass-dark rounded-xl border border-purple-500/30 bg-purple-500/5 overflow-hidden"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-7 h-7 rounded-lg border border-white/10 overflow-hidden shrink-0">
                                        <img src={mediaUrl(invite.hostAvatar) || '/placeholder-avatar.svg'} className="w-full h-full object-cover" alt="h" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[8px] text-white/40 truncate font-black uppercase tracking-tighter"><span className="text-purple-400">{invite.hostUsername}</span> invited</div>
                                        <div className="text-[11px] font-black text-white truncate leading-none">{invite.roomName}</div>
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => { acceptInvite(invite.roomId, myEmail); loadRooms(); navigate(`/orbit/${invite.roomId}`); }}
                                        className="flex-1 py-1.5 rounded-lg bg-green-500/80 text-white text-[8px] font-black uppercase tracking-widest hover:bg-green-500 transition-colors"
                                    >Join</button>
                                    <button
                                        onClick={() => { declineInvite(invite.roomId, myEmail); loadRooms(); }}
                                        className="flex-1 py-1.5 rounded-lg bg-white/5 text-white/40 text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                                    >Decline</button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Room List */}
                    <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto thin-purple-scroll px-0.5">
                        {rooms.length === 0 && invites.length === 0 && (
                            <div className="text-center py-3 bg-white/5 rounded-xl border border-dashed border-white/5">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">No active Orbit Rooms</p>
                            </div>
                        )}
                        {rooms.map(room => (
                            <button
                                key={room.id}
                                onClick={() => navigate(`/orbit/${room.id}`)}
                                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-left group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-vibrant-gradient flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform shrink-0">
                                    {room.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-black text-white truncate group-hover:text-purple-400 transition-colors">{room.name}</div>
                                    <div className="text-[8px] text-white/30 font-black uppercase tracking-widest">
                                        {room.participants?.length || 0} participants
                                    </div>
                                </div>
                                {room.hostId === myEmail && <span className="text-[8px] opacity-40">👑</span>}
                            </button>
                        ))}
                    </div>

                    {/* Join by Code */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/20 group-focus-within:text-purple-500 transition-colors">
                            <Hash size={10} />
                        </div>
                        <input
                            type="text"
                            placeholder="JOIN BY CODE..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-[8px] font-black uppercase tracking-[0.2em] outline-none focus:border-purple-500/50 transition-all text-white placeholder-white/10"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && inviteCode) {
                                    const res = joinByCode(inviteCode, myEmail, { username: localStorage.getItem('username'), profileImage: localStorage.getItem('profileImage') });
                                    if (res.success) {
                                        loadRooms();
                                        navigate(`/orbit/${res.roomId}`);
                                    } else {
                                        addNotification({ text: res.error, type: 'error' });
                                    }
                                    setInviteCode('');
                                }
                            }}
                        />
                    </div>
                </div>

                <button
                    onClick={() => alert('Start new message')}
                    className="absolute right-6 bottom-6 w-12 h-12 rounded-full btn-gradient shadow-lg"
                    title="New Message"
                >＋</button>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 glass-card rounded-3xl flex flex-col border-white/5 overflow-hidden relative mr-[240px] ${isMobile ? (showSidebar ? 'hidden' : 'flex') : 'flex'}`} style={{ backgroundColor: '#080810' }}>
                <AnimatePresence mode='wait'>
                    {selectedUser ? (
                        <motion.div
                            key={selectedUser.id}
                            initial={{ opacity: 0, x: isMobile ? 40 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            {/* Chat Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-3xl z-10">
                                <div className="flex items-center gap-4">
                                    {isMobile && (
                                        <button onClick={() => setShowSidebar(true)} className="mr-2 w-10 h-10 rounded-full hover:bg-white/10">⬅️</button>
                                    )}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px]">
                                        <img
                                            src={mediaUrl(selectedUser.profileImage) || `https://xsgames.co/randomusers/assets/avatars/pixel/${selectedUser.id % 50}.jpg`}
                                            className="w-full h-full rounded-full object-cover border-2 border-black"
                                            alt="u"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-white">{selectedUser.username}</h3>
                                        <p className="text-[10px] text-green-400 font-black uppercase flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            Active now
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => startCall('audio')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition text-xl">📞</button>
                                    <button onClick={() => startCall('video')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition text-xl">📹</button>
                                    <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition text-xl">ℹ️</button>
                                </div>
                            </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-8 space-y-4 thin-purple-scroll">
                                        {messages.filter(m => {
                                            if (!selectedUser) return false;
                                            if (currentConversationId && m.conversationId !== currentConversationId) return false;
                                            return m.senderEmail === selectedUser.email || m.senderEmail === myEmail;
                                        }).map((msg, i, arr) => {
                                            const prev = arr[i - 1];
                                            const isMine = msg.senderEmail === myEmail;
                                            const showTail = !prev || prev.senderEmail !== msg.senderEmail;
                                            const id = msg.id || `${msg.createdAt}-${msg.senderEmail}-${msg.content || msg.mediaUrl || ''}`;
                                            const reacts = reactionsRef.current[id] || {};
                                            const status = isMine ? (msg.isRead ? 'seen' : 'sent') : undefined;
                                            return (
                                                <MessageBubble key={id} msg={msg} isMine={isMine} showTail={showTail} onReact={onReact} reactions={reacts} status={status}>
                                                    {msg.mediaUrl ? (
                                                        <div className="space-y-2">
                                                            {msg.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                                                <video muted controls className="max-w-xs rounded-xl shadow-lg border border-white/10 overflow-hidden">
                                                                    <source src={mediaUrl(msg.mediaUrl)} />
                                                                </video>
                                                            ) : (
                                                                <img src={mediaUrl(msg.mediaUrl)} className="max-w-xs rounded-xl shadow-lg border border-white/10 object-cover" alt="sent" />
                                                            )}
                                                            {msg.content && <div className="text-sm mt-1">{msg.content}</div>}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            {msg.content?.startsWith('http') && (msg.content.includes('giphy.com') || msg.content.includes('tenor.com')) ? (
                                                                <img src={msg.content} className="max-w-xs rounded-xl shadow-lg border border-white/10" alt="gif" />
                                                            ) : (
                                                                <div>
                                                                    <div>{msg.content}</div>
                                                                    <LinkPreview content={msg.content} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </MessageBubble>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                            {/* Input Area */}
                            <div className="p-6 bg-zinc-900/50 backdrop-blur-3xl border-t border-white/5 relative">
                                <AnimatePresence>
                                    {isEmojiOpen && (
                                        <EmojiPicker
                                            onPick={(e) => { setInput(prev => prev + e); }}
                                            onClose={() => setIsEmojiOpen(false)}
                                        />
                                    )}
                                    {isGifOpen && (
                                        <GifPicker
                                            onPick={(url) => {
                                                sendMessage({ content: url });
                                                setIsGifOpen(false);
                                            }}
                                            onClose={() => setIsGifOpen(false)}
                                        />
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center gap-4 max-w-4xl mx-auto relative h-16">
                                    {isTyping && (
                                        <div className="absolute -top-6 left-0 text-[10px] text-gray-400 font-black uppercase tracking-widest">Typing...</div>
                                    )}
                                    {sendError && (
                                        <div className="absolute -top-6 right-0 text-[10px] text-red-400 font-black uppercase tracking-widest">{sendError}</div>
                                    )}
                                    <div className="flex gap-2">
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} multiple />
                                        <button
                                            onClick={() => setCameraOpen(true)}
                                            className="text-xl hover:scale-110 transition bg-white/5 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 hover:border-white/30"
                                            title="Camera"
                                        >
                                            📷
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xl hover:scale-110 transition bg-white/5 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 hover:border-white/30"
                                            title="Upload Media"
                                        >
                                            🖼️
                                        </button>
                                        <button
                                            onClick={() => setIsGifOpen(!isGifOpen)}
                                            className={`text-xl hover:scale-110 transition w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isGifOpen ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/10'}`}
                                            title="GIFs"
                                        >
                                            👾
                                        </button>
                                        <button
                                            onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                                            className={`text-xl hover:scale-110 transition w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isEmojiOpen ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/10'}`}
                                            title="Emojis"
                                        >
                                            😊
                                        </button>
                                    </div>

                                    <div className="relative flex-1 group">
                                        <input
                                            type="text"
                                            placeholder={`Message ${selectedUser.username}...`}
                                            className="w-full bg-black/40 border border-white/10 rounded-full py-4 px-8 text-sm outline-none focus:border-purple-500/50 transition-all font-medium pr-16"
                                            value={input}
                                            onChange={onInputChange}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            onFocus={() => {
                                                if (selectedUser) {
                                                    setEmotion('peek', 0);
                                                    showBubble(`Secret messages for ${selectedUser.username}? 🤐`, 2000);
                                                }
                                            }}
                                            onBlur={() => setEmotion('neutral', 1000)}
                                        />
                                        {!isRecording ? (
                                            <button
                                                onMouseDown={async () => { try { await startRec(); } catch { /* ignore */ } }}
                                                onMouseUp={stopRec}
                                                onTouchStart={async () => { try { await startRec(); } catch { /* ignore */ } }}
                                                onTouchEnd={stopRec}
                                                className="absolute right-6 top-1/2 -translate-y-1/2 text-lg opacity-60 hover:opacity-100 transition"
                                                title="Hold to Record"
                                            >🎤</button>
                                        ) : (
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-red-400 font-black">REC</span>
                                        )}
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: -10 }}
                                        whileTap={{ scale: 0.9, rotate: 10 }}
                                        onClick={() => sendMessage()}
                                        className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-[length:200%_auto] animate-gradient-slow flex items-center justify-center shadow-lg shadow-purple-500/20 text-xl"
                                    >
                                        ✈️
                                    </motion.button>
                                </div>
                                {audioURL && (
                                    <div className="max-w-4xl mx-auto mt-3 px-4">
                                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                                            <audio src={audioURL} controls className="flex-1" />
                                            <button onClick={resetRec} className="px-3 py-1 rounded bg-white/10">Delete</button>
                                            <button onClick={sendAudio} className="px-3 py-1 rounded btn-gradient">Send</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-8">
                            <motion.div
                                animate={{
                                    y: [0, -20, 0],
                                    rotate: [0, 5, -5, 0],
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="text-9xl mb-4 drop-shadow-[0_0_50px_rgba(168,85,247,0.3)]"
                            >
                                💬
                            </motion.div>
                            <div>
                                <h1 className="text-6xl font-black text-vibrant uppercase tracking-tightest mb-4">Direct Messaging</h1>
                                <p className="text-gray-500 max-w-sm font-medium mx-auto leading-relaxed">Connect, share, and vibe in high fidelity. Premium messaging for the next generation.</p>
                            </div>
                            <button className="px-10 py-4 bg-white text-black font-black rounded-full hover:scale-110 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] tracking-widest text-xs">
                                START NEW CHAT
                            </button>
                        </div>
                    )}
                </AnimatePresence>
            </div>
            <CreateOrbitRoomModal open={showCreateRoom} onClose={() => { setShowCreateRoom(false); loadRooms(); }} />
            {callKind && (
                <CallOverlay
                    kind={callKind === 'video' ? 'video' : 'audio'}
                    localStream={localStream}
                    onClose={closeCall}
                    onInvite={sendInvite}
                />
            )}
            <CameraModal
                open={cameraOpen}
                onClose={() => setCameraOpen(false)}
                onCapture={async (blob) => {
                    setCameraOpen(false);
                    await sendMessage({ file: new File([blob], `capture-${Date.now()}.${blob.type.includes('video') ? 'webm' : 'png'}`, { type: blob.type }) });
                }}
            />
        </div>
    );
}

export default Chat;
