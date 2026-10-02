import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { userService, postService } from "../services/api";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { GridSkeleton } from "../components/Skeleton";
import { useCharacter } from "../context/CharacterContext";

function Profile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setEmotion, showBubble } = useCharacter();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("posts");
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(true);
    const [previewImage, setPreviewImage] = useState("");

    // Edit form state
    const [editData, setEditData] = useState({
        username: "",
        bio: "",
        file: null
    });

    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        try {
            let profileData, postsData;

            const isOwn = !id;
            setIsOwnProfile(isOwn);

            if (id) {
                profileData = await userService.getUserProfile(id);
                // The backend handles the privacy check and returns empty posts if not allowed
                const response = await postService.getUserPosts(id);
                postsData = response.content || [];
            } else {
                [profileData, postsData] = await Promise.all([
                    userService.getProfile(),
                    postService.getPersonalPosts()
                ]).then(([prof, psts]) => [prof, psts.content || []]);
            }

            // Deduplicate posts by ID
            const unique = Array.from(new Map(postsData.map(p => [p.id, p])).values());
            setProfile(profileData);
            setPosts(unique);
            if (isOwn) {
                setEditData({
                    username: profileData?.username || "",
                    bio: profileData?.bio || "",
                    file: null
                });
            }
        } catch (err) {
            console.error("Error fetching profile", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    useEffect(() => {
        const seen = sessionStorage.getItem('profile_greeted') 
        if (!seen) { 
            setEmotion('happy', 3000) 
            showBubble('This is your orbit! 🌟') 
            sessionStorage.setItem('profile_greeted','1') 
        }
    }, [setEmotion, showBubble]);

    useEffect(() => {
        if (editData.file) {
            const url = URL.createObjectURL(editData.file);
            setPreviewImage(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewImage("");
    }, [editData.file]);

    const handleUpdateProfile = async (e) => {
        if (!isOwnProfile) return;
        e.preventDefault();
        const formData = new FormData();
        formData.append("username", editData.username);
        formData.append("bio", editData.bio);
        if (editData.file) {
            formData.append("profileImage", editData.file);
        }

        try {
            await userService.updateProfile(formData);
            setEditModalOpen(false);
            fetchProfileData();
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    const handleFollowAction = async () => {
        if (!profile) return;
        try {
            if (profile.followStatus === "ACCEPTED" || profile.followStatus === "PENDING") {
                await userService.unfollowUser(profile.id);
                setEmotion('sad', 2000);
                showBubble('Unfollowed... hope you stay friends! 💔', 2000);
            } else {
                await userService.followUser(profile.id);
                setEmotion('happy', 2000);
                showBubble('New connection! 🚀 Following now!', 2000);
            }
            fetchProfileData(); // Refresh to get new status
        } catch (err) {
            console.error("Follow action failed", err);
        }
    };

    if (loading) return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="glass rounded-[3.5rem] p-12 mb-12 border-white/10">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-white/10 skeleton" />
                    <div className="flex-1">
                        <div className="h-4 w-48 bg-white/10 rounded skeleton" />
                        <div className="h-3 w-24 mt-3 bg-white/10 rounded skeleton" />
                    </div>
                </div>
            </div>
            <GridSkeleton items={6} />
        </div>
    );

    const isPrivateAndViewRestricted = !isOwnProfile && profile?.isPrivate && profile?.followStatus !== "ACCEPTED";

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-[3.5rem] p-12 mb-16 relative overflow-hidden border-white/10 shadow-2xl shadow-purple-500/5 group"
            >
                <div className="absolute inset-0 pointer-events-none">
                    <GlowingEffect glow proximity={64} inactiveZone={0.05} borderWidth={2} className="rounded-[inherit]" disabled={false} />
                </div>
                {/* Animated Background Accent */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-transparent transition-opacity duration-700 group-hover:opacity-100 opacity-60" />

                <div className="relative flex flex-col md:flex-row items-center gap-12">
                    {/* Profile Picture with Orbit Animation */}
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-2 rounded-full border border-dashed border-purple-500/30"
                        />
                        <div className="w-44 h-44 rounded-full bg-gradient-to-tr from-purple-500 via-vibrant to-blue-500 p-1.5 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                            <img
                                src={profile?.profileImage ? `http://localhost:62223${profile.profileImage}` : `/placeholder-avatar.svg`}
                                className="w-full h-full rounded-full object-cover border-4 border-black"
                                alt="profile"
                            />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 mb-8">
                            <h2 className="text-5xl font-black tracking-tightest drop-shadow-lg flex items-center gap-4 text-white">
                                {profile?.username}
                                {!isOwnProfile && profile?.isPrivate && (
                                    <span className="text-xl opacity-60" title="Private Account">🔒</span>
                                )}
                            </h2>
                            <div className="flex gap-4">
                                {isOwnProfile ? (
                                    <>
                                        <motion.button
                                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(168,85,247,0.4)" }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setEditModalOpen(true);
                                                setEmotion('thinking', 3000);
                                                showBubble('Making some changes? ✨', 2000);
                                            }}
                                            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-[11px] font-black uppercase tracking-widest border border-white/20 transition-all shadow-xl"
                                        >
                                            Edit Profile
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ rotate: 180, scale: 1.1 }}
                                            transition={{ duration: 0.6 }}
                                            onClick={() => {
                                                navigate('/settings');
                                                setEmotion('thinking', 2000);
                                                showBubble('Tweaking things? ⚙️', 2000);
                                            }}
                                            className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl border border-white/10 hover:bg-white/10 transition-all"
                                        >
                                            ⚙️
                                        </motion.button>
                                    </>
                                ) : (
                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(168,85,247,0.4)" }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleFollowAction}
                                            className={`px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all shadow-xl ${profile?.followStatus === "ACCEPTED" ? "bg-white/10 border border-white/20 hover:border-red-500/50 hover:text-red-400" :
                                                profile?.followStatus === "PENDING" ? "bg-purple-600/30 border border-purple-500/50 text-purple-200" :
                                                    "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                                                }`}
                                        >
                                            {profile?.followStatus === "ACCEPTED" ? "Following" :
                                                profile?.followStatus === "PENDING" ? "Requested" :
                                                    "Follow"}
                                        </motion.button>
                                        {(profile?.followStatus === "ACCEPTED" || !profile?.isPrivate) && (
                                            <motion.button
                                                whileHover={{ scale: 1.05, bg: "rgba(255,255,255,0.1)" }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => navigate(`/chat?open=${profile?.email}`)}
                                                className="px-10 py-3 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-widest hover:border-white/30 transition-all shadow-xl text-white"
                                            >
                                                Message
                                            </motion.button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-center md:justify-start gap-12 mb-8">
                            {[
                                { label: "Posts", value: profile?.isPrivate && profile?.followStatus !== "ACCEPTED" && !isOwnProfile ? "-" : posts.length },
                                { label: "Followers", value: profile?.followersCount || 0 },
                                { label: "Following", value: profile?.followingCount || 0 }
                            ].map((stat) => (
                                <div key={stat.label} className="text-center group/stat">
                                    <p className="text-2xl font-black group-hover/stat:text-vibrant transition-colors">{stat.value}</p>
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="max-w-md">
                            <p className="text-white font-black text-sm mb-2 tracking-wide uppercase opacity-90">{profile?.username}</p>
                            <p className="text-gray-400 text-sm leading-relaxed font-medium line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                                {profile?.bio || "Digital innovator. ConnectHub pioneer. Breaking boundaries through code and creativity."}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Restricted View State */}
            {isPrivateAndViewRestricted ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 mt-10 glass rounded-[3rem] border-white/5 mx-auto max-w-2xl text-center">
                    <div className="w-24 h-24 rounded-full glass flex items-center justify-center mb-6 shadow-2xl">
                        <span className="text-4xl">🔒</span>
                    </div>
                    <h3 className="text-2xl font-black mb-3">This Account is Private</h3>
                    <p className="text-gray-400 font-medium max-w-sm">
                        Follow to see their photos and videos.
                    </p>
                </div>
            ) : (
                <>
                    {/* Tabs */}
                    <div className="flex justify-center gap-16 mb-10 border-t border-white/5 pt-4">
                        {['posts', 'saved', 'tagged'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-[10px] font-black uppercase tracking-[0.3em] pb-4 transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-600'}`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Posts Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        {posts.map((post, idx) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                onClick={() => navigate(`/post/${post.id}`)}
                                className="aspect-square glass rounded-[2rem] overflow-hidden group cursor-pointer relative border-white/5 shadow-xl transition-all duration-300"
                            >
                                {post.mediaUrl ? (
                                    /\.(mp4|webm|ogg)$/i.test(post.mediaUrl) ? (
                                        <video
                                            className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                                            src={`http://localhost:62223${post.mediaUrl}`}
                                            muted
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        <img src={`http://localhost:62223${post.mediaUrl}`} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="p" />
                                    )
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-zinc-900 to-black group-hover:from-zinc-800 transition-all">
                                        <span className="text-2xl mb-3 opacity-30 group-hover:scale-125 transition-transform duration-500">✨</span>
                                        <p className="text-[11px] text-gray-400 font-medium text-center line-clamp-4 leading-relaxed">{post.content}</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-8">
                                    <span className="font-black text-sm flex items-center gap-2 drop-shadow-md tracking-widest">
                                        <span className="text-xl">❤️</span> {post.likesCount || 0}
                                    </span>
                                    <span className="font-black text-sm flex items-center gap-2 drop-shadow-md tracking-widest">
                                        <span className="text-xl">💬</span> {post.commentsCount || 0}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                        {posts.length === 0 && (
                            <div className="col-span-3 text-center py-20 text-gray-500 font-bold uppercase tracking-widest text-xs">
                                No posts yet.
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && isOwnProfile && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="relative w-full max-w-lg glass-card p-10 rounded-[2.5rem] border-white/10"
                        >
                            <h3 className="text-2xl font-black mb-8 text-vibrant uppercase tracking-tightest">Edit Profile</h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="flex items-center justify-center">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px]">
                                        <img
                                            src={previewImage || (profile?.profileImage ? `http://localhost:62223${profile.profileImage}` : `/placeholder-avatar.svg`)}
                                            className="w-full h-full rounded-full object-cover border-2 border-black"
                                            alt="profile"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Username</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-purple-500 transition-all font-medium"
                                        value={editData.username}
                                        onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Bio</label>
                                    <textarea
                                        className="w-full h-28 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-blue-500 transition-all font-medium resize-none"
                                        value={editData.bio}
                                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Profile Picture</label>
                                    <input
                                        type="file"
                                        className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-white/10 file:text-white hover:file:bg-white/20 transition cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => setEditData({ ...editData, file: e.target.files[0] })}
                                    />
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 py-4 glass rounded-2xl font-black text-sm border-white/10">CANCEL</button>
                                    <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-black text-sm shadow-xl shadow-purple-500/20">SAVE CHANGES</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Profile;
