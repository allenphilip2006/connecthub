import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { postService } from "../services/api";
import { useCharacter } from "../context/CharacterContext";
import { mediaUrl } from '../lib/config';

function CommentSection({ postId, currentEmail }) {
    const { setEmotion, showBubble } = useCharacter();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState(null); // { id, username }
    const [submitting, setSubmitting] = useState(false);

    const fetchComments = useCallback(async () => {
        try {
            const data = await postService.getComments(postId);
            setComments(data);
        } catch (err) {
            console.error("Failed to fetch comments", err);
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            setEmotion('thinking', 1500);
            showBubble('Say something! 💬', 1500);
            return;
        }

        setSubmitting(true);
        try {
            if (replyingTo) {
                await postService.replyToComment(postId, replyingTo.id, newComment);
                setEmotion('happy', 2000);
                showBubble(`Replied to ${replyingTo.username}! ✨`, 2000);
            } else {
                await postService.addComment(postId, newComment);
                setEmotion('excited', 2500);
                showBubble('Comment posted! 🎉', 2000);
            }
            
            setNewComment("");
            setReplyingTo(null);
            fetchComments();
        } catch (err) {
            console.error("Failed to post comment", err);
            setEmotion('error', 2000);
            showBubble('Couldn\'t post that... 😢', 2000);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (commentId, isLiked) => {
        try {
            if (isLiked) {
                await postService.unlikeComment(commentId);
            } else {
                await postService.likeComment(commentId);
            }
            fetchComments();
        } catch (err) {
            console.error("Like action failed", err);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await postService.deleteComment(commentId);
            fetchComments();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const topLevelComments = comments.filter(c => !c.parentCommentId);
    const getReplies = (parentId) => comments.filter(c => c.parentCommentId === parentId);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-4 thin-purple-scroll">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Fetching discussions...</p>
                    </div>
                ) : topLevelComments.length > 0 ? (
                    <div className="space-y-6">
                        {topLevelComments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                replies={getReplies(comment.id)}
                                onReply={() => {
                                    setReplyingTo({ id: comment.id, username: comment.author?.username || comment.authorEmail.split('@')[0] });
                                }}
                                onLike={handleLike}
                                onDelete={handleDelete}
                                currentEmail={currentEmail}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <span className="text-4xl mb-4">💬</span>
                        <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">No comments yet</p>
                    </div>
                )}
            </div>

            {/* Input Section */}
            <div className="p-6 bg-white/5 border-t border-white/5 shrink-0">
                <form onSubmit={handleSubmit} className="relative">
                    <AnimatePresence>
                        {replyingTo && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex items-center justify-between px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-t-2xl mb-[1px]"
                            >
                                <p className="text-[10px] font-black text-purple-300 uppercase tracking-wider">Replying to @{replyingTo.username}</p>
                                <button type="button" onClick={() => setReplyingTo(null)} className="text-purple-300 hover:text-white transition">✕</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className={`flex items-start gap-4 p-4 glass ${replyingTo ? 'rounded-b-2xl' : 'rounded-3xl'} border border-white/10 focus-within:border-purple-500/50 transition-all`}>
                        <textarea
                            placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600 font-medium resize-none min-h-[24px] max-h-[120px] py-1"
                            rows={1}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                        />
                        <button
                            disabled={submitting || !newComment.trim()}
                            className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center disabled:opacity-30 disabled:grayscale hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20"
                        >
                            {submitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">Post</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CommentItem({ comment, replies, onReply, onLike, onDelete, currentEmail }) {
    const [showReplies, setShowReplies] = useState(false);

    return (
        <div className="mb-4 group">
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[1px] flex-shrink-0">
                    <img
                        src={mediaUrl(comment.author?.profileImage) || `/placeholder-avatar.svg`}
                        className="w-full h-full rounded-full object-cover border border-black"
                        alt="u"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{comment.author?.username || comment.authorEmail.split('@')[0]}</span>
                        <span className="text-[9px] text-gray-600 font-bold uppercase">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-0.5 leading-relaxed">{comment.text}</p>

                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={() => onLike(comment.id, comment.isLiked)}
                            className={`text-[10px] font-black transition uppercase ${comment.isLiked ? "text-red-400" : "text-gray-500 hover:text-red-500"}`}
                        >
                            ❤️ {comment.likesCount || 0}
                        </button>
                        <button
                            onClick={onReply}
                            className="text-[10px] font-black text-gray-500 hover:text-vibrant transition uppercase"
                        >
                            Reply
                        </button>
                        {currentEmail === comment.authorEmail && (
                            <button
                                onClick={() => onDelete(comment.id)}
                                className="text-[10px] font-black text-gray-500 hover:text-red-400 transition uppercase"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Threaded Replies */}
            {replies.length > 0 && (
                <div className="ml-11 mt-3">
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase hover:text-gray-400 transition"
                    >
                        <span className="w-6 h-[1px] bg-gray-600/30" />
                        {showReplies ? `Hide Replies` : `View ${replies.length} Replies`}
                    </button>

                    <AnimatePresence>
                        {showReplies && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 mt-4 overflow-hidden"
                            >
                                {replies.map(reply => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        replies={[]}
                                        onReply={onReply}
                                        onLike={onLike}
                                        onDelete={onDelete}
                                        currentEmail={currentEmail}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

export default CommentSection;
