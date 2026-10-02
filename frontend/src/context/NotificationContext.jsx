import React, { createContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import NotificationBubble from '../components/shared/NotificationBubble';
import { WS_URL, mediaUrl } from '../lib/config';

const NotificationContext = createContext();
export default NotificationContext;

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState(() => {
        const saved = localStorage.getItem('ch_unread_counts');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('ch_unread_counts', JSON.stringify(unreadCounts));
    }, [unreadCounts]);
    const [askPermission, setAskPermission] = useState(false);
    const myEmail = localStorage.getItem('userEmail');
    const navigate = useNavigate();
    const location = useLocation();

    // Global total unread messages
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

    const addNotification = useCallback((notif) => {
        const id = Date.now();
        setNotifications((prev) => {
            // Check if same sender/source notification exists
            const existingIdx = prev.findIndex(n => n.senderEmail === notif.senderEmail || n.roomId === notif.roomId);
            if (existingIdx !== -1) {
                const updated = [...prev];
                updated[existingIdx] = {
                    ...updated[existingIdx],
                    ...notif,
                    count: (updated[existingIdx].count || 1) + 1,
                    id // update id to restart animation/timer
                };
                return updated;
            }
            return [{ ...notif, id, count: 1 }, ...prev].slice(0, 3);
        });

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 4000);
    }, []);

    const dismissNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const markAsRead = useCallback((convId) => {
        setUnreadCounts(prev => {
            const next = { ...prev };
            delete next[convId];
            return next;
        });
    }, []);

    useEffect(() => {
        if (!myEmail) return;

        const socket = new SockJS(WS_URL);
        const client = Stomp.over(socket);
        const token = localStorage.getItem('token');

        client.debug = null;

        let connected = false;
        client.connect({ Authorization: `Bearer ${token}` }, () => {
            connected = true;

            // Subscribe to message notifications (using the same queue or a specific one)
            client.subscribe(`/user/queue/messages`, (msg) => {
                const receivedMsg = JSON.parse(msg.body);
                if (receivedMsg.senderEmail === myEmail) return;

                // Only show toast if NOT on the chat page with this user
                const isChatPage = location.pathname === '/chat';
                // (Note: we'd ideally check if the specific user is selected on chat page)

                if (!isChatPage) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [receivedMsg.senderEmail]: (prev[receivedMsg.senderEmail] || 0) + 1
                    }));

                    addNotification({
                        senderEmail: receivedMsg.senderEmail,
                        username: receivedMsg.senderUsername,
                        avatar: receivedMsg.senderAvatar,
                        text: receivedMsg.content,
                        type: 'message'
                    });
                }
            });

            // Subscribe to room invites
            client.subscribe(`/user/queue/orbit-invites`, (msg) => {
                const invite = JSON.parse(msg.body);
                addNotification({
                    roomId: invite.roomId,
                    username: `${invite.hostUsername} invited you`,
                    text: `to ${invite.roomName} — 2h left`,
                    avatar: invite.hostAvatar,
                    type: 'orbit-invite'
                });
            });
        });

        return () => {
            if (connected && client) {
                try {
                    client.disconnect();
                } catch (e) {
                    console.error("Disconnect failed", e);
                }
            }
        };
    }, [myEmail, location.pathname, addNotification]);

    useEffect(() => {
        const checkPermission = () => {
            if (typeof Notification === 'undefined') return;
            const now = Date.now();
            const lastReminded = parseInt(localStorage.getItem('lastPermissionReminder') || '0');
            const cooldown = 24 * 60 * 60 * 1000;
            if (Notification.permission === 'granted') return;
            if (Notification.permission === 'default' || (Notification.permission === 'denied' && now - lastReminded > cooldown)) {
                setAskPermission(true);
            }
        };
        const raf = requestAnimationFrame(checkPermission);
        return () => cancelAnimationFrame(raf);
    }, []);

    const requestSystemPermission = async () => {
        try {
            await Notification.requestPermission();
            localStorage.setItem('lastPermissionReminder', Date.now().toString());
            setAskPermission(false);
        } catch {
            setAskPermission(false);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, dismissNotification, unreadCounts, totalUnread, markAsRead }}>
            {children}
            <NotificationBubble notifications={notifications} onDismiss={dismissNotification} />
            <AnimatePresence>
                {askPermission && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1001] w-[min(560px,92vw)] glass p-4 rounded-2xl border-white/10 flex items-center gap-3 shadow-2xl"
                    >
                        <div className="text-xl">🔔</div>
                        <div className="flex-1">
                            <div className="text-white font-bold text-sm">
                                {Notification.permission === 'denied' ? 'Notifications Disabled' : 'Enable Notifications'}
                            </div>
                            <div className="text-[11px] text-gray-400">
                                {Notification.permission === 'denied'
                                    ? 'Please enable them in your browser settings to stay updated.'
                                    : 'Get real-time alerts for likes, comments, and messages.'}
                            </div>
                        </div>
                        {Notification.permission !== 'denied' && (
                            <button onClick={requestSystemPermission} className="btn-gradient px-4 py-2 rounded-xl text-sm font-black">Allow</button>
                        )}
                        <button onClick={() => {
                            localStorage.setItem('lastPermissionReminder', Date.now().toString());
                            setAskPermission(false);
                        }} className="px-3 py-2 rounded-xl text-sm hover:bg-white/5 transition">
                            {Notification.permission === 'denied' ? 'Okay' : 'Later'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="fixed bottom-8 right-8 z-[1000] flex flex-col gap-4 pointer-events-none max-w-sm w-full">
                <AnimatePresence>
                    {notifications.map((n) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.9, x: 50 }}
                            onClick={() => {
                                if (n.type === 'FOLLOW' && n.senderId) {
                                    navigate(`/profile/${n.senderId}`);
                                } else if ((n.type === 'LIKE' || n.type === 'COMMENT') && n.postId) {
                                    navigate(`/post/${n.postId}`);
                                } else if (n.type === 'MESSAGE') {
                                    navigate('/chat');
                                }
                                setNotifications(prev => prev.filter(item => item.id !== n.id));
                            }}
                            className="pointer-events-auto w-full glass-vibrant p-5 rounded-[1.5rem] border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 bg-black/60 backdrop-blur-3xl overflow-hidden group relative cursor-pointer hover:scale-105 transition-transform"
                        >
                            {/* Animated Background Pulse */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-blue-500 p-[2px] flex-shrink-0">
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xl shadow-inner">
                                    {n.type === 'LIKE' ? '❤️' : n.type === 'FOLLOW' ? '👤' : '💬'}
                                </div>
                            </div>

                            <div className="relative flex-1 min-w-0">
                                <h4 className="font-black text-sm text-white truncate">
                                    {n.senderEmail?.split('@')[0] || "Someone"}
                                </h4>
                                <p className="text-[11px] text-gray-300 font-medium leading-tight">
                                    {n.type === 'LIKE' ? 'liked your post' :
                                        n.type === 'FOLLOW' ? 'started following you' :
                                            'sent you a message'}
                                </p>
                            </div>

                            <button
                                onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                                className="relative text-gray-500 hover:text-white transition p-2"
                            >
                                ✕
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};
