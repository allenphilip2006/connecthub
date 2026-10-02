import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, X } from "lucide-react";
import { mediaUrl } from '../lib/config';

const ExploreModal = ({ open, post, onClose, onLike, onCommentOpen, onShare, onSave, showCounts, onNext, onPrev }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const wheelLockRef = useRef(0);
  const touchStartRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [burst, setBurst] = useState(false);
  const videoRef = useRef(null);

  if (!open || !post) return null;

  const isVideo = /\.(mp4|webm|ogg)$/i.test(post?.mediaUrl || "");

  const handleWheel = (e) => {
    const now = Date.now();
    if (now - wheelLockRef.current < 600) return;
    if (e.deltaY > 30 && onNext) {
      wheelLockRef.current = now;
      onNext();
    } else if (e.deltaY < -30 && onPrev) {
      wheelLockRef.current = now;
      onPrev();
    }
  };

  const onTouchStart = (e) => {
    if (!e.touches?.length) return;
    touchStartRef.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartRef.current == null) return;
    const endY = e.changedTouches?.[0]?.clientY ?? touchStartRef.current;
    const diff = touchStartRef.current - endY;
    touchStartRef.current = null;
    if (Math.abs(diff) < 40) return;
    if (diff > 0 && onNext) onNext();
    if (diff < 0 && onPrev) onPrev();
  };

  if (!open || !post) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/80" />
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className="relative w-full max-w-5xl glass rounded-3xl border-white/10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button onClick={onClose} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center border border-white/10">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_68px]">
            <div className="relative aspect-[9/16] bg-black">
              {post.mediaUrl ? (
                isVideo ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    src={mediaUrl(post.mediaUrl)}
                    muted={muted}
                    autoPlay
                    loop
                    playsInline
                    controls
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
                <div className="w-full h-full flex items-center justify-center text-white/60">No media</div>
              )}
              {isVideo && (
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-[10px] font-black bg-black/60 border border-white/10 hover:bg-black/80 transition"
                >
                  {muted ? "Unmute" : "Mute"}
                </button>
              )}
              <div className="absolute left-3 bottom-3 flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={mediaUrl(post.user?.profileImage) || "/placeholder-avatar.svg"}
                    className="w-full h-full object-cover"
                    alt="avatar"
                  />
                </div>
                <span className="text-white text-xs font-black">{post.user?.username || post.authorEmail?.split("@")[0] || "User"}</span>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-center gap-4 py-6">
              <button
                onClick={() => { setBurst(true); setTimeout(() => setBurst(false), 600); onLike(); }}
                className="relative w-12 h-12 rounded-full flex items-center justify-center bg-black/50 border border-white/10 hover:scale-110 transition overflow-hidden"
              >
                {burst && <span className="heart-burst" style={{ "--dx": "12px", "--dy": "-18px" }} />}
                <Heart className={`w-6 h-6 ${post.isLiked ? "text-red-500 fill-red-500" : "text-white"}`} />
              </button>
              <button onClick={onCommentOpen} className="w-12 h-12 rounded-full flex items-center justify-center bg-black/50 border border-white/10 hover:scale-110 transition">
                <MessageCircle className="w-6 h-6 text-white" />
              </button>
              <button onClick={onShare} className="w-12 h-12 rounded-full flex items-center justify-center bg-black/50 border border-white/10 hover:scale-110 transition">
                <Share2 className="w-6 h-6 text-white" />
              </button>
              <button onClick={onSave} className="w-12 h-12 rounded-full flex items-center justify-center bg-black/50 border border-white/10 hover:scale-110 transition">
                <Bookmark className={`w-6 h-6 ${post.isSaved ? "text-yellow-400 fill-yellow-400" : "text-white"}`} />
              </button>
              {showCounts && post.showCounts && (
                <div className="mt-2 text-[10px] text-white/80 font-black text-center">
                  <div>❤️ {post.likesCount || 0}</div>
                  <div>💬 {post.commentsCount || 0}</div>
                </div>
              )}
            </div>
          </div>
          <div className="p-4">
            <span className="text-white font-black text-sm">{post.user?.username || post.authorEmail?.split("@")[0] || "User"}</span>
            <p className="text-gray-300 text-sm mt-1">{post.content}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExploreModal;
