import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from '../lib/config';

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    const handleClick = async (n) => {
        // Mark as read
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/notifications/${n.id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state to show as read
            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
        } catch (e) {
            console.error(e);
        }

        // Navigate
        if (n.type === 'FOLLOW' && n.senderId) {
            navigate(`/profile/${n.senderId}`);
        } else if ((n.type === 'LIKE' || n.type === 'COMMENT') && n.postId) {
            navigate(`/post/${n.postId}`);
        } else if (n.type === 'MESSAGE') {
            navigate('/chat');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Loading Notifications...</p>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto py-12 px-6">
            <div className="flex items-center gap-6 mb-12">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="w-12 h-12 glass rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => navigate(-1)}
                >
                    <span className="text-xl">⬅️</span>
                </motion.div>
                <div>
                    <h1 className="text-4xl font-black text-vibrant uppercase tracking-tightest">Notifications</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Stay updated</p>
                </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {notifications.length > 0 ? (
                        notifications.map((n, idx) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => handleClick(n)}
                                className={`p-5 rounded-[2rem] border flex items-center gap-5 cursor-pointer relative overflow-hidden group transition-all ${n.read ? 'bg-white/5 border-white/5' : 'glass-card border-purple-500/30 bg-purple-500/5'}`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r ${n.read ? 'from-white/0 to-white/0' : 'from-purple-600/10 to-blue-600/10'} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-blue-500 p-[2px] flex-shrink-0">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xl shadow-inner">
                                        {n.type === 'LIKE' ? '❤️' : n.type === 'FOLLOW' ? '👤' : n.type === 'MESSAGE' ? '💬' : '🔔'}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-sm text-white truncate">
                                        {n.senderEmail ? n.senderEmail.split('@')[0] : "Someone"}
                                    </h4>
                                    <p className="text-[11px] text-gray-400 font-medium leading-tight mt-1">
                                        {n.type === 'LIKE' ? 'liked your post' :
                                            n.type === 'FOLLOW' ? 'started following you' :
                                                n.type === 'MESSAGE' ? 'sent you a message' :
                                                    'interacted with you'}
                                    </p>
                                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2">
                                        {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                
                                {!n.read && (
                                    <div className="w-2 h-2 bg-vibrant rounded-full shadow-[0_0_10px_#A855F7]" />
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 glass rounded-[3rem] border-white/5"
                        >
                            <span className="text-5xl block mb-6 opacity-30">🔕</span>
                            <p className="text-gray-500 font-black text-sm uppercase tracking-widest">No notifications yet</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default Notifications;
