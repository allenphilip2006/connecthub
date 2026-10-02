import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storyService } from '../services/api';

const StoryViewer = ({ isOpen, onClose, story, onStoryViewed, onStoryUpdate }) => {
    const [commentInput, setCommentInput] = useState('');
    const [showComments, setShowComments] = useState(false);
    const myEmail = localStorage.getItem('userEmail');
    const containerRef = useRef(null);
    const timerRef = useRef(null);
    const lastViewRef = useRef(0);

    const recordViewRef = useRef(() => {});
    useEffect(() => {
        recordViewRef.current = async () => {
            if (!isOpen || !story?.id) return;
            const now = Date.now();
            if (now - lastViewRef.current < 2000) return;
            lastViewRef.current = now;
            try {
                await storyService.recordView(story.id);
                if (onStoryViewed) onStoryViewed(story.id);
            } catch (e) { void e; }
        };
    }, [isOpen, story?.id, onStoryViewed]);

    useEffect(() => {
        if (!isOpen) return;
        if (!containerRef.current) return;
        const schedule = () => {
            if (timerRef.current) return;
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                recordViewRef.current();
            }, 2000);
        };
        const clearT = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
        const obs = new IntersectionObserver(
            (entries) => {
                const e = entries[0];
                if (e && e.isIntersecting && e.intersectionRatio >= 0.6) schedule();
                else clearT();
            },
            { threshold: [0, 0.6, 1] }
        );
        obs.observe(containerRef.current);
        return () => {
            clearT();
            try { obs.disconnect(); } catch (e) { void e; }
        };
    }, [isOpen, story?.id, onStoryViewed]);

    if (!isOpen || !story) return null;

    const captionPosition = story.captionPosition ? JSON.parse(story.captionPosition) : { x: 50, y: 90 };

    const handleLikeToggle = async () => {
        try {
            if (story.likedByMe) {
                await storyService.unlikeStory(story.id);
            } else {
                await storyService.likeStory(story.id);
            }
            if (onStoryUpdate) onStoryUpdate(story.id);
        } catch (error) {
            console.error("Failed to toggle like", error);
        }
    };

    const handleAddComment = async () => {
        if (commentInput.trim() === '') return;
        try {
            await storyService.addComment(story.id, commentInput);
            setCommentInput('');
            if (onStoryUpdate) onStoryUpdate(story.id);
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await storyService.deleteComment(commentId);
            if (onStoryUpdate) onStoryUpdate(story.id);
        } catch (error) {
            console.error("Failed to delete comment", error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="relative w-full max-w-xl h-full max-h-[90vh] rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                        ref={containerRef}
                    >
                        {story.mediaUrl ? (
                            story.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video
                                    src={`http://localhost:62223${story.mediaUrl}`}
                                    controls
                                    autoPlay
                                    loop
                                    muted
                                    className="max-h-full max-w-full object-contain"
                                    onPlay={() => recordViewRef.current()}
                                />
                            ) : (
                                <img
                                    src={`http://localhost:62223${story.mediaUrl}`}
                                    alt="story"
                                    className="max-h-full max-w-full object-contain"
                                    onLoad={() => recordViewRef.current()}
                                    onClick={() => recordViewRef.current()}
                                />
                            )
                        ) : (
                            <p className="text-gray-400">No media available</p>
                        )}

                        {story.caption && (
                            <motion.div
                                className="absolute text-white text-lg font-bold text-center p-2"
                                style={{
                                    left: `${captionPosition.x}%`,
                                    top: `${captionPosition.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    maxWidth: '80%', // Ensure caption doesn't overflow
                                }}
                            >
                                {story.caption}
                            </motion.div>
                        )}

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white text-2xl z-10"
                        >
                            ✕
                        </button>

                        {/* Like Button and Count */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                            <button onClick={handleLikeToggle} className="text-2xl">
                                {story.likedByMe ? '❤️' : '🤍'}
                            </button>
                            <span className="text-white text-lg font-bold">{story.likeCount}</span>
                        </div>

                        {/* View Count and Viewers */}
                        {story.viewCount > 0 && (
                            <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full flex items-center gap-2">
                                <span>{story.viewCount} views</span>
                                {story.viewers && story.viewers.length > 0 && (
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {story.viewers.slice(0, 3).map((viewer, index) => (
                                            <img
                                                key={index}
                                                className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
                                                src={`http://localhost:62223${viewer.profileImage}`}
                                                alt={viewer.username}
                                                title={viewer.username}
                                            />
                                        ))}
                                        {story.viewers.length > 3 && (
                                            <span className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-gray-700 text-xs">
                                                +{story.viewers.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Comments Section */}
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
                            <button
                                onClick={() => setShowComments(!showComments)}
                                className="w-full text-center text-white/70 text-sm mb-2"
                            >
                                {showComments ? 'Hide Comments' : `View all ${story.comments?.length || 0} comments`}
                            </button>

                            <AnimatePresence>
                                {showComments && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 50 }}
                                        className="max-h-40 overflow-y-auto no-scrollbar bg-black/50 rounded-lg p-2 mb-2"
                                    >
                                        {story.comments && story.comments.length > 0 ? (
                                            story.comments.map((comment) => (
                                                <div key={comment.id} className="flex items-start gap-2 text-white text-sm mb-1">
                                                    <img
                                                        src={`http://localhost:62223${comment.user?.profileImage}`}
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
                                    className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-white text-sm outline-none"
                                />
                                <button onClick={handleAddComment} className="text-purple-400 font-bold">
                                    Post
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StoryViewer;
