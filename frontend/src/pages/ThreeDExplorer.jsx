import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { postService, userService } from "../services/api";
import CommentSection from "../components/CommentSection";
import ShareSheet from "../components/ShareSheet";
import { Heart, MessageCircle, Share2, Bookmark, X } from "lucide-react";
import ExploreModal from "../components/ExploreModal";
import { GridSkeleton } from "../components/Skeleton";
import { useCharacter } from "../context/CharacterContext";
import { mediaUrl } from '../lib/config';

function ThreeDExplorer() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [showCounts] = useState(true);
    const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
    const navigate = useNavigate();
    const [sharePostId, setSharePostId] = useState(null);
    const [modalPostId, setModalPostId] = useState(null);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const sentinelRef = useRef(null);
    const scrollerRef = useRef(null);
    const { setEmotion, showBubble } = useCharacter();

    const loadPosts = async (pageNum = 0) => {
            setLoading(true);
            try {
            const [feed, saved, prof] = await Promise.all([
                postService.getFeed(pageNum, 10),
                    postService.getSaved(),
                    userService.getProfile()
                ]);
                const savedIds = new Set((saved || []).map((p) => p.id));
            const newBatch = (feed?.content || []).map((p) => ({
                    ...p,
                    isSaved: savedIds.has(p.id)
                }));
            setPosts((prev) => {
                const map = new Map(prev.map((x) => [x.id, x]));
                newBatch.forEach((x) => map.set(x.id, x));
                return Array.from(map.values());
            });
                setProfile(prof);
            setHasMore(!feed?.last);
            setPage(pageNum);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
    };

    useEffect(() => {
        loadPosts(0);
    }, []);

    useEffect(() => {
        setEmotion("curious", 3000);
        showBubble("So much to discover 🌍");
    }, [setEmotion, showBubble]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                loadPosts(page + 1);
            }
        }, { rootMargin: '200px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, [hasMore, loading, page]);

    const handleLike = async (postId) => {
        const originalPosts = [...posts];
        // Optimistic update
        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId ? { 
                    ...p, 
                    likesCount: p.isLiked ? Math.max(0, (p.likesCount || 0) - 1) : (p.likesCount || 0) + 1, 
                    isLiked: !p.isLiked 
                } : p
            )
        );

        try {
            const res = await postService.toggleLike(postId);
            // Sync with server response
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId ? { ...p, isLiked: res.liked, likesCount: res.likesCount } : p
                )
            );
            
            if (res.liked) {
                setEmotion('happy', 2000);
                showBubble('Loving this reel! ❤️', 2000);
            }
        } catch (e) {
            console.error("Explore like failed", e);
            // Revert on error
            setPosts(originalPosts);
        }
    };

    const handleFollow = async (userId) => {
        try {
            await userService.followUser(userId);
            setEmotion('excited', 2000);
            showBubble('Following new orbits! 🚀', 2000);
            
            // Optimistic local state update for follow status
            setPosts((prev) =>
                prev.map((p) =>
                    p.user?.id === userId ? { 
                        ...p, 
                        user: { ...p.user, isFollowing: true } 
                    } : p
                )
            );
        } catch (e) {
            console.error("Follow failed", e);
        }
    };

    const handleSave = async (postId, isSaved) => {
        try {
            if (isSaved) {
                await postService.unsavePost(postId);
            } else {
                await postService.savePost(postId);
                setEmotion('thumbsup', 2000);
                showBubble('Saved to collection! 🔖', 1500);
            }
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId ? { ...p, isSaved: !isSaved } : p
                )
            );
        } catch (e) {
            console.error("Explore save failed", e);
        }
    };

    const handleRepost = async (postId) => {
        try {
            await postService.repost(postId, null);
            setEmotion('excited', 2500);
            showBubble('Spreading the word! 🔗', 2000);
        } catch (e) {
            console.error("Repost failed", e);
        }
    };

    useEffect(() => {
        const root = scrollerRef.current;
        if (!root) return;
        const vids = root.querySelectorAll("video");
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const v = entry.target;
                if (entry.isIntersecting) {
                    v.play?.().catch(() => {});
                } else {
                    v.pause?.();
                }
            });
        }, { threshold: 0.6 });
        vids.forEach(v => obs.observe(v));
        return () => obs.disconnect();
    }, [posts]);

    return (
        <div className="flex h-screen w-full bg-black overflow-hidden">
            {/* 1. Desktop Sidebar placeholder (handled by Layout) */}
            <div className="hidden lg:block w-[220px] shrink-0 h-full border-r border-white/5" />

            {/* 2. Main Content */}
            <div className="flex-1 relative overflow-hidden bg-black flex flex-col">
                {/* Header */}
                <div className="pointer-events-none absolute top-8 left-8 z-20">
                    <motion.h2 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-2xl"
                    >
                        Explore
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-purple-500 font-black uppercase tracking-[0.3em] text-[10px] mt-1"
                    >
                        Live Network Feed
                    </motion.p>
                </div>

                {loading && posts.length === 0 ? (
                    <div className="h-full grid place-items-center bg-[#0a0a0f]">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-white/20 font-black uppercase tracking-widest text-xs">Syncing Reels...</p>
                        </div>
                    </div>
                ) : (
                    <div 
                        ref={scrollerRef} 
                        className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar"
                    >
                        {posts.filter(p => !p?.user?.isPrivate).map((post, idx) => (
                            <div
                                key={post.id || idx}
                                className="snap-start h-full w-full flex items-center justify-center relative bg-black"
                            >
                                {/* REEL CONTAINER */}
                                <div className="relative h-full w-full flex items-center justify-center">
                                    
                                    {/* 1. MAIN MEDIA (Centered, Max Width 480px) */}
                                    <div 
                                        className="relative h-full w-full max-w-[480px] aspect-[9/16] overflow-hidden bg-black flex items-center justify-center group"
                                        onClick={() => setModalPostId(post.id)}
                                    >
                                        {post.mediaUrl ? (
                                            /\.(mp4|webm|ogg)$/i.test(post.mediaUrl) ? (
                                                <video
                                                    className="w-full h-full object-cover"
                                                    src={mediaUrl(post.mediaUrl)}
                                                    muted
                                                    autoPlay
                                                    loop
                                                    playsInline
                                                />
                                            ) : (
                                                <img
                                                    src={mediaUrl(post.mediaUrl)}
                                                    className="w-full h-full object-cover"
                                                    alt="post"
                                                    loading="lazy"
                                                />
                                            )
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-gradient-to-br from-purple-900/20 to-black">
                                                <p className="text-xl text-white font-medium text-center leading-relaxed italic opacity-80">
                                                    "{post.content}"
                                                </p>
                                            </div>
                                        )}

                                        {/* POSTER INFO (Bottom Overlay) */}
                                        <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none">
                                            <div className="flex items-center gap-3 mb-2 pointer-events-auto">
                                                <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.user?.id}`); }}>
                                                    <div className="w-9 h-9 rounded-full border border-white/50 overflow-hidden">
                                                        <img 
                                                            src={mediaUrl(post.user?.profileImage) || "/placeholder-avatar.svg"} 
                                                            className="w-full h-full object-cover" 
                                                            alt="av" 
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold text-white drop-shadow-lg">@{post.user?.username || "user"}</span>
                                                </div>
                                                
                                                {/* FOLLOW BUTTON */}
                                                {!post.user?.isFollowing && post.user?.id !== profile?.id && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleFollow(post.user?.id); }}
                                                        className="px-4 py-1.5 bg-white text-black text-[10px] font-black uppercase rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
                                                    >
                                                        Follow
                                                    </button>
                                                )}
                                                {post.user?.isFollowing && (
                                                    <span className="px-4 py-1.5 bg-white/10 text-white/60 text-[10px] font-black uppercase rounded-full border border-white/10">
                                                        Following
                                                    </span>
                                                )}
                                            </div>
                                            <div className="max-w-[75%]">
                                                <p className="text-white text-xs font-medium leading-tight drop-shadow-lg line-clamp-2">
                                                    {post.content}
                                                </p>
                                                <p className="text-purple-400 text-[11px] font-bold mt-1">#orbit #connecthub</p>
                                            </div>
                                        </div>

                                        {/* BOTTOM GRADIENT OVERLAY */}
                                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                                    </div>

                                    {/* 2. ACTION COLUMN (60px Width, Right of video) */}
                                    <div className="w-[60px] flex flex-col items-center justify-end pb-12 gap-6 z-20">
                                        
                                        {/* AVATAR */}
                                        <button 
                                            onClick={() => navigate(`/profile/${post.user?.id}`)}
                                            className="w-11 h-11 rounded-full border-2 border-white p-0.5 shadow-lg active:scale-90 transition-transform mb-2"
                                        >
                                            <img 
                                                src={mediaUrl(post.user?.profileImage) || "/placeholder-avatar.svg"} 
                                                className="w-full h-full rounded-full object-cover" 
                                                alt="av" 
                                            />
                                        </button>

                                        {/* LIKE */}
                                        <div className="flex flex-col items-center gap-1 group relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                                                data-companion-hover="like"
                                                data-tooltip="Like"
                                                className="active:scale-125 transition-transform"
                                            >
                                                <Heart size={28} className={`transition-colors ${post.isLiked ? "text-[#ec4899] fill-[#ec4899]" : "text-white"}`} />
                                            </button>
                                            <span className="text-xs font-bold text-white">{post.likesCount || 0}</span>
                                        </div>

                                        {/* COMMENT */}
                                        <div className="flex flex-col items-center gap-1 group relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setOpenCommentsPostId(post.id); }}
                                                data-companion-hover="comment"
                                                data-tooltip="Comment"
                                                className="active:scale-125 transition-transform"
                                            >
                                                <MessageCircle size={28} className="text-white" />
                                            </button>
                                            <span className="text-xs font-bold text-white">{post.commentsCount || 0}</span>
                                        </div>

                                        {/* SHARE */}
                                        <div className="group relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSharePostId(post.id); }}
                                                data-companion-hover="share"
                                                data-tooltip="Share"
                                                className="active:scale-125 transition-transform"
                                            >
                                                <Share2 size={28} className="text-white" />
                                            </button>
                                        </div>

                                        {/* SAVE */}
                                        <div className="group relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleSave(post.id, post.isSaved); }}
                                                data-companion-hover="save"
                                                data-tooltip="Save"
                                                className="active:scale-125 transition-transform"
                                            >
                                                <Bookmark size={28} className={`transition-colors ${post.isSaved ? "text-[#fbbf24] fill-[#fbbf24]" : "text-white"}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* SLIDE UP COMMENT PANEL */}
                                <AnimatePresence>
                                    {openCommentsPostId === post.id && (
                                        <>
                                            {/* Backdrop */}
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setOpenCommentsPostId(null)}
                                                className="absolute inset-0 bg-black/40 z-30"
                                            />
                                            {/* Panel */}
                                            <motion.div 
                                                initial={{ y: "100%" }}
                                                animate={{ y: 0 }}
                                                exit={{ y: "100%" }}
                                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                className="absolute bottom-0 left-0 right-0 h-[60vh] bg-[#0a0a0f]/95 backdrop-blur-xl z-40 rounded-t-[2rem] border-t border-white/10 flex flex-col"
                                            >
                                                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2" />
                                                <div className="flex items-center justify-between px-6 py-2 border-b border-white/5">
                                                    <h3 className="text-white font-black text-sm uppercase tracking-widest">Comments</h3>
                                                    <button onClick={() => setOpenCommentsPostId(null)} className="text-white/50 hover:text-white transition">
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-4 thin-scrollbar">
                                                    <CommentSection postId={post.id} currentEmail={profile?.email} />
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                        <div ref={sentinelRef} className="h-10 w-full" />
                    </div>
                )}
            </div>

            {/* Modal Components */}
            <AnimatePresence>
                {sharePostId && (
                    <ShareSheet 
                        open={!!sharePostId}
                        onClose={() => setSharePostId(null)}
                        share={{
                            id: sharePostId,
                            type: "post",
                            url: `${window.location.origin}/post/${sharePostId}`
                        }}
                    />
                )}
            </AnimatePresence>

            <ExploreModal 
                postId={modalPostId} 
                isOpen={!!modalPostId} 
                onClose={() => setModalPostId(null)} 
            />
        </div>
    );
}

export default ThreeDExplorer;
