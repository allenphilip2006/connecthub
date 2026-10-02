import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { postService, userService, searchService } from "../services/api";
import { useCharacter } from "../context/CharacterContext";
import { mediaUrl } from '../lib/config';
import {
    Camera, Image as ImageIcon, X, Plus, Hash, AtSign,
    MapPin, UserPlus, Settings, ChevronDown, Check,
    Crop, Sliders, Palette, Type, Globe, Users, Star,
    AlertCircle
} from "lucide-react";

function CreatePost() {
    const navigate = useNavigate();
    const { setEmotion, showBubble } = useCharacter();
    const [content, setContent] = useState("");
    const [files, setFiles] = useState([]); // [{ file, preview, type, brightness, contrast, saturation, filter, aspect, tags: [], textOverlays: [] }]
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [postType, setPostType] = useState("IMAGE");
    const [activeEditorTab, setActiveEditorTab] = useState("crop"); // crop, filters, adjust, text
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const scrollRef = useRef(null);

    // Right panel states
    const [showCounts, setShowCounts] = useState(true);
    const [allowComments, setAllowComments] = useState(true);
    const [allowSharing, setAllowSharing] = useState(true);
    const [allowSaves, setAllowSaves] = useState(true);
    const [audience, setAudience] = useState("Everyone");
    const [altText, setAltText] = useState("");
    const [location, setLocation] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
    const [hideFromExplore, setHideFromExplore] = useState(false);
    const [disableResharing, setDisableResharing] = useState(false);
    const [scheduleDate, setScheduleDate] = useState("");
    const [archiveAfter24, setArchiveAfter24] = useState(false);
    const [collabUser, setCollabUser] = useState(null);
    const [collabQuery, setCollabQuery] = useState("");
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [showUserSuggestions, setShowUserSuggestions] = useState(false);
    const [showHashtags, setShowHashtags] = useState(false);
    const [hashtagSuggestions, setHashtagSuggestions] = useState([]);

    const [uploadProgress, setUploadProgress] = useState(0);
    const [isPosted, setIsPosted] = useState(false);
    const [isError, setIsError] = useState(false);

    const activeMedia = files[activeIndex] || null;

    useEffect(() => {
        setEmotion('thinking', 3000) 
        showBubble('What are we creating? ✨') 
    }, [setEmotion, showBubble]);

    const filters = [
        { name: "Normal", value: "none" },
        { name: "Bright", value: "brightness(120%) contrast(110%)" },
        { name: "Fade", value: "brightness(110%) opacity(0.8) contrast(90%)" },
        { name: "Vivid", value: "saturate(150%) contrast(110%)" },
        { name: "Warm", value: "sepia(30%) saturate(120%) brightness(110%)" },
        { name: "Cool", value: "hue-rotate(20deg) saturate(110%) brightness(110%)" },
        { name: "Mono", value: "grayscale(100%) brightness(110%) contrast(110%)" },
        { name: "Noir", value: "grayscale(100%) contrast(150%) brightness(80%)" },
        { name: "Glow", value: "brightness(130%) saturate(120%) contrast(90%)" },
        { name: "Soft", value: "brightness(105%) saturate(80%) blur(0.5px)" },
    ];

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length + files.length > 10) {
            setError("Max 10 files allowed.");
            return;
        }

        const newEntries = selectedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
            brightness: 100,
            contrast: 100,
            saturation: 100,
            filter: "none",
            aspect: "square",
            tags: [],
            textOverlays: []
        }));

        setFiles(prev => [...prev, ...newEntries]);
        if (files.length === 0) setActiveIndex(0);
        setEmotion("excited", 2000);
        if (Math.random() < 0.4) showBubble("Looking good 📸");

        // Auto-switch postType
        if (newEntries.some(e => e.type === "VIDEO")) {
            setPostType("VIDEO");
        } else {
            setPostType("IMAGE");
        }
    };

    const removeFile = (index) => {
        setFiles(prev => {
            const next = prev.filter((_, i) => i !== index);
            if (activeIndex >= next.length) setActiveIndex(Math.max(0, next.length - 1));
            return next;
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer?.files || []);
        if (dropped.length > 0) {
            handleFileChange({ target: { files: dropped } });
        }
    };

    const updateActiveMedia = (updates) => {
        setFiles(prev => {
            const next = [...prev];
            next[activeIndex] = { ...next[activeIndex], ...updates };
            return next;
        });
    };

    // Handle Draggable Text
    const addTextOverlay = () => {
        const text = prompt("Enter overlay text:");
        if (!text) return;

        const newOverlay = {
            id: crypto.randomUUID(),
            text,
            x: 50,
            y: 50,
            fontSize: 24,
            color: "#ffffff",
            fontFamily: "Inter",
            bubble: false,
            shadow: true,
            angle: 0
        };

        updateActiveMedia({
            textOverlays: [...(activeMedia.textOverlays || []), newOverlay]
        });
    };

    const updateTextOverlay = (id, updates) => {
        updateActiveMedia({
            textOverlays: activeMedia.textOverlays.map(t => t.id === id ? { ...t, ...updates } : t)
        });
    };

    const removeTextOverlay = (id) => {
        updateActiveMedia({
            textOverlays: activeMedia.textOverlays.filter(t => t.id !== id)
        });
    };

    // Handle "Tag People" click on image
    const handleImageClick = (e) => {
        if (activeEditorTab !== "tag") return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Open tag input at this position
        setTaggingPosition({ x, y });
    };

    const addTag = (user) => {
        if (!taggingPosition) return;

        const newTag = {
            x: taggingPosition.x,
            y: taggingPosition.y,
            username: user.username,
            userId: user.id,
            email: user.email
        };

        updateActiveMedia({
            tags: [...(activeMedia.tags || []), newTag]
        });
        setTaggingPosition(null);
        setTagQuery("");
    };

    const removeTag = (index) => {
        updateActiveMedia({
            tags: activeMedia.tags.filter((_, i) => i !== index)
        });
    };

    const [taggingPosition, setTaggingPosition] = useState(null);
    const [tagQuery, setTagQuery] = useState("");
    const [tagSuggestions, setTagSuggestions] = useState([]);

    useEffect(() => {
        if (tagQuery.length > 1) {
            userService.searchUsers(tagQuery).then(setTagSuggestions);
        } else {
            setTagSuggestions([]);
        }
    }, [tagQuery]);
    useEffect(() => {
        const lastWord = content.split(/\s+/).pop() || "";
        if (lastWord.startsWith("#") && lastWord.length > 1) {
            searchService.searchHashtags(lastWord.slice(1)).then(setHashtagSuggestions);
            setShowHashtags(true);
            setShowUserSuggestions(false); // Ensure only one shows
        } else if (lastWord.startsWith("@") && lastWord.length > 1) {
            userService.searchUsers(lastWord.slice(1)).then(setUserSuggestions);
            setShowUserSuggestions(true);
            setShowHashtags(false); // Ensure only one shows
        } else {
            setShowHashtags(false);
            setShowUserSuggestions(false);
        }
    }, [content]);

    const insertSuggestion = (suggestion, type) => {
        const words = content.split(/\s+/);
        words.pop();
        const prefix = words.length > 0 ? words.join(" ") + " " : "";
        const symbol = type === "tag" ? "#" : "@";
        const next = prefix + symbol + suggestion + " ";
        setContent(next);
        setShowHashtags(false);
        setShowUserSuggestions(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setUploadProgress(0);
        setIsError(false);

        if (postType !== "TEXT" && files.length === 0) {
            setError("Please select media.");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("content", content);
        formData.append("postType", postType);
        formData.append("showCounts", showCounts ? "true" : "false");
        formData.append("allowComments", allowComments ? "true" : "false");
        formData.append("allowSharing", allowSharing ? "true" : "false");
        formData.append("allowSaves", allowSaves ? "true" : "false");
        formData.append("audience", audience);
        if (altText) formData.append("altText", altText);
        if (location) formData.append("location", location);
        if (collabUser) formData.append("collabWith", collabUser.email);

        // Handle multiple files
        files.forEach((f, i) => {
            formData.append(`files`, f.file);
            // Append editing metadata
            formData.append(`mediaMeta_${i}`, JSON.stringify({
                filter: f.filter,
                brightness: f.brightness,
                contrast: f.contrast,
                saturation: f.saturation,
                aspect: f.aspect,
                tags: f.tags,
                textOverlays: f.textOverlays
            }));
        });

        // Simulate progress
        const interval = setInterval(() => {
            setUploadProgress(p => p < 90 ? p + 10 : p);
        }, 200);

        try {
            await postService.createPost(formData);
            clearInterval(interval);
            setUploadProgress(100);
            setIsPosted(true);
            setEmotion('celebrating', 5000) 
            showBubble('Posted! 🎉') 
            setTimeout(() => navigate("/home"), 1200);
        } catch (err) {
            clearInterval(interval);
            setIsError(true);
            const msg = err?.response?.data || "Failed to post.";
            setError(typeof msg === 'string' ? msg : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1100px] mx-auto py-8 px-4 lg:px-6 min-h-screen flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-[2.5rem] overflow-hidden w-full shadow-2xl border-white/5 bg-[#0a0a0f]/80 backdrop-blur-3xl"
            >
                {/* Header Tabs */}
                <div className="flex border-b border-white/5 px-6 pt-2 bg-white/5 relative">
                    {["IMAGE", "VIDEO", "REEL", "TEXT", "COLLAB"].map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                setPostType(type);
                                if (type === "TEXT") setFiles([]);
                            }}
                            className={`relative px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${postType === type ? "text-white" : "text-white/40 hover:text-white/70"}`}
                        >
                            {type}
                            {postType === type && (
                                <motion.div
                                    layoutId="tab-indicator"
                                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row h-full min-h-[680px]">

                    {/* Left Panel: Media / Editor */}
                    <div className="w-full lg:w-[60%] bg-black/40 relative flex flex-col border-b lg:border-b-0 lg:border-r border-white/5">
                        <div className="flex-1 relative overflow-hidden group">
                            <AnimatePresence mode="wait">
                                {files.length === 0 && postType !== "TEXT" ? (
                                    <motion.div
                                        key="dropzone"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 p-8"
                                    >
                                        <div
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-full w-full rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group relative overflow-hidden"
                                        >
                                            {/* Animated Gradient Border Overlay */}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
                                            </div>

                                            <div className="relative">
                                                <motion.div
                                                    animate={{ y: [0, -10, 0] }}
                                                    transition={{ repeat: Infinity, duration: 3 }}
                                                    className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-2xl"
                                                >
                                                    {postType === "VIDEO" ? "🎥" : "🖼️"}
                                                </motion.div>
                                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                                                    <Plus size={16} className="text-white" />
                                                </div>
                                            </div>

                                            <div className="text-center">
                                                <h3 className="text-xl font-black text-white mb-1">Drag & drop or click to upload</h3>
                                                <p className="text-white/40 text-sm font-medium">Images, Videos up to 4K resolution</p>
                                            </div>

                                            <div className="flex gap-3 mt-4">
                                                <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-white/10 transition">
                                                    <ImageIcon size={14} /> Gallery
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-white/10 transition">
                                                    <Camera size={14} /> Camera
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : postType === "TEXT" ? (
                                    <motion.div key="text-editor" className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-blue-900/40 p-12 flex items-center justify-center text-center">
                                        <textarea
                                            placeholder="Type something amazing..."
                                            className="w-full bg-transparent text-4xl font-black text-white text-center outline-none resize-none placeholder-white/20"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div key="preview" className="absolute inset-0 flex items-center justify-center bg-black">
                                        {activeMedia?.type === "VIDEO" ? (
                                            <video src={activeMedia.preview} className="w-full h-full object-contain" controls />
                                        ) : (
                                            <div className="relative w-full h-full flex items-center justify-center media-preview-container" onClick={handleImageClick}>
                                                <img
                                                    src={activeMedia?.preview}
                                                    alt="Preview"
                                                    className={`max-w-full max-h-full object-contain transition-all duration-500`}
                                                    style={{
                                                        filter: `${activeMedia?.filter} brightness(${activeMedia?.brightness}%) contrast(${activeMedia?.contrast}%) saturate(${activeMedia?.saturation}%)`,
                                                        aspectRatio: activeMedia?.aspect === "square" ? "1/1" : activeMedia?.aspect === "portrait" ? "4/5" : activeMedia?.aspect === "landscape" ? "16/9" : "auto"
                                                    }}
                                                />
                                                {/* Text Overlays */}
                                                {(activeMedia?.textOverlays || []).map((t) => (
                                                    <motion.div
                                                        key={t.id}
                                                        drag
                                                        dragMomentum={false}
                                                        onDragEnd={(e, info) => {
                                                            const container = e.target.closest('.media-preview-container');
                                                            if (!container) return;
                                                            const rect = container.getBoundingClientRect();
                                                            const x = ((info.point.x - rect.left) / rect.width) * 100;
                                                            const y = ((info.point.y - rect.top) / rect.height) * 100;
                                                            updateTextOverlay(t.id, { x, y });
                                                        }}
                                                        className="absolute cursor-move select-none z-40 group touch-none"
                                                        style={{
                                                            left: `${t.x}%`,
                                                            top: `${t.y}%`,
                                                            position: 'absolute',
                                                            transform: 'translate(-50%, -50%)',
                                                            color: t.color,
                                                            fontSize: `${t.fontSize}px`,
                                                            fontFamily: t.fontFamily,
                                                            textShadow: t.shadow ? "0 2px 8px rgba(0,0,0,0.8)" : "none",
                                                            backgroundColor: t.bubble ? "rgba(0,0,0,0.6)" : "transparent",
                                                            padding: t.bubble ? "8px 16px" : "0",
                                                            borderRadius: "12px"
                                                        }}
                                                    >
                                                        {t.text}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeTextOverlay(t.id); }}
                                                            className="absolute -top-4 -right-4 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-75"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </motion.div>
                                                ))}

                                                {/* Tag pins overlay */}
                                                {(activeMedia?.tags || []).map((tag, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute w-8 h-8 rounded-full bg-purple-500 border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-black group"
                                                        style={{ left: `${tag.x}%`, top: `${tag.y}%`, transform: 'translate(-50%, -50%)' }}
                                                    >
                                                        {tag.username[0].toUpperCase()}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[8px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {tag.username}
                                                        </div>
                                                    </motion.div>
                                                ))}

                                                {/* Tag Input Popover */}
                                                {taggingPosition && (
                                                    <motion.div
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="absolute z-50 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl p-2 w-48"
                                                        style={{ left: `${taggingPosition.x}%`, top: `${taggingPosition.y}%`, transform: 'translate(-10%, 10%)' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input
                                                            autoFocus
                                                            placeholder="Search user..."
                                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] outline-none text-white"
                                                            value={tagQuery}
                                                            onChange={(e) => setTagQuery(e.target.value)}
                                                        />
                                                        <div className="mt-2 max-h-32 overflow-y-auto thin-purple-scroll">
                                                            {tagSuggestions.map(u => (
                                                                <button
                                                                    key={u.id}
                                                                    className="w-full flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg text-left"
                                                                    onClick={() => addTag(u)}
                                                                >
                                                                    <img src={mediaUrl(u.profileImage) || "/placeholder-avatar.svg"} className="w-5 h-5 rounded-full" />
                                                                    <span className="text-[10px] font-bold text-white/80">{u.username}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <button
                                                            className="w-full mt-1 p-1 text-[8px] text-white/20 hover:text-white/40 uppercase font-black"
                                                            onClick={() => setTaggingPosition(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeFile(activeIndex)}
                                            className="absolute top-6 right-6 p-3 rounded-full bg-black/60 text-white/80 hover:bg-red-500 transition-colors z-30"
                                        >
                                            <X size={18} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Media Filmstrip & Editor Tabs */}
                        {files.length > 0 && (
                            <div className="bg-black/60 border-t border-white/5 p-4 space-y-4">
                                {/* Filmstrip */}
                                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2" ref={scrollRef}>
                                    {files.map((f, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ scale: 1.05 }}
                                            onClick={() => setActiveIndex(i)}
                                            className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeIndex === i ? "border-purple-500 scale-105" : "border-transparent opacity-60"}`}
                                        >
                                            {f.type === "VIDEO" ? (
                                                <video src={f.preview} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={f.preview} className="w-full h-full object-cover" />
                                            )}
                                        </motion.div>
                                    ))}
                                    {files.length < 10 && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-20 h-20 shrink-0 rounded-xl bg-white/5 border border-white/10 border-dashed flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    )}
                                </div>

                                {/* Editor Tabs */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
                                        {[
                                            { id: "crop", icon: Crop, label: "Crop" },
                                            { id: "filters", icon: Palette, label: "Filters" },
                                            { id: "adjust", icon: Sliders, label: "Adjust" },
                                            { id: "tag", icon: UserPlus, label: "Tag" },
                                            { id: "text", icon: Type, label: "Text" }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveEditorTab(tab.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeEditorTab === tab.id ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
                                            >
                                                <tab.icon size={14} /> {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tab Content */}
                                    <div className="min-h-[80px]">
                                        {activeEditorTab === "crop" && (
                                            <div className="flex gap-3">
                                                {["original", "square", "portrait", "landscape"].map(a => (
                                                    <button
                                                        key={a}
                                                        onClick={() => updateActiveMedia({ aspect: a })}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeMedia?.aspect === a ? "bg-white text-black border-white" : "bg-white/5 text-white/60 border-white/10"}`}
                                                    >
                                                        {a}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {activeEditorTab === "filters" && (
                                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                                {filters.map(f => (
                                                    <button
                                                        key={f.name}
                                                        onClick={() => updateActiveMedia({ filter: f.value })}
                                                        className="flex flex-col items-center gap-2 group"
                                                    >
                                                        <div className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${activeMedia?.filter === f.value ? "border-purple-500" : "border-transparent opacity-60 group-hover:opacity-100"}`}>
                                                            <img src={activeMedia?.preview} className="w-full h-full object-cover" style={{ filter: f.value }} />
                                                        </div>
                                                        <span className="text-[9px] font-black text-white/40 uppercase group-hover:text-white transition-colors">{f.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {activeEditorTab === "adjust" && (
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                                                {["brightness", "contrast", "saturation"].map(key => (
                                                    <div key={key} className="flex flex-col gap-1">
                                                        <div className="flex justify-between text-[9px] font-black text-white/40 uppercase">
                                                            <span>{key}</span>
                                                            <span className="text-white/70">{activeMedia?.[key]}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="50"
                                                            max="200"
                                                            value={activeMedia?.[key] || 100}
                                                            onChange={(e) => updateActiveMedia({ [key]: Number(e.target.value) })}
                                                            className="w-full accent-purple-500"
                                                        />
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => updateActiveMedia({ brightness: 100, contrast: 100, saturation: 100 })}
                                                    className="px-3 py-1.5 rounded-lg bg-white/5 text-[9px] font-black uppercase text-white/60 hover:text-white hover:bg-white/10 self-end w-fit"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        )}
                                        {activeEditorTab === "tag" && (
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Tag Mode Active</span>
                                                    <p className="text-[10px] text-white/40 font-medium italic">Click anywhere on the image to drop a tag pin</p>
                                                </div>
                                                <div className="h-8 w-px bg-white/10 mx-2" />
                                                <div className="flex -space-x-2">
                                                    {(activeMedia?.tags || []).map((tag, i) => (
                                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-purple-500 flex items-center justify-center text-[10px] font-black group relative cursor-pointer" onClick={() => removeTag(i)}>
                                                            {tag.username[0].toUpperCase()}
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <X size={8} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {activeEditorTab === "text" && (
                                            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                                                <button
                                                    onClick={addTextOverlay}
                                                    className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-wider hover:bg-white/10 transition flex items-center gap-2 shrink-0"
                                                >
                                                    <Plus size={14} /> Add Text
                                                </button>

                                                {activeMedia?.textOverlays?.length > 0 && (
                                                    <>
                                                        <div className="h-8 w-px bg-white/10 mx-2 shrink-0" />
                                                        <div className="flex gap-3">
                                                            {["Inter", "Serif", "Mono"].map(f => (
                                                                <button
                                                                    key={f}
                                                                    onClick={() => updateTextOverlay(activeMedia.textOverlays[0].id, { fontFamily: f })}
                                                                    className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] font-black uppercase text-white/60 hover:text-white"
                                                                >
                                                                    {f}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => updateTextOverlay(activeMedia.textOverlays[0].id, { bubble: !activeMedia.textOverlays[0].bubble })}
                                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${activeMedia.textOverlays[0].bubble ? "bg-white text-black border-white" : "bg-white/5 text-white/60 border-white/10"}`}
                                                            >
                                                                Bubble
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Caption & Settings */}
                    <div className="w-full lg:w-[40%] p-8 flex flex-col gap-8 max-h-[800px] overflow-y-auto thin-purple-scroll">
                        {/* Profile Header */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px] shadow-xl">
                                <div className="w-full h-full rounded-[inherit] bg-black flex items-center justify-center text-sm font-black">
                                    {localStorage.getItem('username')?.[0]?.toUpperCase() || 'U'}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-black text-white leading-none mb-1">{localStorage.getItem('username') || 'New Post'}</h3>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.1em]">Sharing to {audience}</p>
                            </div>
                        </div>

                        {/* Caption Area - MADE MORE PROMINENT */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">Post Caption</label>
                                <div className={`text-[9px] font-black ${content.length > 2100 ? "text-red-500" : content.length > 1800 ? "text-orange-500" : "text-white/20"}`}>
                                    {content.length} / 2200
                                </div>
                            </div>
                            <div className="relative group">
                                <textarea
                                    placeholder="Write something amazing about this post..."
                                    className="w-full bg-white/5 border border-white/5 focus:border-purple-500/50 rounded-2xl p-5 text-lg font-medium outline-none resize-none placeholder-white/10 min-h-[160px] transition-all shadow-inner"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey && !showHashtags && !showUserSuggestions) {
                                            e.preventDefault();
                                            handleSubmit(e);
                                        }
                                    }}
                                    maxLength={2200}
                                />

                                {/* Suggestions Dropdowns */}
                                <AnimatePresence>
                                    {showHashtags && hashtagSuggestions.length > 0 && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-0 w-full mb-2 bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                                            {hashtagSuggestions.map(h => (
                                                <button key={h} onClick={() => insertSuggestion(h, "tag")} className="w-full px-5 py-3 text-left text-sm font-bold hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center gap-3">
                                                    <Hash size={14} className="text-purple-500" /> {h}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                    {showUserSuggestions && userSuggestions.length > 0 && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-0 w-full mb-2 bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                                            {userSuggestions.map(u => (
                                                <button key={u.email} onClick={() => insertSuggestion(u.username, "mention")} className="w-full px-5 py-3 text-left text-sm font-bold hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center gap-3">
                                                    <img src={mediaUrl(u.profileImage) || "/placeholder-avatar.svg"} className="w-6 h-6 rounded-full" />
                                                    <div className="flex flex-col">
                                                        <span className="text-white">{u.username}</span>
                                                        <span className="text-[10px] text-white/40">{u.email}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Extra Details */}
                        <div className="space-y-2">
                            {/* Collab Search (Only if COLLAB tab is active) */}
                            <AnimatePresence>
                                {postType === "COLLAB" && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative">
                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
                                                <Users size={18} />
                                            </div>
                                            {collabUser ? (
                                                <div className="flex-1 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <img src={mediaUrl(collabUser.profileImage) || "/placeholder-avatar.svg"} className="w-8 h-8 rounded-full" />
                                                        <span className="text-sm font-bold text-white">{collabUser.username}</span>
                                                    </div>
                                                    <button onClick={() => setCollabUser(null)} className="text-white/40 hover:text-white"><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <input
                                                    placeholder="Invite Collaborator..."
                                                    className="bg-transparent flex-1 text-sm font-bold outline-none text-white placeholder-purple-500/40"
                                                    value={collabQuery}
                                                    onChange={(e) => setCollabQuery(e.target.value)}
                                                />
                                            )}
                                        </div>
                                        {/* Collab Suggestions */}
                                        {!collabUser && collabQuery.length > 1 && userSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                                                {userSuggestions.map(u => (
                                                    <button key={u.id} onClick={() => { setCollabUser(u); setCollabQuery(""); }} className="w-full px-5 py-3 text-left text-sm font-bold hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center gap-3">
                                                        <img src={mediaUrl(u.profileImage) || "/placeholder-avatar.svg"} className="w-6 h-6 rounded-full" />
                                                        <span className="text-white">{u.username}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Tag People Button (Trigger Tag Tab) */}
                            <button
                                onClick={() => setActiveEditorTab("tag")}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group ${activeEditorTab === "tag" ? "bg-purple-500/20 border-purple-500" : "bg-white/5 border-white/5 hover:border-white/20"}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeEditorTab === "tag" ? "bg-purple-500 text-white" : "bg-purple-500/10 text-purple-500"}`}>
                                        <UserPlus size={18} />
                                    </div>
                                    <span className={`text-sm font-bold ${activeEditorTab === "tag" ? "text-white" : "text-white/80"}`}>Tag People</span>
                                </div>
                                <span className="text-xs font-black text-white/20 group-hover:text-white/40">
                                    {activeMedia?.tags?.length > 0 ? `${activeMedia.tags.length} Tagged` : "Tap Image"}
                                </span>
                            </button>

                            {/* Location */}
                            <div className="relative">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <MapPin size={18} />
                                    </div>
                                    <input
                                        placeholder="Add Location"
                                        className="bg-transparent flex-1 text-sm font-bold outline-none text-white placeholder-white/20"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Accessibility */}
                            <div className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden">
                                <button
                                    onClick={() => setIsAccessibilityOpen(!isAccessibilityOpen)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                                            <AlertCircle size={18} />
                                        </div>
                                        <span className="text-sm font-bold text-white/80">Accessibility</span>
                                    </div>
                                    <ChevronDown size={16} className={`text-white/20 transition-transform ${isAccessibilityOpen ? "rotate-180" : ""}`} />
                                </button>
                                <AnimatePresence>
                                    {isAccessibilityOpen && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="px-4 pb-4 overflow-hidden">
                                            <textarea
                                                placeholder="Write alt text for people with visual impairments..."
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-xs font-medium text-white/70 outline-none resize-none"
                                                rows={3}
                                                value={altText}
                                                onChange={(e) => setAltText(e.target.value)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Audience Selection */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">Audience</label>
                            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl">
                                {[
                                    { id: "Everyone", icon: Globe },
                                    { id: "Followers Only", icon: Users },
                                    { id: "Close Friends", icon: Star }
                                ].map(a => (
                                    <button
                                        key={a.id}
                                        onClick={() => setAudience(a.id)}
                                        className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${audience === a.id ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white/70"}`}
                                    >
                                        <a.icon size={16} />
                                        <span className="text-[9px] font-black uppercase tracking-wider">{a.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Settings & Advanced */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <Settings size={14} className="text-white/40" />
                                    <span className="text-xs font-bold text-white/60">Post Settings</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                {[
                                    { label: "Show Like Count", val: showCounts, set: setShowCounts, sub: "Only you will see the count if off" },
                                    { label: "Allow Comments", val: allowComments, set: setAllowComments },
                                    { label: "Allow Sharing", val: allowSharing, set: setAllowSharing },
                                    { label: "Allow Saves", val: allowSaves, set: setAllowSaves }
                                ].map(s => (
                                    <div key={s.label} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div>
                                            <div className="text-sm font-bold text-white/80">{s.label}</div>
                                            {s.sub && <div className="text-[10px] text-white/30 font-medium">{s.sub}</div>}
                                        </div>
                                        <button
                                            onClick={() => s.set(!s.val)}
                                            className={`w-11 h-6 rounded-full p-1 transition-colors ${s.val ? "bg-purple-500" : "bg-white/10"}`}
                                        >
                                            <motion.div animate={{ x: s.val ? 20 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-lg" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden">
                                <button
                                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
                                >
                                    <span className="text-xs font-black text-white/40 uppercase tracking-widest">Advanced Settings</span>
                                    <ChevronDown size={16} className={`text-white/20 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
                                </button>
                                <AnimatePresence>
                                    {isAdvancedOpen && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="px-4 pb-4 space-y-3 overflow-hidden">
                                            {[
                                                { label: "Hide from Explore", val: hideFromExplore, set: setHideFromExplore },
                                                { label: "Disable Resharing", val: disableResharing, set: setDisableResharing },
                                                { label: "Archive after 24h", val: archiveAfter24, set: setArchiveAfter24 }
                                            ].map(s => (
                                                <div key={s.label} className="flex items-center justify-between py-2">
                                                    <span className="text-xs font-bold text-white/60">{s.label}</span>
                                                    <button onClick={() => s.set(!s.val)} className={`w-9 h-5 rounded-full p-1 transition-colors ${s.val ? "bg-purple-500" : "bg-white/10"}`}>
                                                        <motion.div animate={{ x: s.val ? 16 : 0 }} className="w-3 h-3 bg-white rounded-full" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="pt-2 border-t border-white/5">
                                                <label className="text-[10px] font-black text-white/30 uppercase mb-2 block">Schedule Post</label>
                                                <input type="datetime-local" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-white/70 outline-none" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                                    <span className="text-xs font-bold text-red-500">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Share Button */}
                        <div className="pt-4 sticky bottom-0 bg-[#0a0a0f]/80 backdrop-blur-3xl pb-2">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={loading || (postType !== "TEXT" && files.length === 0)}
                                className={`w-full relative h-16 rounded-[1.25rem] overflow-hidden font-black uppercase tracking-[0.2em] shadow-2xl transition-all ${isError ? "bg-red-600" : isPosted ? "bg-green-600" : "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 shadow-purple-500/20"}`}
                            >
                                {/* Progress Bar Overlay */}
                                {loading && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        className="absolute inset-0 bg-white/20 z-0"
                                    />
                                )}

                                <span className="relative z-10 text-white flex items-center justify-center gap-3">
                                    {loading ? (
                                        <>Posting {uploadProgress}%</>
                                    ) : isPosted ? (
                                        <>
                                            <Check size={20} /> Posted!
                                        </>
                                    ) : isError ? (
                                        <>Error - Try Again</>
                                    ) : (
                                        "Share Post"
                                    )}
                                </span>
                            </motion.button>
                        </div>
                    </div>

                </div>
            </motion.div>

            {/* Hidden Inputs */}
            <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,video/*"
            />
            <input
                type="file"
                capture="environment"
                ref={cameraInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
        </div>
    );
}

export default CreatePost;
