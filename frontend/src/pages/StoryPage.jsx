import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { storyService } from "../services/api";
import RecipientSelector from "../components/RecipientSelector";
import { mediaUrl as buildMediaUrl } from '../lib/config';


function StoryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [caption, setCaption] = useState("");
    const [captionPosition, setCaptionPosition] = useState({ x: 50, y: 90 });
    const [music, setMusic] = useState("");
    const [audience, setAudience] = useState("FOLLOWERS");
    const [mediaScale, setMediaScale] = useState(1);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [captionColor, setCaptionColor] = useState("#ffffff");
    const [captionAngle, setCaptionAngle] = useState(0);
    const [captionFont, setCaptionFont] = useState("Inter, sans-serif");
    const [captionBubble, setCaptionBubble] = useState(false);
    const [captionShadow, setCaptionShadow] = useState(false);
    const [stickers, setStickers] = useState([]);
    const [activeSticker, setActiveSticker] = useState(null);
    const [showRecipientSelector, setShowRecipientSelector] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [saving, setSaving] = useState(false);
    const mediaPreviewRef = useRef(null);
    const recordedRef = useRef(false);
    const viewTimerRef = useRef(null);
    const recordImmediateRef = useRef(null);
    const myEmail = localStorage.getItem("userEmail");
    const [showViewers, setShowViewers] = useState(false);
    const [captionFocused, setCaptionFocused] = useState(false);
    const [editing, setEditing] = useState(false);
    const [imageTimerKey, setImageTimerKey] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeViewerTab, setActiveViewerTab] = useState("all");

    const isOwner = (story?.user?.email && story.user.email === myEmail) || (story?.authorEmail && story.authorEmail === myEmail);

    const parseRecipients = (value) => {
        if (!value) return [];
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const parseCaptionPosition = (value) => {
        if (!value) return { x: 50, y: 90 };
        try {
            return JSON.parse(value);
        } catch {
            return { x: 50, y: 90 };
        }
    };

    const loadStory = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await storyService.getById(id);
            setStory(data);
            setCaption(data.caption || "");
            const cp = parseCaptionPosition(data.captionPosition);
            setCaptionPosition(cp);
            setCaptionColor(cp.color || "#ffffff");
            setCaptionAngle(cp.angle || 0);
            setCaptionFont(cp.font || "Inter, sans-serif");
            setCaptionBubble(!!cp.bubble);
            setCaptionShadow(!!cp.shadow);
            if (data.decorations) {
                try { setStickers(JSON.parse(data.decorations)?.stickers || []); } catch (e) { void e; }
            } else {
                setStickers([]);
            }
            setMusic(data.music || "");
            setAudience(data.audience || "FOLLOWERS");
            setMediaScale(data.mediaScale || 1);
            setSelectedRecipients(parseRecipients(data.recipients));
        } catch (err) {
            const msg = typeof err?.response?.data === "string" ? err.response.data : err?.message;
            setError(msg || "Failed to load story.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        recordedRef.current = false;
        setCurrentSlide(0); // Reset slide on story change
        loadStory();
        setImageTimerKey(prev => prev + 1); // Reset timer on new story
    }, [id, loadStory]);

    const scheduleThresholdRecord = useCallback(() => {
        if (recordedRef.current) return;
        if (viewTimerRef.current) return;
        viewTimerRef.current = setTimeout(() => {
            viewTimerRef.current = null;
            if (recordImmediateRef.current) recordImmediateRef.current();
        }, 2000);
    }, []);

    const clearThresholdTimer = useCallback(() => {
        if (viewTimerRef.current) {
            clearTimeout(viewTimerRef.current);
            viewTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        const currentMedia = mediaPreviewRef.current;
        if (!currentMedia) return;
        const obs = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                    scheduleThresholdRecord();
                } else {
                    clearThresholdTimer();
                }
            },
            { threshold: [0, 0.6, 1] }
        );
        obs.observe(currentMedia);
        return () => {
            clearThresholdTimer();
            try { obs.unobserve(currentMedia); obs.disconnect(); } catch (e) { void e; }
        };
    }, [story?.id, currentSlide, scheduleThresholdRecord, clearThresholdTimer]);

    // Load same-user stories to allow next/prev navigation
    const sameUserStoryIdsRef = useRef([]);
    const [sameUserIndex, setSameUserIndex] = useState(0);
    const loadSameUserStories = useCallback(async (email) => {
        try {
            const feed = await storyService.feed(0, 50);
            const list = (feed?.content || []).filter(s => s?.user?.email === email).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            sameUserStoryIdsRef.current = list.map(s => s.id);
            const idx = sameUserStoryIdsRef.current.indexOf(id);
            setSameUserIndex(idx >= 0 ? idx : 0);
        } catch (e) { void e; }
    }, [id]);

    useEffect(() => {
        if (story?.user?.email) loadSameUserStories(story.user.email);
    }, [story?.user?.email, loadSameUserStories]);

    const [muted, setMuted] = useState(false);

    const goStep = useCallback((dir) => {
        // Handle internal slides first
        let slides = [];
        try {
            const parsed = JSON.parse(story?.slides || story?.slidesJson || "[]");
            slides = Array.isArray(parsed) ? parsed : [];
        } catch (_e) { /* silently ignore slides parse errors */ }

        if (slides.length > 1) {
            const nextSlide = currentSlide + dir;
            if (nextSlide >= 0 && nextSlide < slides.length) {
                setCurrentSlide(nextSlide);
                setImageTimerKey(prev => prev + 1);
                
                // If the new slide is a video, ensure it plays with current mute state
                setTimeout(() => {
                    const video = mediaPreviewRef.current?.querySelector('video');
                    if (video) {
                        video.muted = muted;
                        video.play().catch(() => {});
                    }
                }, 100);
                return;
            }
        }

        // Otherwise handle story ID navigation
        const ids = sameUserStoryIdsRef.current;
        if (!ids || ids.length === 0) return;
        const idx = ids.indexOf(id);
        const nextIdx = idx + dir;
        if (nextIdx >= 0 && nextIdx < ids.length) {
            setCurrentSlide(0); // Reset slide for new story
            navigate(`/story/${ids[nextIdx]}`);
        } else if (nextIdx >= ids.length) {
            navigate("/home"); // End of stories
        }
    }, [story, currentSlide, id, navigate]);

    useEffect(() => {
        const ids = sameUserStoryIdsRef.current;
        if (!ids || !id) return;
        const idx = ids.indexOf(id);
        setSameUserIndex(idx >= 0 ? idx : 0);
        setImageTimerKey(prev => prev + 1); // restart image progress
    }, [id]);

    const handleDragEnd = (event, info) => {
        if (mediaPreviewRef.current) {
            const mediaRect = mediaPreviewRef.current.getBoundingClientRect();
            const newX = ((info.point.x - mediaRect.left) / mediaRect.width) * 100;
            const newY = ((info.point.y - mediaRect.top) / mediaRect.height) * 100;
            setCaptionPosition({
                x: Math.max(0, Math.min(100, newX)),
                y: Math.max(0, Math.min(100, newY))
            });
        }
    };
    const lastViewRef = useRef(0);
    const recordImmediate = useCallback(async () => {
        if (!story?.id) return;
        const now = Date.now();
        // Reduced debounce to 1 second for more "accurate" multiple interactions
        if (now - lastViewRef.current < 1000) return;
        lastViewRef.current = now;
        try {
            // Prefer per-slide view if slides exist
            let slideId = null;
            try {
                const slides = JSON.parse(story?.slides || story?.slidesJson || "[]");
                if (Array.isArray(slides) && slides.length > 0) {
                    // Get current slide ID for accurate tracking
                    slideId = slides[currentSlide]?.slideId || slides[currentSlide]?.mediaUrl || null;
                } else if (story?.mediaUrl) {
                    slideId = story.mediaUrl;
                }
            } catch {
                if (story?.mediaUrl) slideId = story.mediaUrl;
            }
            if (slideId) {
                await storyService.recordSlideView(story.id, slideId);
            } else {
                await storyService.recordView(story.id);
            }
            // Allow multiple views to be recorded in same session if re-triggered
            setStory((prev) => {
                if (!prev) return prev;
                const list = Array.isArray(prev.viewers) ? [...prev.viewers] : [];
                const idx = list.findIndex(v => v.email === myEmail);
                if (idx >= 0) {
                    list[idx] = { ...list[idx], viewCount: (list[idx].viewCount || 0) + 1 };
                } else {
                    list.unshift({ email: myEmail, username: "You", profileImage: null, viewCount: 1 });
                }
                list.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
                return { ...prev, viewers: list };
            });
        } catch (e) { void e; }
    }, [story, myEmail, currentSlide]);
    useEffect(() => { recordImmediateRef.current = recordImmediate; }, [recordImmediate, story?.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const recipientsValue = audience === "CLOSE_FRIENDS" ? JSON.stringify(selectedRecipients) : "[]";
            await storyService.update(story.id, {
                caption,
                captionPosition: JSON.stringify({ ...captionPosition, color: captionColor, angle: captionAngle, font: captionFont, bubble: captionBubble, shadow: captionShadow }),
                audience,
                mediaScale: String(mediaScale),
                recipients: recipientsValue,
                music,
                decorations: JSON.stringify({ stickers })
            });
            await loadStory();
            setEditing(false); // ✅ Auto-exit edit mode after save
        } catch (err) {
            const msg = typeof err?.response?.data === "string" ? err.response.data : err?.message;
            setError(msg || "Failed to update story.");
        } finally {
            setSaving(false);
        }
    };

    const handleLikeToggle = async () => {
        if (!story) return;
        try {
            if (story.likedByMe) {
                await storyService.unlikeStory(story.id);
            } else {
                await storyService.likeStory(story.id);
            }
            await loadStory();
        } catch (e) { void e; }
    };

    const handleAddComment = async () => {
        if (!commentInput.trim() || !story) return;
        try {
            await storyService.addComment(story.id, commentInput.trim());
            setCommentInput("");
            await loadStory();
        } catch (e) { void e; }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await storyService.deleteComment(commentId);
            await loadStory();
        } catch (e) { void e; }
    };

    const handleDeleteStory = async () => {
        if (!window.confirm("Delete this story?")) return;
        try {
            await storyService.delete(story.id);
            navigate("/home");
        } catch (e) {
            setError("Failed to delete story.");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center py-20 gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full pulse-glow"
                />
                <p className="text-gray-400 font-medium animate-pulse">Loading story...</p>
            </div>
        );
    }

    if (!story) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-6">
                <p className="text-red-400 font-bold">{error || "Story not found."}</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate("/home")}
                    className="w-10 h-10 glass rounded-2xl flex items-center justify-center"
                >
                    <span className="text-xl">⬅️</span>
                </button>
                <div>
                    <h1 className="text-3xl font-black text-vibrant uppercase tracking-tightest">Story</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{editing ? "Edit" : "View"}</p>
                </div>
                {isOwner && (
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={() => setEditing((v) => !v)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black transition border ${editing ? 'bg-white text-black border-white' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                        >
                            {editing ? "Done" : "Edit"}
                        </button>
                        <button
                            onClick={handleDeleteStory}
                            className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-500 transition flex items-center justify-center border border-red-500/20"
                            title="Delete Story"
                        >
                            🗑️
                        </button>
                    </div>
                )}
            </div>

            <div className="glass-card rounded-[2.5rem] overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                    <div className="w-full lg:w-1/2 bg-zinc-900/50 relative border-b lg:border-b-0 lg:border-r border-white/5 min-h-[520px]">
                        {/* Top progress bars */}
                        {sameUserStoryIdsRef.current.length > 0 && (
                            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
                                {sameUserStoryIdsRef.current.map((_, i) => (
                                    <div key={i} className="flex-1 h-1 bg-white/20 rounded overflow-hidden">
                                        <motion.div
                                            key={`${imageTimerKey}-${i}-${sameUserIndex}`}
                                            initial={{ width: i < sameUserIndex ? "100%" : "0%" }}
                                            animate={{ width: i < sameUserIndex ? "100%" : i === sameUserIndex ? "100%" : "0%" }}
                                            transition={{ duration: i === sameUserIndex ? 5 : 0, ease: "linear" }}
                                            className="h-full bg-white"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        <div
                            ref={mediaPreviewRef}
                            className="absolute inset-0 flex items-center justify-center overflow-hidden cursor-pointer"
                            onClick={() => { recordImmediate(); }}
                            onTouchStart={() => { recordImmediate(); }}
                        >
                            {(() => {
                                let mediaUrl = story.mediaUrl;
                                try {
                                    const slides = JSON.parse(story?.slides || story?.slidesJson || "[]");
                                    if (Array.isArray(slides) && slides.length > 0 && slides[currentSlide]) {
                                        mediaUrl = slides[currentSlide].mediaUrl || mediaUrl;
                                    }
                                } catch (_e) { /* silently ignore slides parse errors */ }

                                if (!mediaUrl) return <div className="text-gray-500 text-center">No media</div>;

                                return mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <video
                                            key={mediaUrl}
                                            src={buildMediaUrl(mediaUrl)}
                                            controls={false}
                                            autoPlay
                                            muted={muted}
                                            playsInline
                                            className="max-h-full max-w-full object-contain"
                                            style={{ transform: `scale(${mediaScale})`, pointerEvents: editing ? "none" : "auto" }}
                                            onPlay={() => { scheduleThresholdRecord(); }}
                                            onEnded={() => { recordImmediate(); goStep(1); }}
                                        />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                                            className="absolute top-10 right-10 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-all pointer-events-auto"
                                        >
                                            {muted ? "🔇" : "🔊"}
                                        </button>
                                    </div>
                                ) : (
                                    <img
                                        key={mediaUrl}
                                        src={buildMediaUrl(mediaUrl)}
                                        alt="story"
                                        className="max-h-full max-w-full object-contain"
                                        style={{ transform: `scale(${mediaScale})`, userSelect: "none", pointerEvents: editing ? "none" : "auto" }}
                                        onLoad={() => {
                                            scheduleThresholdRecord();
                                            // auto advance after 5s for images
                                            const localKey = imageTimerKey + 1;
                                            setImageTimerKey(localKey);
                                            setTimeout(() => { if (localKey === imageTimerKey + 1) goStep(1); }, 5000);
                                        }}
                                    />
                                );
                            })()}
                            {/* Tap zones for next/prev like Instagram */}
                            <button aria-label="prev" onClick={() => goStep(-1)} className="absolute inset-y-0 left-0 w-1/3 bg-transparent" />
                            <button aria-label="next" onClick={() => goStep(1)} className="absolute inset-y-0 right-0 w-1/3 bg-transparent" />
                            {/* Hints */}
                            <div className="absolute top-6 right-6 text-[10px] text-white/70 font-black uppercase tracking-widest">Tap right for next • left for previous</div>

                            {editing ? (
                                <div className="absolute inset-0 z-30 pointer-events-none">
                                    <motion.input
                                        type="text"
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Type caption..."
                                        className="absolute bg-transparent text-lg font-bold text-center outline-none border-none pointer-events-auto cursor-text"
                                        style={{
                                            left: `${captionPosition.x}%`,
                                            top: `${captionPosition.y}%`,
                                            transform: `translate(-50%, -50%) rotate(${captionAngle}deg)`,
                                            width: "fit-content",
                                            minWidth: "120px",
                                            fontSize: `${captionPosition.size || 18}px`,
                                            color: captionColor,
                                            fontFamily: captionFont,
                                            backgroundColor: captionBubble ? "rgba(0,0,0,0.6)" : "transparent",
                                            padding: captionBubble ? "8px 16px" : 0,
                                            borderRadius: captionBubble ? "20px" : 0,
                                            textShadow: captionShadow ? "0 2px 8px rgba(0,0,0,0.8)" : "none",
                                            boxShadow: captionBubble ? "0 4px 15px rgba(0,0,0,0.3)" : "none"
                                        }}
                                        onFocus={() => setCaptionFocused(true)}
                                        onBlur={() => setCaptionFocused(false)}
                                        drag={!captionFocused}
                                        dragMomentum={false}
                                        dragElastic={0}
                                        dragConstraints={mediaPreviewRef}
                                        onDragEnd={handleDragEnd}
                                    />

                                    {/* Drag Handle Indicator */}
                                    <motion.div
                                        className="absolute w-10 h-10 flex items-center justify-center pointer-events-auto cursor-move"
                                        style={{
                                            left: `${captionPosition.x}%`,
                                            top: `${captionPosition.y - 8}%`,
                                            transform: `translate(-50%, -50%)`
                                        }}
                                        drag
                                        dragConstraints={mediaPreviewRef}
                                        dragMomentum={false}
                                        onDrag={(e, info) => {
                                            if (!mediaPreviewRef.current) return;
                                            const r = mediaPreviewRef.current.getBoundingClientRect();
                                            const x = ((info.point.x - r.left) / r.width) * 100;
                                            const y = ((info.point.y - r.top) / r.height) * 100;
                                            setCaptionPosition(p => ({ ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }));
                                        }}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-[10px]">✥</div>
                                    </motion.div>
                                </div>
                            ) : story.caption ? (
                                <div
                                    className="absolute text-lg font-bold text-center"
                                    style={{
                                        left: `${captionPosition.x}%`,
                                        top: `${captionPosition.y}%`,
                                        transform: `translate(-50%, -50%) rotate(${captionPosition.angle || 0}deg)`,
                                        width: "80%",
                                        color: captionPosition.color || "#ffffff",
                                        fontSize: `${captionPosition.size || 18}px`,
                                        fontFamily: captionPosition.font || "Inter, sans-serif",
                                        backgroundColor: captionPosition.bubble ? "rgba(0,0,0,0.5)" : "transparent",
                                        padding: captionPosition.bubble ? "6px 10px" : 0,
                                        borderRadius: captionPosition.bubble ? "12px" : 0,
                                        textShadow: captionPosition.shadow ? "0 2px 6px rgba(0,0,0,.6)" : "none"
                                    }}
                                >
                                    {story.caption}
                                </div>
                            ) : null}
                            {/* Move and size handles (edit mode only) */}
                            {editing && (
                                <>
                                    <motion.div
                                        className="absolute w-5 h-5 bg-white rounded-full border border-black/40 shadow cursor-move z-30"
                                        style={{
                                            left: `${captionPosition.x}%`,
                                            top: `${captionPosition.y}%`,
                                            transform: `translate(-50%, -50%)`
                                        }}
                                        drag
                                        dragConstraints={mediaPreviewRef}
                                        dragMomentum={false}
                                        onDrag={(e, info) => {
                                            if (!mediaPreviewRef.current) return;
                                            const r = mediaPreviewRef.current.getBoundingClientRect();
                                            const x = ((info.point.x - r.left) / r.width) * 100;
                                            const y = ((info.point.y - r.top) / r.height) * 100;
                                            setCaptionPosition(p => ({ ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }));
                                        }}
                                    />
                                    <motion.div
                                        className="absolute w-5 h-5 bg-white rounded-full border border-black shadow cursor-ew-resize z-30"
                                        style={{
                                            left: `${(captionPosition.x || 50) + 30}%`,
                                            top: `${captionPosition.y || 90}%`,
                                            transform: `translate(-50%, -50%)`
                                        }}
                                        drag="x"
                                        dragConstraints={mediaPreviewRef}
                                        dragMomentum={false}
                                        onDrag={(e, info) => {
                                            const delta = info.offset.x || 0;
                                            const next = Math.max(12, Math.min(36, Math.round((captionPosition.size || 18) + delta / 5)));
                                            setCaptionPosition((p) => ({ ...p, size: next }));
                                        }}
                                    />
                                </>
                            )}
                            {stickers.map((st, idx) => (
                                <motion.div
                                    key={idx}
                                    drag
                                    dragMomentum={false}
                                    dragElastic={0}
                                    dragConstraints={mediaPreviewRef}
                                    onMouseDown={() => setActiveSticker(idx)}
                                    onTouchStart={() => setActiveSticker(idx)}
                                    onDragEnd={(e, info) => {
                                        if (!mediaPreviewRef.current) return;
                                        const r = mediaPreviewRef.current.getBoundingClientRect();
                                        const x = ((info.point.x - r.left) / r.width) * 100;
                                        const y = ((info.point.y - r.top) / r.height) * 100;
                                        setStickers(prev => prev.map((s, i) => i === idx ? { ...s, x, y } : s));
                                    }}
                                    style={{
                                        position: "absolute",
                                        left: `${st.x}%`,
                                        top: `${st.y}%`,
                                        transform: `translate(-50%, -50%) rotate(${st.angle || 0}deg) scale(${st.scale || 1})`,
                                        outline: activeSticker === idx ? "2px solid rgba(168,85,247,0.6)" : "none",
                                        borderRadius: "12px"
                                    }}
                                >
                                    <span style={{ fontSize: st.size || 28 }}>{st.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 p-8 flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px]">
                                <img
                                    src={buildMediaUrl(story.user?.profileImage) || "/placeholder-avatar.svg"}
                                    className="w-full h-full rounded-full object-cover border-2 border-black"
                                    alt="profile"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-white text-sm tracking-tight">
                                    {story.user?.username || story.user?.email?.split("@")[0] || "User"}
                                </p>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Story</p>
                            </div>
                            <button onClick={handleLikeToggle} className="text-2xl">
                                {story.likedByMe ? "❤️" : "🤍"}
                            </button>
                            {isOwner && (
                                <button
                                    onClick={() => setShowViewers(true)}
                                    className="ml-2 px-3 py-1 rounded-full text-[10px] font-black bg-white/10 hover:bg-white/20 transition border border-white/10"
                                >
                                    Viewers
                                </button>
                            )}
                        </div>

                        {(() => {
                            const groupedArr = (Array.isArray(story.viewers) ? story.viewers : []).reduce((map, v) => {
                                const key = v.email || v.id || Math.random().toString(36);
                                if (!map.has(key)) map.set(key, { ...v, viewCount: v.viewCount || 1 });
                                else map.set(key, { ...map.get(key), viewCount: (map.get(key).viewCount || 0) + (v.viewCount || 1) });
                                return map;
                            }, new Map());
                            const totalViews = Array.from(groupedArr.values()).reduce((sum, v) => sum + (v.viewCount || 1), 0);
                            return (
                                <div className="flex items-center gap-6 text-sm font-black text-white">
                                    <span>❤️ {story.likeCount || 0}</span>
                                    <span>Views {totalViews}</span>
                                </div>
                            );
                        })()}

                        {editing && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Size</label>
                                    <input
                                        type="range"
                                        min="0.6"
                                        max="1.4"
                                        step="0.05"
                                        value={mediaScale}
                                        onChange={(e) => setMediaScale(Number(e.target.value))}
                                        className="w-full mt-2"
                                    />
                                </div>
                                <input
                                    value={music}
                                    onChange={(e) => setMusic(e.target.value)}
                                    placeholder="Add a music track (optional)"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none"
                                />
                                <select
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none"
                                >
                                    <option value="PUBLIC">Public</option>
                                    <option value="FOLLOWERS">Followers</option>
                                    <option value="CLOSE_FRIENDS">Close Friends</option>
                                </select>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Caption Size</label>
                                    <input
                                        type="range"
                                        min="12"
                                        max="36"
                                        step="1"
                                        value={captionPosition.size || 18}
                                        onChange={(e) => setCaptionPosition((p) => ({ ...p, size: Number(e.target.value) }))}
                                        className="w-full mt-2"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Caption Rotation</label>
                                        <input
                                            type="range"
                                            min="-45"
                                            max="45"
                                            step="1"
                                            value={captionAngle}
                                            onChange={(e) => setCaptionAngle(Number(e.target.value))}
                                            className="w-full mt-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Caption Color</label>
                                        <input
                                            type="color"
                                            value={captionColor}
                                            onChange={(e) => setCaptionColor(e.target.value)}
                                            className="w-full h-9 rounded"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Caption Font</label>
                                        <select
                                            value={captionFont}
                                            onChange={(e) => setCaptionFont(e.target.value)}
                                            className="w-full mt-2 bg-black/40 border border-white/10 rounded-2xl px-3 py-2 text-sm"
                                        >
                                            <option value="Inter, sans-serif">Inter</option>
                                            <option value="Georgia, serif">Serif</option>
                                            <option value="ui-monospace, SFMono-Regular, Menlo, monospace">Mono</option>
                                            <option value="'Segoe UI Variable Display', system-ui, sans-serif">Display</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <input type="checkbox" checked={captionBubble} onChange={(e) => setCaptionBubble(e.target.checked)} />
                                            Bubble
                                        </label>
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <input type="checkbox" checked={captionShadow} onChange={(e) => setCaptionShadow(e.target.checked)} />
                                            Shadow
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stickers</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {["✨", "🔥", "😂", "❤️", "👍", "🎉", "🌈", "💎"].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setStickers(prev => [...prev, { text: s, x: 50, y: 50, size: 28, scale: 1, angle: 0 }])}
                                                className="px-3 py-1 rounded-xl bg-white/10 border border-white/10"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                        {stickers.length > 0 && (
                                            <button
                                                onClick={() => setStickers([])}
                                                className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-xs"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    {activeSticker !== null && activeSticker !== undefined && stickers[activeSticker] && (
                                        <div className="mt-3 grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rotate</label>
                                                <input
                                                    type="range"
                                                    min="-45"
                                                    max="45"
                                                    step="1"
                                                    value={stickers[activeSticker].angle || 0}
                                                    onChange={(e) => setStickers(prev => prev.map((s, i) => i === activeSticker ? { ...s, angle: Number(e.target.value) } : s))}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Scale</label>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="2"
                                                    step="0.05"
                                                    value={stickers[activeSticker].scale || 1}
                                                    onChange={(e) => setStickers(prev => prev.map((s, i) => i === activeSticker ? { ...s, scale: Number(e.target.value) } : s))}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={() => { setStickers(prev => prev.filter((_, i) => i !== activeSticker)); setActiveSticker(null); }}
                                                    className="w-full px-3 py-2 rounded-xl bg-red-600/80 text-white text-xs font-black"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {audience === "CLOSE_FRIENDS" && (
                                    <button
                                        onClick={() => setShowRecipientSelector(true)}
                                        className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-white/10 border border-white/10"
                                    >
                                        {selectedRecipients.length > 0
                                            ? `Recipients: ${selectedRecipients.length}`
                                            : "Select Recipients"}
                                    </button>
                                )}
                                {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={saving}
                                    onClick={handleSave}
                                    className={`w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 font-black text-sm shadow-2xl shadow-purple-500/20 ${saving ? "opacity-50" : ""}`}
                                >
                                    {saving ? "SAVING..." : "SAVE CHANGES"}
                                </motion.button>
                            </div>
                        )}

                        <div className="border-t border-white/5 pt-4">
                            <button
                                onClick={() => setShowComments(!showComments)}
                                className="w-full text-center text-white/70 text-sm mb-3"
                            >
                                {showComments ? "Hide Comments" : `View all ${story.comments?.length || 0} comments`}
                            </button>
                            <AnimatePresence>
                                {showComments && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="max-h-40 overflow-y-auto no-scrollbar bg-black/30 rounded-lg p-2 mb-3"
                                    >
                                        {story.comments && story.comments.length > 0 ? (
                                            story.comments.map((comment) => (
                                                <div key={comment.id} className="flex items-start gap-2 text-white text-sm mb-1">
                                                    <img
                                                        src={buildMediaUrl(comment.user?.profileImage) || "/placeholder-avatar.svg"}
                                                        alt={comment.user?.username}
                                                        className="w-6 h-6 rounded-full"
                                                    />
                                                    <p>
                                                        <span className="font-bold">{comment.user?.username}:</span> {comment.content}
                                                    </p>
                                                    {comment.user?.email === myEmail && (
                                                        <button onClick={() => handleDeleteComment(comment.id)} className="text-red-400 ml-auto">
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-white/70 text-center">No comments yet.</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2 text-white text-sm outline-none"
                                />
                                <button onClick={handleAddComment} className="text-purple-400 font-bold">
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <RecipientSelector
                isOpen={showRecipientSelector}
                onClose={() => setShowRecipientSelector(false)}
                onSelectRecipients={(recipients) => {
                    setSelectedRecipients(recipients.map(r => r.email));
                    setShowRecipientSelector(false);
                }}
            />

            <AnimatePresence>
                {isOwner && showViewers && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-end justify-center"
                        onClick={() => setShowViewers(false)}
                    >
                        <div className="absolute inset-0 bg-black/60" />
                        <motion.div
                            initial={{ y: 80 }}
                            animate={{ y: 0 }}
                            exit={{ y: 80 }}
                            className="w-full max-w-lg glass rounded-t-3xl border-white/10 p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black uppercase tracking-widest text-white/80">Viewers</h3>
                                <button onClick={() => setShowViewers(false)} className="text-white/70">✕</button>
                            </div>

                            {/* Viewer Tabs */}
                            {(() => {
                                const slides = story.slides ? (typeof story.slides === "string" ? JSON.parse(story.slides) : story.slides) : [];
                                if (slides.length > 1) {
                                    return (
                                        <div className="flex gap-4 overflow-x-auto no-scrollbar mb-4 pb-1 border-b border-white/5">
                                            <button
                                                onClick={() => setActiveViewerTab("all")}
                                                className={`text-[10px] font-black uppercase tracking-widest pb-2 whitespace-nowrap transition-all ${activeViewerTab === "all" ? "text-purple-400 border-b-2 border-purple-400" : "text-white/40 hover:text-white/60"}`}
                                            >
                                                All Slides
                                            </button>
                                            {slides.map((s, idx) => (
                                                <button
                                                    key={s.id || idx}
                                                    onClick={() => setActiveViewerTab(s.id || s.mediaUrl)}
                                                    className={`text-[10px] font-black uppercase tracking-widest pb-2 whitespace-nowrap transition-all ${activeViewerTab === (s.id || s.mediaUrl) ? "text-purple-400 border-b-2 border-purple-400" : "text-white/40 hover:text-white/60"}`}
                                                >
                                                    Slide {idx + 1}
                                                </button>
                                            ))}
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {(() => {
                                let source = [];
                                if (activeViewerTab === "all") {
                                    // Use viewDetails if available, otherwise fallback to story.viewers
                                    if (story.viewDetails) {
                                        source = story.viewDetails.map(vd => ({ ...vd.user, viewCount: vd.count }));
                                    } else {
                                        source = story.viewers || [];
                                    }
                                } else {
                                    source = (story.viewDetails || [])
                                        .filter(vd => vd.slideId === activeViewerTab)
                                        .map(vd => ({ ...vd.user, viewCount: vd.count }));
                                }

                                const groupedArr = Array.from(
                                    source.reduce((map, v) => {
                                        const key = v.email || v.id || Math.random().toString(36);
                                        if (!map.has(key)) map.set(key, { ...v, viewCount: v.viewCount || 1 });
                                        else map.set(key, { ...map.get(key), viewCount: (map.get(key).viewCount || 0) + (v.viewCount || 1) });
                                        return map;
                                    }, new Map()).values()
                                ).sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

                                return (
                                    <div className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-white/10">
                                        {groupedArr.length === 0 ? (
                                            <div className="py-8 text-center text-white/30 font-bold text-sm">No views yet</div>
                                        ) : groupedArr.map((v) => (
                                            <div key={`${v.email}-${v.viewCount ?? 0}`} className="flex items-center gap-3 py-2">
                                                <img
                                                    src={buildMediaUrl(v.profileImage) || "/placeholder-avatar.svg"}
                                                    alt={v.username || v.email}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{v.username || v.email?.split("@")[0] || "User"}</p>
                                                </div>
                                                <span className="text-[11px] text-white/70 font-black">
                                                    {(v.viewCount ?? 1) > 1 ? `viewed ${v.viewCount} times` : "viewed 1 time"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default StoryPage;
