import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { userService, searchService } from "../services/api";
import { useCharacter } from "../context/CharacterContext";

function Search() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [recentSearches, setRecentSearches] = useState([]);

    const { setEmotion, showBubble } = useCharacter();

    useEffect(() => {
        setEmotion('curious', 3000) 
        showBubble('So much to discover 🌍') 
    }, [setEmotion, showBubble]);

    const fetchRecentSearches = useCallback(async () => {
        try {
            const data = await userService.getRecentSearches();
            setRecentSearches(data);
        } catch (err) {
            console.error("Failed to fetch recent searches", err);
        }
    }, []);

    const handleSearch = useCallback(async () => {
        setLoading(true);
        try {
            if (query.startsWith('#')) {
                const posts = await searchService.postsByHashtag(query);
                setResults(posts.map(p => ({
                    id: p.id,
                    username: p.authorEmail,
                    bio: p.content,
                    profileImage: null
                })));
            } else {
                const data = await userService.searchUsers(query);
                setResults(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        if (!query) {
            fetchRecentSearches();
        }
    }, [query, fetchRecentSearches]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    const handleUserClick = async (user) => {
        try {
            await userService.logSearchHistory(user.id);
        } catch (err) {
            console.error("Failed to log search", err);
        }
        navigate(`/profile/${user.id}`);
    };

    const handleFollowToggle = async (e, user) => {
        e.stopPropagation(); // prevent navigation
        try {
            if (user.following) {
                await userService.unfollowUser(user.id);
            } else {
                await userService.followUser(user.id);
            }
            // Re-fetch search results to update UI state
            if (query) handleSearch();
            else fetchRecentSearches();
        } catch (err) {
            console.error("Follow action failed", err);
        }
    };

    const handleRemoveRecent = async (e, userId) => {
        e.stopPropagation();
        try {
            await userService.deleteRecentSearch(userId);
            setRecentSearches((prev) => prev.filter((u) => u.id !== userId));
        } catch (err) {
            console.error("Failed to remove recent search", err);
        }
    };

    const handleClearRecent = async () => {
        try {
            await userService.clearRecentSearches();
            setRecentSearches([]);
        } catch (err) {
            console.error("Failed to clear recent searches", err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">

            {/* Search Header */}
            <div className="text-center mb-16">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-black text-vibrant mb-4 tracking-tightest uppercase"
                >
                    Explore
                </motion.h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Find people and accounts on ConnectHub</p>
            </div>

            {/* Search Input */}
            <div className="relative mb-16">
                <div className="absolute inset-0 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search username..."
                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-10 py-8 text-xl font-bold outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all shadow-2xl backdrop-blur-xl caret-purple-500"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
                    {loading && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                        />
                    )}
                    <span className="text-3xl opacity-30">🔍</span>
                </div>
            </div>

            {/* Recent Searches Header */}
            {!query && recentSearches.length > 0 && (
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6 px-4">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Recent Searches</h2>
                        <button
                            onClick={handleClearRecent}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {recentSearches.map((user, idx) => (
                            <motion.div
                                key={`recent-${user.id}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => handleUserClick(user)}
                                className="glass-card p-5 rounded-[2rem] border-white/5 flex items-center gap-5 group hover:border-vibrant/40 transition-all cursor-pointer"
                            >
                                <img
                                    src={user.profileImage ? `http://localhost:62223${user.profileImage}` : `/placeholder-avatar.svg`}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-black group-hover:border-vibrant transition-colors"
                                    alt="u"
                                />
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="text-sm font-black text-white truncate">{user.username}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">View Profile</p>
                                </div>
                                <button
                                    onClick={(e) => handleRemoveRecent(e, user.id)}
                                    className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-400 transition px-3 py-2 rounded-full bg-white/5 hover:bg-white/10"
                                >
                                    Remove
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Region */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading && Array.from({ length: 6 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="glass-card p-6 rounded-[2rem] border-white/10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-white/10 skeleton" />
                            <div className="flex-1">
                                <div className="h-3 w-40 bg-white/10 rounded skeleton" />
                                <div className="h-3 w-24 mt-3 bg-white/10 rounded skeleton" />
                            </div>
                        </div>
                    </div>
                ))}
                <AnimatePresence>
                    {results.map((user, idx) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => handleUserClick(user)}
                            className="glass-card p-6 rounded-[2rem] border-white/10 flex items-center gap-6 group hover:border-purple-500/30 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px] flex-shrink-0">
                                <img
                                    src={user.profileImage ? `http://localhost:62223${user.profileImage}` : `/placeholder-avatar.svg`}
                                    className="w-full h-full rounded-full object-cover border-4 border-black font-black"
                                    alt="u"
                                />
                            </div>

                            <div className="relative flex-1 min-w-0">
                                <h3 className="text-xl font-black text-white truncate">{user.username}</h3>
                                <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-1">{user.bio || "No bio available"}</p>
                                <div className="mt-4 flex gap-3">
                                    <button className="flex-1 px-4 py-2 bg-white text-black text-[10px] font-black rounded-full hover:bg-gray-200 transition uppercase">View</button>
                                    <button
                                        onClick={(e) => handleFollowToggle(e, user)}
                                        className={`px-6 py-2 rounded-full text-[10px] font-black transition-all border ${user.following
                                            ? 'bg-zinc-800 text-white border-white/10 hover:bg-zinc-700'
                                            : 'bg-white text-black border-white hover:bg-gray-100'
                                            } uppercase`}
                                    >
                                        {user.following ? "Following" : "Follow"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!loading && query && results.length === 0 && (
                    <div className="col-span-full text-center py-20">
                        <p className="text-gray-600 font-black text-xl italic uppercase">"No souls found in this orbit"</p>
                        <p className="text-gray-700 text-sm mt-2 font-bold">Try a different username</p>
                    </div>
                )}
            </div>

        </div>
    );
}

export default Search;
