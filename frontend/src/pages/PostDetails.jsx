import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { postService, userService } from "../services/api";
import CommentSection from "../components/CommentSection";
import { useCharacter } from "../context/CharacterContext";
import { API_URL, mediaUrl } from '../lib/config';

function PostDetails() {
    const { id } = useParams();
    const navigate = useNavigate(); 
    const { setEmotion, showBubble } = useCharacter();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSaved, setIsSaved] = useState(false);
    const [currentEmail, setCurrentEmail] = useState("");
    const [sharing, setSharing] = useState(false);
    const [shareUsers, setShareUsers] = useState([]);
    const [shareLoading, setShareLoading] = useState(false);
    const [shareError, setShareError] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);

    useEffect(() => {
        let active = true;
        const fetchPost = async () => {
            setLoading(true);
            setError("");
            try {
                const [postData, profileData, savedPosts] = await Promise.all([
                    postService.getPostById(id),
                    userService.getProfile(),
                    postService.getSaved()
                ]);
                if (!active) return;
                setPost(postData);
                setCurrentEmail(profileData.email || "");
                const savedIds = new Set((savedPosts || []).map((p) => p.id));
                setIsSaved(savedIds.has(postData.id));
            } catch (err) {
                if (!active) return;
                if (err?.response?.status === 403) {
                    setError("This post is private.");
                } else if (err?.response?.status === 404) {
                    setError("Post not found.");
                } else {
                    setError("Failed to load post.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchPost();
        return () => {
            active = false;
        };
    }, [id]);

    const handleLike = async () => {
        if (!post) return;
        try {
            const isLikedBefore = post.isLiked;
            const response = await postService.toggleLike(post.id);
            setPost((prev) => prev ? { ...prev, likesCount: response.likes, isLiked: !prev.isLiked } : prev);
            
            if (!isLikedBefore) {
                setEmotion('happy', 2000);
                showBubble('Aww so sweet! ❤️', 2000);
            } else {
                setEmotion('sad', 1500);
                showBubble('Changed your mind? 😅', 1500);
            }
        } catch {
            setError("Like failed.");
        }
    };

    const handleSave = async () => {
        if (!post) return;
        try {
            if (isSaved) {
                await postService.unsavePost(post.id);
            } else {
                await postService.savePost(post.id);
                setEmotion('thumbsup', 2000);
                showBubble('Saved for later! 🔖', 1500);
            }
            setIsSaved((prev) => !prev);
        } catch {
            setError("Save failed.");
        }
    };

    const handleRepost = async () => {
        if (!post) return;
        try {
            await postService.repost(post.id, null);
            setEmotion('excited', 2500);
            showBubble('Sharing is caring! 🔗', 2000);
        } catch {
            setError("Repost failed.");
        }
    };

    const openShare = async () => {
        setSharing(true);
        setShareError("");
        if (shareUsers.length > 0) return;
        setShareLoading(true);
        try {
            const users = await userService.getAllUsers();
            setShareUsers(users);
        } catch {
            setShareError("Failed to load users.");
        } finally {
            setShareLoading(false);
        }
    };

    const handleShareToUser = async (user) => {
        if (!post) return;
        try {
            const link = `/post/${post.id}`;
            await fetch(`${API_URL}/chat/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({ receiverEmail: user.email, link })
            });
            setSharing(false);
        } catch {
            setShareError("Failed to send post.");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Loading Post...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-6">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 px-4 py-2 glass rounded-full text-[10px] font-black uppercase tracking-widest"
                >
                    Back
                </button>
                <div className="glass-card p-8 rounded-[2rem] border-white/10 text-center">
                    <p className="text-red-400 text-sm font-black uppercase tracking-widest">{error}</p>
                </div>
            </div>
        );
    }

    if (!post) return null;

    const isVideo = post.mediaUrl && post.mediaUrl.match(/\.(mp4|webm|ogg)$/i);

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="flex items-center gap-4 mb-8">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 glass rounded-2xl flex items-center justify-center"
                >
                    <span className="text-xl">⬅️</span>
                </motion.button>
                <div>
                    <h1 className="text-3xl font-black text-vibrant uppercase tracking-tightest">Post</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Full details</p>
                </div>
            </div>

            <div className="glass-card rounded-[2.5rem] p-6 border-white/10 overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px]">
                        <img
                            src={mediaUrl(post.user?.profileImage) || `/placeholder-avatar.svg`}
                            className="w-full h-full rounded-full object-cover border-2 border-black"
                            alt="p"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <button
                            onClick={() => post.user?.id ? navigate(`/profile/${post.user.id}`) : null}
                            className="text-left"
                        >
                            <span className="font-black text-white text-sm tracking-tight">
                                {post.user?.username || post.authorEmail?.split("@")[0] || "User"}
                            </span>
                        </button>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                            {post.repostedFromEmail ? "Repost" : "Post"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleLike} className={`text-2xl transition ${post.isLiked ? "text-red-500" : "text-white"}`}>
                            {post.isLiked ? "❤️" : "♡"}
                        </button>
                        <button onClick={handleRepost} className="text-2xl transition text-white">✈️</button>
                        <button onClick={handleSave} className={`text-2xl transition ${isSaved ? "text-yellow-400" : "text-white"}`}>🔖</button>
                        <button onClick={openShare} className="text-2xl transition text-white">📤</button>
                        {currentEmail === post.authorEmail && (
                            <button onClick={() => setSettingsOpen(!settingsOpen)} className="text-2xl transition text-white">⚙️</button>
                        )}
                        {currentEmail === post.authorEmail && (
                            <button
                                onClick={async () => {
                                    try {
                                        await postService.deletePost(post.id);
                                        navigate(-1);
                                    } catch {
                                        setError("Delete failed.");
                                    }
                                }}
                                className="text-2xl transition text-red-400"
                                title="Delete"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl overflow-hidden mb-6 bg-zinc-900/50">
                    {post.mediaUrl ? (
                        isVideo ? (
                            <video controls className="w-full max-h-[520px] object-contain bg-black">
                                <source src={mediaUrl(post.mediaUrl)} />
                            </video>
                        ) : (
                            <img
                                src={mediaUrl(post.mediaUrl)}
                                className="w-full max-h-[520px] object-contain"
                                alt="post"
                            />
                        )
                    ) : (
                        <div className="p-12 text-center">
                            <span className="text-6xl">✨</span>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="font-black text-sm text-white">{post.user?.username || post.authorEmail?.split("@")[0] || "User"}</span>
                        <span className="text-gray-300 text-sm">{post.content}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm font-black text-white">
                        <span>❤️ {post.likesCount || 0}</span>
                        <span>💬 {post.commentsCount || 0}</span>
                    </div>
                </div>

                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-6"
                    >
                        <CommentSection postId={post.id} currentEmail={currentEmail} />
                    </motion.div>
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {sharing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center p-6"
                    >
                        <div
                            className="absolute inset-0 bg-black/70"
                            onClick={() => setSharing(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md glass-card rounded-[2rem] border-white/10 p-6 max-h-[70vh] overflow-hidden flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-black text-white">Send to...</h3>
                                <button onClick={() => setSharing(false)} className="text-xl text-gray-400 hover:text-white">✕</button>
                            </div>
                            {shareLoading && (
                                <div className="flex items-center justify-center py-6">
                                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {shareError && (
                                <p className="text-xs text-red-400 font-bold text-center">{shareError}</p>
                            )}
                            <div className="flex-1 overflow-y-auto space-y-2 mt-2">
                                {shareUsers.map((u) => (
                                    <button
                                        key={u.id}
                                        onClick={() => handleShareToUser(u)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 text-left"
                                    >
                                        <img
                                            src={mediaUrl(u.profileImage) || `/placeholder-avatar.svg`}
                                            className="w-8 h-8 rounded-full object-cover border border-black"
                                            alt="u"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-white truncate">{u.username}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{u.email}</p>
                                        </div>
                                    </button>
                                ))}
                                {(!shareLoading && shareUsers.length === 0 && !shareError) && (
                                    <p className="text-xs text-gray-500 text-center py-4">No users available.</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {settingsOpen && currentEmail === post.authorEmail && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-6"
                    >
                        <div className="absolute inset-0 bg-black/70" onClick={() => setSettingsOpen(false)} />
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md glass-card rounded-[2rem] border-white/10 p-6"
                        >
                            <h3 className="text-lg font-black text-white mb-4">Post Settings</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                    <span className="text-sm font-medium text-white">Show Counts</span>
                                    <button
                                        onClick={() => setPost((prev) => ({ ...prev, showCounts: !prev.showCounts }))}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${post.showCounts ? 'bg-vibrant' : 'bg-white/10'}`}
                                    >
                                        <motion.div
                                            animate={{ x: post.showCounts ? 24 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className="w-4 h-4 bg-white rounded-full shadow-md"
                                        />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                    <span className="text-sm font-medium text-white">Allow Comments</span>
                                    <button
                                        onClick={() => setPost((prev) => ({ ...prev, allowComments: !prev.allowComments }))}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${post.allowComments ? 'bg-vibrant' : 'bg-white/10'}`}
                                    >
                                        <motion.div
                                            animate={{ x: post.allowComments ? 24 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className="w-4 h-4 bg-white rounded-full shadow-md"
                                        />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={async () => {
                                        setSettingsSaving(true);
                                        try {
                                            await postService.updatePostSettings(post.id, {
                                                showCounts: !!post.showCounts,
                                                allowComments: !!post.allowComments
                                            });
                                            setSettingsOpen(false);
                                        } finally {
                                            setSettingsSaving(false);
                                        }
                                    }}
                                    className="px-6 py-2 bg-white text-black rounded-xl text-[10px] font-black"
                                >
                                    {settingsSaving ? "Saving..." : "Save"}
                                </button>
                                <button onClick={() => setSettingsOpen(false)} className="px-6 py-2 bg-white/10 text-white rounded-xl text-[10px] font-black">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default PostDetails;
