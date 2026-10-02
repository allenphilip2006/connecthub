import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { userService } from "../services/api";
import { useNavigate } from "react-router-dom";
import { mediaUrl } from '../lib/config';

function FollowRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const data = await userService.getPendingRequests();
            setRequests(data);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAccept = async (id) => {
        try {
            await userService.acceptFollowRequest(id);
            setRequests(requests.filter(req => req.id !== id));
        } catch (err) {
            console.error("Failed to accept request", err);
        }
    };

    const handleReject = async (id) => {
        try {
            await userService.rejectFollowRequest(id);
            setRequests(requests.filter(req => req.id !== id));
        } catch (err) {
            console.error("Failed to reject request", err);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Loading Requests...</p>
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
                    <h1 className="text-4xl font-black text-vibrant uppercase tracking-tightest">Follow Requests</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Manage who can follow you</p>
                </div>
            </div>

            <div className="space-y-6">
                <AnimatePresence>
                    {requests.length > 0 ? (
                        requests.map((user, idx) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass-card p-6 rounded-[2.5rem] border-white/10 flex items-center gap-6 group hover:border-purple-500/30 transition-all relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <img
                                    src={mediaUrl(user.profileImage) || `/placeholder-avatar.svg`}
                                    className="w-16 h-16 rounded-full object-cover border-4 border-black"
                                    alt="u"
                                    onClick={() => navigate(`/profile/${user.id}`)}
                                />

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-white truncate text-lg">{user.username}</h3>
                                    <p className="text-xs text-gray-400 font-medium truncate uppercase tracking-widest">Wants to follow you</p>
                                </div>

                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAccept(user.id)}
                                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20"
                                    >
                                        Confirm
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleReject(user.id)}
                                        className="px-6 py-2.5 glass rounded-full text-[10px] font-black uppercase tracking-widest border-white/10 hover:border-red-500/30 transition-all"
                                    >
                                        Delete
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 glass rounded-[3rem] border-white/5"
                        >
                            <span className="text-5xl block mb-6 opacity-30">🔔</span>
                            <p className="text-gray-500 font-black text-sm uppercase tracking-widest">No pending requests</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default FollowRequests;
