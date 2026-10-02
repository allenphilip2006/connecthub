import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../services/api';
import { mediaUrl } from '../lib/config';

const RecipientSelector = ({ isOpen, onClose, onSelectRecipients }) => {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const myEmail = localStorage.getItem('userEmail');

    useEffect(() => {
        if (isOpen) {
            userService.getAllUsers()
                .then((data) => {
                    const filtered = data.filter(u => u.email !== myEmail);
                    setUsers(filtered);
                })
                .catch((err) => {
                    console.error("Failed to fetch users", err);
                });
        }
    }, [isOpen, myEmail]);

    const handleSelectUser = (user) => {
        setSelectedRecipients((prev) =>
            prev.some((r) => r.id === user.id)
                ? prev.filter((r) => r.id !== user.id)
                : [...prev, user]
        );
    };

    const handleSend = () => {
        onSelectRecipients(selectedRecipients);
        onClose();
    };

    if (!isOpen) return null;

    const filteredUsers = users.filter(u =>
        (u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-6"
                >
                    <div className="absolute inset-0 bg-black/70" onClick={onClose} />
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md glass-card rounded-[2rem] border-white/10 p-6 flex flex-col max-h-[90vh]"
                    >
                        <h3 className="text-lg font-black text-white mb-4">Select Recipients</h3>
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none mb-4"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                                        selectedRecipients.some((r) => r.id === user.id) ? 'bg-purple-600/30' : 'hover:bg-white/10'
                                    }`}
                                    onClick={() => handleSelectUser(user)}
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={mediaUrl(user.profileImage)}
                                            alt={user.username}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <span className="text-white font-medium">{user.username}</span>
                                    </div>
                                    {selectedRecipients.some((r) => r.id === user.id) && (
                                        <span className="text-purple-400">✓</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={selectedRecipients.length === 0}
                            className="px-6 py-3 bg-white text-black rounded-xl text-sm font-black disabled:opacity-50"
                        >
                            Send ({selectedRecipients.length})
                        </button>
                        <button onClick={onClose} className="mt-2 px-6 py-3 bg-white/10 text-white rounded-xl text-sm font-black">
                            Cancel
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RecipientSelector;
