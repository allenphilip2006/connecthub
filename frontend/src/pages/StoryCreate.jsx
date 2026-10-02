import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { storyService } from "../services/api";
import RecipientSelector from "../components/RecipientSelector";
import { useCharacter } from "../context/CharacterContext";

// ---------- Icon mini-components (inlined SVG to avoid extra deps) ----------
const IconCamera = ({ s = 18 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>;
const IconImage = ({ s = 18 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
const IconChevronL = ({ s = 18 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>;
const IconChevronD = ({ s = 14 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>;
const IconSparkle = ({ s = 18 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>;
const IconSliders = ({ s = 18 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>;
const IconType = ({ s = 18 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>;
const IconMusic = ({ s = 18 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
const IconGlobe = ({ s = 16 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>;
const IconUsers = ({ s = 16 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
const IconStar = ({ s = 16 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const IconX = ({ s = 16 }) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

const FILTERS = [
    { name: "Normal", value: "none" },
    { name: "Clarendon", value: "contrast(110%) saturate(125%)" },
    { name: "Moon", value: "grayscale(100%) contrast(110%) brightness(90%)" },
    { name: "Lark", value: "brightness(120%) saturate(110%)" },
    { name: "Juno", value: "saturate(140%) contrast(110%)" },
    { name: "Slumber", value: "brightness(90%) saturate(90%) hue-rotate(10deg)" },
];

const FONTS = [
    { label: "Inter", value: "Inter, sans-serif" },
    { label: "Serif", value: "Georgia, serif" },
    { label: "Mono", value: "ui-monospace, monospace" },
    { label: "Display", value: "'Segoe UI Variable Display', system-ui, sans-serif" },
    { label: "Handwritten", value: "'Dancing Script', cursive" },
    { label: "Retro", value: "'Press Start 2P', cursive" },
];

const COLORS = [
    "#ffffff", "#000000", "#ff4d4d", "#ff944d", "#ffd24d", "#4dff88", "#4dffff", "#4d88ff", "#944dff", "#ff4dff"
];

const STICKER_EMOJIS = ["✨", "🔥", "😂", "❤️", "👍", "🎉", "🌈", "💎", "💯", "🚀", "👀", "🎬", "🎸", "🎧", "⚡", "🦄"];

const MUSIC_TRACKS = [
    { name: "Lofi Chill", artist: "Orbit Beats", duration: "2:30", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { name: "Neon Nights", artist: "SynthWave", duration: "3:15", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { name: "Morning Mist", artist: "Acoustic", duration: "4:05", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { name: "Cyberpunk", artist: "Glitch", duration: "2:45", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" }
];

const AUDIENCE_OPTIONS = [
    { id: "PUBLIC", label: "Public", icon: IconGlobe },
    { id: "FOLLOWERS", label: "Followers", icon: IconUsers },
    { id: "CLOSE_FRIENDS", label: "Close Friends", icon: IconStar },
];

// Sidebar Tab ids
const TABS = ["caption", "filter", "sticker", "music", "audience"];
const TAB_ICONS = { caption: IconType, filter: IconSliders, sticker: IconSparkle, music: IconMusic, audience: IconGlobe };

// ---- Spring config ----
const spring = { type: "spring", damping: 20, stiffness: 300 };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function StoryCreate() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setEmotion, showBubble } = useCharacter();

    const [slideFiles, setSlideFiles] = useState([]);
    const [slideIndex, setSlideIndex] = useState(0);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [caption, setCaption] = useState("");
    const [captionPos, setCaptionPos] = useState({ x: 50, y: 50, size: 24, angle: 0, color: "#ffffff", font: FONTS[0].value, bubble: false, shadow: true });
    const [slideMeta, setSlideMeta] = useState([]);
    const [music, setMusic] = useState("");
    const [audience, setAudience] = useState("FOLLOWERS");
    const [mediaScale, setMediaScale] = useState(1);
    const [filter, setFilter] = useState("none");
    const [stickers, setStickers] = useState([]);
    const [activeStk, setActiveStk] = useState(null);
    const [captionFocused, setCaptionFocused] = useState(false);
    const [activeTab, setActiveTab] = useState("caption");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showCamera, setShowCamera] = useState(false);
    const [showRecipients, setShowRecipients] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState([]);

    const mediaInputRef = useRef(null);
    const mediaPreviewRef = useRef(null);
    const cameraVideoRef = useRef(null);
    const cameraStreamRef = useRef(null);

    // Derive current slide meta
    const meta = slideMeta[slideIndex];
    const curFile = slideFiles[slideIndex];

    // Build preview URL
    useEffect(() => {
        if (!curFile) { setPreviewUrl(null); return; }
        const url = URL.createObjectURL(curFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [curFile]);

    // Share link sticker
    useEffect(() => {
        const link = new URLSearchParams(location.search).get("shareUrl") || "";
        if (link) setStickers(p => [...p, { text: "🔗", x: 80, y: 85, size: 24, scale: 1, angle: 0 }]);
    }, [location.search]);

    // Welcome emotion
    useEffect(() => {
        setEmotion('excited', 3000) 
        showBubble('Story time! 🎬') 
    }, [setEmotion, showBubble]);

    // Helpers
    const addFiles = (files) => {
        const arr = Array.from(files);
        if (!arr.length) return;
        setSlideFiles(p => [...p, ...arr]);
        setSlideMeta(p => {
            const next = [...p];
            arr.forEach(() => next.push({ text: "", position: { ...captionPos } }));
            return next;
        });
        setSlideIndex(slideFiles.length);
    };

    const updateMeta = (key, val) => {
        setSlideMeta(p => {
            const m = [...p];
            m[slideIndex] = { ...(m[slideIndex] || {}), position: { ...(m[slideIndex]?.position || captionPos), [key]: val } };
            return m;
        });
        setCaptionPos(p => ({ ...p, [key]: val }));
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
            cameraStreamRef.current = stream;
            if (cameraVideoRef.current) { cameraVideoRef.current.srcObject = stream; await cameraVideoRef.current.play(); }
            setShowCamera(true);
        } catch { setError("Camera or Microphone access denied"); }
    };

    const stopCamera = () => {
        setShowCamera(false);
        cameraStreamRef.current?.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
    };

    const capturePhoto = () => {
        const v = cameraVideoRef.current; if (!v) return;
        const c = document.createElement("canvas");
        c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        c.toBlob(blob => {
            if (blob) { addFiles([new File([blob], `snap-${Date.now()}.png`, { type: "image/png" })]); stopCamera(); }
        }, "image/png");
    };

    const submit = async (recipients) => {
        const payloads = slideFiles.length ? slideFiles : [];
        if (!payloads.length) { setError("Please select media."); return; }
        setLoading(true); setError("");
        const fd = new FormData();
        
        // Ensure files are appended with the correct field name 'files'
        payloads.forEach(f => fd.append("files", f));
        
        if (caption) fd.append("caption", caption);
        fd.append("captionPosition", JSON.stringify(captionPos));
        
        const meta2 = (slideMeta.length ? slideMeta : [{ text: caption, position: captionPos }])
            .map(m => ({ text: m.text ?? "", position: m.position ?? captionPos }));
        fd.append("slides", JSON.stringify(meta2));
        fd.append("audience", audience);
        fd.append("mediaScale", String(mediaScale));
        if (music) fd.append("music", music);
        
        // Ensure recipients are appended if audience is CLOSE_FRIENDS
        if (audience === "CLOSE_FRIENDS" && recipients?.length) {
            fd.append("recipients", JSON.stringify(recipients.map(r => r.email)));
        } else if (audience === "CLOSE_FRIENDS" && selectedRecipients.length) {
            fd.append("recipients", JSON.stringify(selectedRecipients.map(r => r.email)));
        }
        
        fd.append("decorations", JSON.stringify({ stickers }));
        
        try {
            await storyService.create(fd);
            setEmotion('celebrating', 5000) 
            showBubble('Story is live! 🎉') 
            navigate("/home");
        } catch (err) {
            console.error("Story creation failed:", err);
            setError(typeof err?.response?.data === "string" ? err.response.data : err?.message || "Failed to create story.");
        } finally { setLoading(false); }
    };

    const handleShare = () => {
        if (audience === "CLOSE_FRIENDS") { setShowRecipients(true); return; }
        submit([]);
    };

    // ---- Sidebar panel content per tab ----
    const panelVariants = { hidden: { opacity: 0, x: 16 }, show: { opacity: 1, x: 0, transition: { ...spring, delay: 0.05 } }, exit: { opacity: 0, x: -12 } };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0a0a12 0%, #0d0d1a 60%, #130a1e 100%)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
        >
            {/* ──────────── LEFT: Preview ──────────── */}
            <div className="relative flex-1 flex flex-col overflow-hidden bg-black/40">
                {/* top bar */}
                <motion.div
                    initial={{ y: -48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.1 }}
                    className="absolute top-0 left-0 right-0 z-[70] flex items-center gap-4 p-6"
                    style={{ background: "linear-gradient(to bottom, rgba(0,0,0,.9), transparent)" }}
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-110 active:scale-90"
                        style={{ background: "rgba(255,255,255,.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.1)" }}
                    ><IconChevronL s={22} /></button>
                    
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase italic">Creative Hub</h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                                {slideFiles.length ? `Editing Slide ${slideIndex + 1} of ${slideFiles.length}` : "Awaiting Inspiration..."}
                            </p>
                        </div>
                    </div>

                    <div className="ml-auto flex gap-3">
                        <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                            onClick={() => mediaInputRef.current?.click()}
                            className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2 backdrop-blur-xl"
                        ><IconImage s={16} /> ADD MEDIA</motion.button>
                        
                        <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                            onClick={startCamera}
                            className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 transition-all flex items-center gap-2 backdrop-blur-xl"
                        ><IconCamera s={16} /> LIVE CAPTURE</motion.button>
                    </div>
                </motion.div>

                {/* Preview area */}
                <div ref={mediaPreviewRef} className="flex-1 flex items-center justify-center overflow-hidden relative p-12 lg:p-20">
                    <AnimatePresence mode="wait">
                        {showCamera ? (
                            <motion.div key="cam" {...fadeUp} className="flex flex-col items-center gap-6 w-full h-full justify-center">
                                <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.2)] border-4 border-white/5">
                                    <video ref={cameraVideoRef} className="max-h-[calc(100vh-250px)] object-contain bg-black" />
                                    <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20" />
                                </div>
                                <div className="flex gap-4">
                                    <motion.button onClick={capturePhoto} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: .95 }}
                                        className="btn-gradient rounded-2xl px-10 py-4 text-sm font-black shadow-2xl shadow-purple-500/40"
                                    >CAPTURE MOMENT</motion.button>
                                    <motion.button onClick={stopCamera} whileHover={{ scale: 1.05 }} whileTap={{ scale: .95 }}
                                        className="px-8 py-4 rounded-2xl text-sm font-black text-white/60 hover:text-white transition-colors"
                                        style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)" }}
                                    >CANCEL</motion.button>
                                </div>
                            </motion.div>
                        ) : previewUrl ? (
                            <motion.div key={previewUrl} initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .98 }} transition={spring}
                                className="relative h-full w-full flex items-center justify-center group"
                            >
                                <div className="relative max-h-full max-w-full rounded-[2rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 transition-transform duration-700" style={{ transform: `scale(${mediaScale})` }}>
                                    {curFile?.type?.startsWith("video/") ? (
                                        <video src={previewUrl} controls className="max-h-full max-w-full object-contain"
                                            style={{ filter }} />
                                    ) : (
                                        <img src={previewUrl} alt="preview" className="max-h-full max-w-full object-contain"
                                            style={{ filter }} />
                                    )}
                                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.4)]" />
                                </div>

                                {/* Floating Tooltip for dragging */}
                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <span className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black text-white/60 tracking-widest uppercase border border-white/10">
                                        Drag elements to reposition
                                    </span>
                                </div>

                                {/* Floating Caption Toolbar (New) */}
                                {captionFocused && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] glass p-2 rounded-2xl border-white/10 flex gap-4 items-center"
                                    >
                                        <div className="flex gap-2 border-r border-white/10 pr-4">
                                            {COLORS.map(c => (
                                                <button 
                                                    key={c}
                                                    onClick={() => updateMeta("color", c)}
                                                    className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-125"
                                                    style={{ background: c }}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto max-w-[150px] no-scrollbar">
                                            {FONTS.map(f => (
                                                <button
                                                    key={f.value}
                                                    onClick={() => updateMeta("font", f.value)}
                                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-colors ${captionPos.font === f.value ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                                            <span className="text-[10px] font-black text-white/40 uppercase">Rot</span>
                                            <span className="text-[10px] font-black text-purple-400">{captionPos.angle}°</span>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Draggable caption */}
                                <motion.div
                                    drag={!captionFocused}
                                    dragMomentum={false} dragElastic={0}
                                    dragConstraints={mediaPreviewRef}
                                    onDragEnd={(_, info) => {
                                        if (!mediaPreviewRef.current) return;
                                        const r = mediaPreviewRef.current.getBoundingClientRect();
                                        
                                        // Calculate center point relative to container
                                        const nx = ((info.point.x - r.left) / r.width) * 100;
                                        const ny = ((info.point.y - r.top) / r.height) * 100;
                                        
                                        updateMeta("x", Math.max(0, Math.min(100, nx))); 
                                        updateMeta("y", Math.max(0, Math.min(100, ny)));
                                    }}
                                    className="absolute cursor-grab active:cursor-grabbing touch-none z-40"
                                    style={{
                                        left: `${meta?.position?.x ?? captionPos.x}%`,
                                        top: `${meta?.position?.y ?? captionPos.y}%`,
                                        transform: `translate(-50%,-50%) rotate(${meta?.position?.angle ?? captionPos.angle}deg)`,
                                    }}
                                >
                                    <input
                                        value={meta?.text ?? caption}
                                        onChange={e => {
                                            const v = e.target.value;
                                            setCaption(v);
                                            setSlideMeta(p => { const m = [...p]; m[slideIndex] = { ...(m[slideIndex] || {}), text: v }; return m; });
                                        }}
                                        placeholder="Add caption…"
                                        className="bg-transparent outline-none border-none text-center w-48 md:w-64"
                                        style={{
                                            fontSize: `${meta?.position?.size ?? captionPos.size}px`,
                                            fontFamily: meta?.position?.font ?? captionPos.font,
                                            color: meta?.position?.color ?? captionPos.color,
                                            backgroundColor: (meta?.position?.bubble ?? captionPos.bubble) ? "rgba(0,0,0,.5)" : "transparent",
                                            padding: (meta?.position?.bubble ?? captionPos.bubble) ? "6px 12px" : 0,
                                            borderRadius: (meta?.position?.bubble ?? captionPos.bubble) ? 12 : 0,
                                            textShadow: (meta?.position?.shadow ?? captionPos.shadow) ? "0 2px 8px rgba(0,0,0,.7)" : "none",
                                            fontWeight: 700,
                                        }}
                                        onFocus={() => setCaptionFocused(true)}
                                        onBlur={() => setCaptionFocused(false)}
                                    />
                                </motion.div>

                                {/* Stickers */}
                                {stickers.map((st, i) => (
                                    <motion.div key={i}
                                        drag dragMomentum={false} dragElastic={0} dragConstraints={mediaPreviewRef}
                                        onPointerDown={() => setActiveStk(i)}
                                        onDragEnd={(_, info) => {
                                            if (!mediaPreviewRef.current) return;
                                            const r = mediaPreviewRef.current.getBoundingClientRect();
                                            setStickers(p => p.map((s, j) => j === i ? { ...s, x: ((info.point.x - r.left) / r.width) * 100, y: ((info.point.y - r.top) / r.height) * 100 } : s));
                                        }}
                                        className="absolute cursor-grab active:cursor-grabbing select-none"
                                        style={{
                                            left: `${st.x}%`, top: `${st.y}%`,
                                            transform: `translate(-50%,-50%) rotate(${st.angle || 0}deg) scale(${st.scale || 1})`,
                                            outline: activeStk === i ? "2px solid rgba(168,85,247,.7)" : "none",
                                            borderRadius: 8, fontSize: st.size || 28,
                                        }}
                                    >{st.text}</motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="empty" 
                                initial={{ opacity: 0, scale: .9 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                transition={spring}
                                className="flex flex-col items-center gap-8 text-center px-8 py-20 rounded-[3rem] border-2 border-dashed border-white/5 bg-white/[0.02] backdrop-blur-3xl"
                                style={{ width: '80%', maxWidth: '500px' }}
                            >
                                {/* Animated orbit rings */}
                                <div className="relative w-48 h-48 flex items-center justify-center">
                                    <motion.div className="absolute inset-0 rounded-full border-2 border-purple-500/20"
                                        animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />
                                    <motion.div className="absolute inset-4 rounded-full border-2 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]"
                                        animate={{ rotate: -360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
                                    <motion.div className="absolute inset-8 rounded-full border-2 border-pink-500/20"
                                        animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
                                    
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => mediaInputRef.current?.click()}
                                        animate={{ 
                                            scale: [1, 1.05, 1],
                                            boxShadow: ["0 0 20px rgba(168,85,247,0.2)", "0 0 40px rgba(168,85,247,0.4)", "0 0 20px rgba(168,85,247,0.2)"]
                                        }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="relative z-10 w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl cursor-pointer overflow-hidden group"
                                        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.4), rgba(59,130,246,0.4))", backdropFilter: "blur(12px)" }}
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        📸
                                    </motion.div>
                                </div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white tracking-tight">Create Your Story</h2>
                                    <p className="text-white/40 text-sm font-medium max-w-[280px] mx-auto leading-relaxed">
                                        Share your moments with the orbit. 
                                        Photos & videos supported.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
                                    <motion.button 
                                        whileHover={{ scale: 1.05, y: -2 }} 
                                        whileTap={{ scale: .95 }}
                                        onClick={() => mediaInputRef.current?.click()}
                                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-sm font-black text-white shadow-xl shadow-purple-500/20"
                                        style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
                                    >
                                        <IconImage s={18} /> Choose Media
                                    </motion.button>
                                    <motion.button 
                                        whileHover={{ scale: 1.05, y: -2 }} 
                                        whileTap={{ scale: .95 }}
                                        onClick={startCamera}
                                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-sm font-black text-white/70 bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        <IconCamera s={18} /> Use Camera
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Filmstrip */}
                <AnimatePresence>
                    {slideFiles.length > 0 && (
                        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={spring}
                            className="absolute bottom-0 left-0 right-0 p-3"
                            style={{ background: "linear-gradient(to top, rgba(0,0,0,.9), transparent)" }}
                        >
                            <div className="flex gap-2 overflow-x-auto pb-1 px-4 no-scrollbar" style={{ scrollbarWidth: "none" }}>
                                {slideFiles.map((f, i) => {
                                    const u = URL.createObjectURL(f);
                                    return (
                                        <motion.div key={`${f.name}-${i}`}
                                            initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring, delay: i * 0.04 }}
                                            onClick={() => setSlideIndex(i)}
                                            className={`relative flex-shrink-0 w-20 h-28 rounded-2xl overflow-hidden cursor-pointer transition-all border-2 ${i === slideIndex ? "border-purple-500 scale-110 shadow-2xl shadow-purple-500/20" : "border-transparent opacity-50 hover:opacity-80"}`}
                                        >
                                            <img src={u} alt="" className="w-full h-full object-cover" onLoad={() => URL.revokeObjectURL(u)} />
                                            <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded-lg text-[8px] font-black text-white">
                                                #{i + 1}
                                            </div>
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setSlideFiles(p => p.filter((_, j) => j !== i));
                                                    if (slideIndex >= i && slideIndex > 0) setSlideIndex(slideIndex - 1);
                                                }}
                                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white"
                                            ><IconX s={10} /></button>
                                        </motion.div>
                                    );
                                })}
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: .95 }}
                                    onClick={() => mediaInputRef.current?.click()}
                                    className="flex-shrink-0 w-20 h-28 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 text-white/20 hover:border-purple-500 hover:text-purple-400 text-2xl grid place-items-center transition-all"
                                >+</motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <input type="file" ref={mediaInputRef} onChange={e => addFiles(e.target.files)} accept="image/*,video/*" multiple className="hidden" />
            </div>

            {/* ──────────── RIGHT: Sidebar ──────────── */}
            <motion.div
                initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...spring, delay: 0.2 }}
                className="w-72 xl:w-80 flex flex-col h-full overflow-hidden border-l"
                style={{ background: "rgba(10,10,20,.95)", backdropFilter: "blur(24px)", borderColor: "rgba(255,255,255,.06)" }}
            >
                {/* Tab bar */}
                <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,.06)" }}>
                    {TABS.map(tab => {
                        const Icon = TAB_ICONS[tab];
                        const active = activeTab === tab;
                        return (
                            <motion.button key={tab}
                                onClick={() => setActiveTab(tab)}
                                whileTap={{ scale: .92 }}
                                className={`flex-1 py-3.5 flex flex-col items-center gap-1 transition-all relative ${active ? "text-purple-400" : "text-white/30 hover:text-white/60"}`}
                            >
                                <Icon s={16} />
                                <span className="text-[8px] font-black uppercase tracking-widest">{tab}</span>
                                {active && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-purple-500" />}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Panel body (scrollable) */}
                <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,.1) transparent" }}>
                    <AnimatePresence mode="wait">
                        {/* ── Caption ── */}
                        {activeTab === "caption" && (
                            <motion.div key="caption" variants={panelVariants} initial="hidden" animate="show" exit="exit" className="space-y-4">
                                <Label>Position (drag on canvas)</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label tiny>Size</Label>
                                        <input type="range" min="12" max="48" step="1" value={captionPos.size}
                                            onChange={e => updateMeta("size", +e.target.value)} className="w-full mt-1 accent-purple-500" />
                                        <div className="text-xs text-white/30 font-mono mt-0.5">{captionPos.size}px</div>
                                    </div>
                                    <div>
                                        <Label tiny>Rotation</Label>
                                        <input type="range" min="-180" max="180" step="1" value={captionPos.angle}
                                            onChange={e => updateMeta("angle", +e.target.value)} className="w-full mt-1 accent-purple-500" />
                                        <div className="text-xs text-white/30 font-mono mt-0.5">{captionPos.angle}°</div>
                                    </div>
                                </div>
                                <div>
                                    <Label tiny>Color</Label>
                                    <input type="color" value={captionPos.color} onChange={e => updateMeta("color", e.target.value)}
                                        className="w-full h-9 rounded-xl mt-1 cursor-pointer border-0 bg-transparent" />
                                </div>
                                <div>
                                    <Label tiny>Font</Label>
                                    <select value={captionPos.font} onChange={e => updateMeta("font", e.target.value)}
                                        className="w-full mt-1 rounded-xl text-sm text-white py-2.5 px-3 outline-none"
                                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>
                                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    {[["bubble", "Bubble"], ["shadow", "Shadow"]].map(([key, label]) => (
                                        <Toggle key={key} label={label} checked={!!captionPos[key]} onChange={v => updateMeta(key, v)} />
                                    ))}
                                </div>
                                <div>
                                    <Label tiny>Scale Media</Label>
                                    <input type="range" min="0.5" max="2" step="0.05" value={mediaScale}
                                        onChange={e => setMediaScale(+e.target.value)} className="w-full mt-1 accent-purple-500" />
                                    <div className="text-xs text-white/30 font-mono mt-0.5">{mediaScale.toFixed(2)}×</div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Filter ── */}
                        {activeTab === "filter" && (
                            <motion.div key="filter" variants={panelVariants} initial="hidden" animate="show" exit="exit" className="space-y-3">
                                <Label>Visual Filter</Label>
                                {FILTERS.map(f => (
                                    <motion.button key={f.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: .98 }}
                                        onClick={() => setFilter(f.value)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${filter === f.value ? "text-purple-300" : "text-white/50 hover:text-white/80"}`}
                                        style={{ background: filter === f.value ? "rgba(168,85,247,.15)" : "rgba(255,255,255,.04)", border: `1px solid ${filter === f.value ? "rgba(168,85,247,.4)" : "rgba(255,255,255,.06)"}` }}
                                    >
                                        <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden">
                                            {previewUrl ? <img src={previewUrl} alt="" className="w-full h-full object-cover" style={{ filter: f.value }} /> : <div className="w-full h-full" style={{ background: "rgba(168,85,247,.3)" }} />}
                                        </div>
                                        {f.name}
                                        {filter === f.value && <motion.div layoutId="filter-dot" className="ml-auto w-2 h-2 rounded-full bg-purple-400" />}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}

                        {/* ── Stickers ── */}
                        {activeTab === "sticker" && (
                            <motion.div key="sticker" variants={panelVariants} initial="hidden" animate="show" exit="exit" className="space-y-4">
                                <Label>Add Sticker</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {STICKER_EMOJIS.map(s => (
                                        <motion.button key={s} whileHover={{ scale: 1.2 }} whileTap={{ scale: .9 }}
                                            onClick={() => setStickers(p => [...p, { text: s, x: 50, y: 40, size: 28, scale: 1, angle: 0 }])}
                                            className="w-full aspect-square rounded-xl text-2xl flex items-center justify-center"
                                            style={{ background: "rgba(255,255,255,.06)" }}
                                        >{s}</motion.button>
                                    ))}
                                </div>
                                {activeStk !== null && stickers[activeStk] && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,.06)" }}>
                                        <Label tiny>Selected sticker controls</Label>
                                        <div>
                                            <Label tiny>Rotate</Label>
                                            <input type="range" min="-180" max="180" step="1" value={stickers[activeStk].angle || 0}
                                                onChange={e => setStickers(p => p.map((s, i) => i === activeStk ? { ...s, angle: +e.target.value } : s))} className="w-full accent-purple-500" />
                                        </div>
                                        <div>
                                            <Label tiny>Scale</Label>
                                            <input type="range" min="0.5" max="3" step="0.05" value={stickers[activeStk].scale || 1}
                                                onChange={e => setStickers(p => p.map((s, i) => i === activeStk ? { ...s, scale: +e.target.value } : s))} className="w-full accent-purple-500" />
                                        </div>
                                        <button onClick={() => { setStickers(p => p.filter((_, i) => i !== activeStk)); setActiveStk(null); }}
                                            className="w-full py-2 rounded-xl text-xs font-black text-red-400"
                                            style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)" }}
                                        >Remove sticker</button>
                                    </motion.div>
                                )}
                                {stickers.length > 0 && (
                                    <button onClick={() => { setStickers([]); setActiveStk(null); }}
                                        className="w-full py-2.5 rounded-xl text-xs font-black text-white/40 hover:text-white/70 transition-colors"
                                        style={{ background: "rgba(255,255,255,.04)" }}
                                    >Clear all stickers</button>
                                )}
                            </motion.div>
                        )}

                        {/* ── Music ── */}
                        {activeTab === "music" && (
                            <motion.div key="music" variants={panelVariants} initial="hidden" animate="show" exit="exit" className="space-y-4">
                                <Label>Selected Track</Label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 group-hover:scale-110 transition-transform">
                                        <IconMusic s={16} />
                                    </div>
                                    <input value={music} onChange={e => setMusic(e.target.value)}
                                        placeholder="Paste link or pick below…"
                                        className="w-full py-3.5 pl-10 pr-10 rounded-2xl text-sm text-white outline-none placeholder-white/20 transition-all focus:ring-2 focus:ring-purple-500/50"
                                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" }}
                                    />
                                    {music && <button onClick={() => setMusic("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
                                    ><IconX s={14} /></button>}
                                </div>
                                
                                <Label tiny className="mt-6">Suggested Tracks</Label>
                                <div className="space-y-2">
                                    {MUSIC_TRACKS.map(t => (
                                        <motion.button 
                                            key={t.name}
                                            whileHover={{ scale: 1.02, x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setMusic(`${t.name} - ${t.artist}`)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${music === `${t.name} - ${t.artist}` ? 'bg-purple-500/20 border-purple-500/40 text-white' : 'bg-white/5 border-white/5 text-white/40 hover:text-white/70'}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-lg">
                                                🎵
                                            </div>
                                            <div className="flex-1 text-left overflow-hidden">
                                                <div className="text-xs font-black truncate">{t.name}</div>
                                                <div className="text-[10px] font-bold opacity-50 truncate">{t.artist}</div>
                                            </div>
                                            <div className="text-[9px] font-mono opacity-30">{t.duration}</div>
                                        </motion.button>
                                    ))}
                                </div>
                                <p className="text-white/20 text-[10px] font-medium leading-relaxed px-1">Adding a track will overlay audio in your story for all slides.</p>
                            </motion.div>
                        )}

                        {/* ── Audience ── */}
                        {activeTab === "audience" && (
                            <motion.div key="audience" variants={panelVariants} initial="hidden" animate="show" exit="exit" className="space-y-3">
                                <Label>Who can see this?</Label>
                                {AUDIENCE_OPTIONS.map(a => {
                                    const Icon = a.icon;
                                    const active = audience === a.id;
                                    return (
                                        <motion.button key={a.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: .98 }}
                                            onClick={() => setAudience(a.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${active ? "text-white" : "text-white/50 hover:text-white/80"}`}
                                            style={{ background: active ? "linear-gradient(135deg,rgba(124,58,237,.3),rgba(37,99,235,.3))" : "rgba(255,255,255,.04)", border: `1px solid ${active ? "rgba(168,85,247,.4)" : "rgba(255,255,255,.06)"}` }}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "text-purple-300" : "text-white/40"}`}
                                                style={{ background: active ? "rgba(168,85,247,.2)" : "rgba(255,255,255,.06)" }}>
                                                <Icon s={16} />
                                            </div>
                                            <span className="font-bold text-sm">{a.label}</span>
                                            {active && <motion.div layoutId="aud-dot" className="ml-auto w-2 h-2 rounded-full bg-purple-400" />}
                                        </motion.button>
                                    );
                                })}
                                {audience === "CLOSE_FRIENDS" && (
                                    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        onClick={() => setShowRecipients(true)}
                                        className="w-full py-3 rounded-xl text-sm font-black transition-colors"
                                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" }}
                                    >
                                        {selectedRecipients.length ? `${selectedRecipients.length} recipients selected` : "Choose recipients →"}
                                    </motion.button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Share button */}
                <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,.06)" }}>
                    {error && (
                        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs font-bold mb-3 text-center">{error}</motion.p>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 60px rgba(124,58,237,.4)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleShare}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl font-black text-sm tracking-wide disabled:opacity-50 relative overflow-hidden"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
                    >
                        <motion.div
                            className="absolute inset-0 opacity-0"
                            animate={{ opacity: [0, .2, 0], x: ["-100%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent)" }}
                        />
                        <span className="relative z-10">
                            {loading ? "SHARING…" : audience === "CLOSE_FRIENDS" && !selectedRecipients.length ? "SELECT FRIENDS →" : "SHARE STORY ✦"}
                        </span>
                    </motion.button>
                </div>
            </motion.div>

            <RecipientSelector
                isOpen={showRecipients}
                onClose={() => setShowRecipients(false)}
                onSelectRecipients={recipients => { setSelectedRecipients(recipients); setShowRecipients(false); submit(recipients); }}
            />
        </motion.div>
    );
}

// ── Tiny helpers ──
function Label({ children, tiny }) {
    return (
        <p className={`font-black uppercase tracking-widest text-white/40 ${tiny ? "text-[9px]" : "text-[10px] mb-1"}`}>{children}</p>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <motion.button
            onClick={() => onChange(!checked)}
            whileTap={{ scale: .94 }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${checked ? "text-purple-300" : "text-white/40"}`}
            style={{ background: checked ? "rgba(168,85,247,.15)" : "rgba(255,255,255,.04)", border: `1px solid ${checked ? "rgba(168,85,247,.4)" : "rgba(255,255,255,.06)"}` }}
        >{label}</motion.button>
    );
}
