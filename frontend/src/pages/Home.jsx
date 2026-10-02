import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { postService, userService, authService } from "../services/api";
import Stories from "../components/Stories";
import Suggestions from "../components/Suggestions";
import PostCard from "../components/PostCard";
import CommentSection from "../components/CommentSection";
import VanillaTilt from "vanilla-tilt";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Edit2, Archive, Trash2 } from "lucide-react";
import ShareSheet from "../components/ShareSheet";
import { CardSkeleton } from "../components/Skeleton";
import { useCharacter } from "../context/CharacterContext";

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const currentEmail = localStorage.getItem('userEmail');
  const { setEmotion, showBubble, triggerReaction } = useCharacter();

  const fetchContent = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [allPosts, profileData, allUsers] = await Promise.all([
        postService.getFeed(0, 50),
        userService.getProfile(),
        userService.searchUsers("")
      ]);
      
      const feedData = allPosts?.content || allPosts || [];
      const validPosts = Array.isArray(feedData) ? feedData.filter(Boolean) : [];
      
      setPosts(validPosts);
      setUserProfile(profileData);
      setSuggestions(allUsers?.slice(0, 5) || []);

      if (isInitial && Math.random() < 0.3) {
        triggerReaction('welcome');
      }
    } catch (err) {
      console.error("Failed to fetch initial content:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [triggerReaction]);

  useEffect(() => {
    fetchContent(true);
  }, [fetchContent]);

  const onLike = useCallback(async (postId) => {
    const originalPosts = [...posts];
    const post = originalPosts.find(p => p.id === postId);
    if (!post) return;

    const wasLiked = post.isLiked;

    // Optimistic update
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.id === postId
          ? { ...p, isLiked: !wasLiked, likesCount: wasLiked ? (p.likesCount || 1) - 1 : (p.likesCount || 0) + 1 }
          : p
      )
    );

    try {
      const res = await postService.toggleLike(postId);
      // Sync with server response
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId ? { ...p, isLiked: res.liked, likesCount: res.likesCount } : p
        )
      );
      
      if (res.liked) {
        setEmotion('happy', 2000);
        showBubble('You liked this! ❤️', 1500);
      }
    } catch (err) {
      // Revert on error
      setPosts(originalPosts);
      console.error(err);
    }
  }, [posts, setEmotion, showBubble]);

  const onRepost = useCallback(async (postId) => {
    try {
      await postService.repost(postId, "");
      fetchContent();
      setEmotion('celebrating', 3000);
      showBubble('Post shared to your orbit! 🚀', 2500);
    } catch (err) {
      console.error(err);
      setEmotion('error', 2000);
      showBubble('Failed to share post... 😔', 2000);
    }
  }, [fetchContent, setEmotion, showBubble]);

  if (loading) {
    return (
      <div className="max-w-[550px] mx-auto space-y-8 py-8">
        {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="flex justify-center py-8">
      <div className="w-full max-w-[550px] space-y-8">
        <Stories />
        <div className="space-y-12">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentEmail={currentEmail} 
              onRepost={onRepost}
              onLike={onLike}
              setPosts={setPosts}
              setEmotion={setEmotion}
              showBubble={showBubble}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
