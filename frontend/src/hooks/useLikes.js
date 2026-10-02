import { useState, useCallback, useEffect } from 'react';
import { postService } from '../services/api';

export const useLikes = (initialPost, setEmotion, showBubble, onLikeProp) => {
    const [post, setPost] = useState(initialPost);

    // Sync local state if initialPost changes from parent
    useEffect(() => {
        setPost(initialPost);
    }, [initialPost]);

    const onLike = useCallback(async (postId) => {
        // If parent provided a like handler, use it to sync globally
        if (onLikeProp) {
            onLikeProp(postId);
            return;
        }

        const wasLiked = post.isLiked;
        const originalCount = post.likesCount || 0;

        // Optimistic update
        setPost(prev => ({
            ...prev,
            isLiked: !wasLiked,
            likesCount: wasLiked ? Math.max(0, originalCount - 1) : originalCount + 1
        }));

        try {
            const res = await postService.toggleLike(postId);
            // Sync with server response
            if (res) {
                setPost(prev => ({
                    ...prev,
                    isLiked: res.liked,
                    likesCount: res.likesCount
                }));

                if (res.liked) {
                    setEmotion?.('happy', 2000);
                    showBubble?.('You liked this! ❤️', 1500);
                }
            }
        } catch (err) {
            // Revert on error
            setPost(prev => ({
                ...prev,
                isLiked: wasLiked,
                likesCount: originalCount
            }));
            console.error('Like failed:', err);
        }
    }, [post.isLiked, post.likesCount, setEmotion, showBubble, onLikeProp]);

    return { post, onLike, setPost };
};
