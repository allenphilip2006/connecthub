import { motion, AnimatePresence } from "framer-motion";
import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { postService } from "../services/api";
import CommentSection from "./CommentSection";
import ShareSheet from "./ShareSheet";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Edit2, Archive, Trash2 } from "lucide-react";
import { useLikes } from "../hooks/useLikes";
import { mediaUrl } from '../lib/config';

const PostCard = memo(({ post: initialPost, currentEmail, onRepost, setPosts, setEmotion, showBubble, onLike: onLikeProp }) => {
  const { post, onLike, setPost } = useLikes(initialPost, setEmotion, showBubble, onLikeProp);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const navigate = useNavigate();

  const isOwner = post.user?.email === currentEmail || post.authorEmail === currentEmail;

  const handleSave = async () => {
    const wasSaved = post.isSaved;
    setPost(prev => ({ ...prev, isSaved: !wasSaved }));
    try {
      if (wasSaved) {
        await postService.unsavePost(post.id);
      } else {
        await postService.savePost(post.id);
        setEmotion?.('thumbsup', 2000);
        showBubble?.('Saved for later 🔖', 1500);
      }
    } catch (err) {
      setPost(prev => ({ ...prev, isSaved: wasSaved }));
      console.error("Save toggle failed", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await postService.deletePost(post.id);
      setEmotion?.('shocked', 1500);
      showBubble?.('Gone forever! 😱', 1500);
      setPosts?.(prev => prev.filter(p => p.id !== post.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async () => {
    try {
      await postService.archivePost(post.id);
      setEmotion?.('shocked', 2000);
      showBubble?.(post.archived ? 'Coming back! 📦' : 'Archived it! 📦', 1500);
      setPost(prev => ({ ...prev, archived: !prev.archived }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    try {
      await postService.updatePost(post.id, editContent.trim());
      setPost(prev => ({ ...prev, content: editContent.trim() }));
      setIsEditing(false);
      setEmotion?.('happy', 2000);
      showBubble?.('Updated! ✨', 1500);
    } catch (err) {
      console.error(err);
      setEmotion?.('error', 2000);
      showBubble?.('Failed to update 😔', 1500);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-[550px] mx-auto mb-12"
    >
      <div className="glass-card rounded-[32px] border-white/5 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.user?.id}`)}>
            <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 to-blue-500">
              <img 
                src={mediaUrl(post.user?.profileImage) || "/placeholder-avatar.svg"} 
                className="w-full h-full rounded-full object-cover border-2 border-black" 
                alt="u" 
              />
            </div>
            <div>
              <h4 className="text-sm font-black text-white leading-none">{post.user?.username || 'User'}</h4>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Orbit Member</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {isOwner && (
              <>
                <button onClick={() => setIsEditing(!isEditing)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition">
                  <Edit2 size={14} />
                </button>
                <button onClick={handleArchive} className={`w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 transition ${post.archived ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
                  <Archive size={14} />
                </button>
                <button onClick={handleDelete} data-companion-hover="delete" data-tooltip="Delete Post" className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {isEditing ? (
            <div className="space-y-3">
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-purple-500 transition"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={handleUpdate} className="btn-gradient px-4 py-2 rounded-xl text-[10px] font-black uppercase">Save</button>
                <button onClick={() => setIsEditing(false)} className="glass px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white/40">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/80 leading-relaxed mb-4">{post.content}</p>
          )}

          {post.mediaUrl && (
            <div 
              data-companion-hover="post-image"
              className="rounded-2xl overflow-hidden glass border-none mb-4 aspect-square flex items-center justify-center bg-zinc-900/50 group relative cursor-pointer"
            >
              {post.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video src={mediaUrl(post.mediaUrl)} controls className="w-full h-full object-cover" />
              ) : (
                <img src={mediaUrl(post.mediaUrl)} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt="post" />
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center group relative">
                <button onClick={() => onLike(post.id)} data-companion-hover="like" data-tooltip="Like" className="flex items-center gap-2 transition-transform active:scale-125">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${post.isLiked ? 'bg-pink-500/10 text-[#ec4899]' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white'}`}>
                    <Heart className={`w-7 h-7 ${post.isLiked ? 'fill-current' : ''}`} />
                  </div>
                </button>
                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${post.isLiked ? 'text-[#ec4899]' : 'text-white/40'}`}>
                  {post.likesCount || 0} Likes
                </span>
              </div>

              <div className="flex flex-col items-center group relative">
                <button onClick={() => setShowComments(!showComments)} data-companion-hover="comment" data-tooltip="Comments" className="flex items-center gap-2">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${showComments ? 'bg-purple-500/10 text-purple-500' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white'}`}>
                    <MessageCircle className="w-7 h-7" />
                  </div>
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest mt-1 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  {post.commentsCount || 0} Comments
                </span>
              </div>

              <div className="flex flex-col items-center group relative">
                <button onClick={() => setShowShare(true)} data-companion-hover="share" data-tooltip="Share" className="w-14 h-14 rounded-full bg-white/5 text-white/40 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all active:scale-110">
                  <Share2 className="w-7 h-7" />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest mt-1 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">Share</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center group relative">
                <button onClick={handleSave} data-companion-hover="save" data-tooltip="Save Post" className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-125 ${post.isSaved ? 'bg-yellow-500/10 text-[#fbbf24]' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}>
                  <Bookmark className={`w-7 h-7 ${post.isSaved ? 'fill-[#fbbf24]' : ''}`} />
                </button>
                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${post.isSaved ? 'text-[#fbbf24]' : 'text-white/40'}`}>
                  {post.isSaved ? 'Saved' : 'Save'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showShare && (
        <ShareSheet open={showShare} onClose={() => setShowShare(false)} share={{ id: post.id, type: "post", url: `${window.location.origin}/post/${post.id}` }} />
      )}

      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white/[0.02] border-t border-white/5 rounded-b-[32px] -mt-8 mb-8 mx-2">
            <div className="p-4">
               <CommentSection postId={post.id} currentEmail={currentEmail} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default PostCard;
