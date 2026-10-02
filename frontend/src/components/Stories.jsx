import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { storyService } from "../services/api";
import { Plus } from "lucide-react";
import { mediaUrl } from '../lib/config';

const Stories = () => {
    const [stories, setStories] = useState([]);
    const [myStories, setMyStories] = useState([]);
    const navigate = useNavigate();

    const load = async () => {
        try {
            const [feed, mine] = await Promise.all([storyService.feed(0, 20), storyService.myStories()]);
            setStories(feed.content || []);
            setMyStories(mine || []);
        } catch (e) {
            console.error("Stories load failed", e);
        }
    };

    useEffect(() => {
        (async () => { await load(); })();
    }, []);

    // Group stories by author for a single ring per user
    const myEmail = localStorage.getItem('userEmail');
    const groupedByUser = (stories || []).reduce((map, s) => {
        const key = s.user?.email || 'unknown';
        if (key === myEmail) return map; // Skip my own stories in the general feed
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(s);
        return map;
    }, new Map());

    const groupedEntries = Array.from(groupedByUser.entries()).map(([email, list]) => {
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latest = list[0];
        const unseenCount = list.filter(st => !(Array.isArray(st.viewers) && st.viewers.some(v => v.email === myEmail))).length;
        return { email, list, latest, unseenCount, user: latest.user };
    });

    // Group my stories into a single tile with count
    const myGrouped = myStories.length
        ? (() => {
            const sorted = [...myStories].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const me = localStorage.getItem('userEmail');
            const unseenCount = sorted.filter(st => !(Array.isArray(st.viewers) && st.viewers.some(v => v.email === me))).length;
            return { count: sorted.length, latest: sorted[0], unseenCount };
        })()
        : null;

    return (
        <div className="flex gap-5 p-4 overflow-x-auto no-scrollbar scroll-smooth bg-black/20 backdrop-blur-sm rounded-3xl mb-8 snap-x snap-mandatory">
            <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group snap-start"
                onClick={() => navigate("/story/create")}
            >
                <div className="relative p-[3px] rounded-full story-ring transition-all duration-500">
                    <div className="w-[66px] h-[66px] rounded-full border-[3px] border-black bg-zinc-900 overflow-hidden flex items-center justify-center relative">
                        <Plus className="w-6 h-6 text-white" />
                    </div>
                </div>
                <span className="text-[10px] font-bold truncate w-full text-center tracking-tight text-gray-300 group-hover:text-white">
                    Add Story
                </span>
            </motion.div>
            {myGrouped && (
                <motion.div
                    key={`my-grouped`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex flex-col items-center gap-2 min-w-[80px] snap-start cursor-pointer"
                    onClick={() => navigate(`/story/${myGrouped.latest.id}`)}
                >
                    <div className={`relative p-[3px] rounded-full transition-all duration-500 ${myGrouped.unseenCount > 0 ? 'story-ring' : 'story-ring seen'}`}>
                        <div className="w-[66px] h-[66px] rounded-full border-[3px] border-black bg-zinc-900 overflow-hidden flex items-center justify-center relative">
                            {myGrouped.latest?.mediaUrl ? (
                                /\.(mp4|webm|ogg)$/i.test(myGrouped.latest.mediaUrl) ? (
                                    <video className="w-full h-full object-cover" src={mediaUrl(myGrouped.latest.mediaUrl)} muted playsInline />
                                ) : (
                                    <img src={mediaUrl(myGrouped.latest.mediaUrl)} alt="my-story" className="w-full h-full object-cover" />
                                )
                            ) : (
                                <span className="text-2xl">👤</span>
                            )}
                            {myGrouped.count > 1 && (
                                <span className="absolute -bottom-1 -right-1 bg-pink-500 text-white text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center border-[3px] border-black">
                                    {myGrouped.count}
                                </span>
                            )}
                        </div>
                    </div>
                    <span className="text-[10px] font-bold truncate w-full text-center tracking-tight text-gray-300">Your Story</span>
                </motion.div>
            )}
            {groupedEntries.map(({ email, latest, unseenCount, user, list }) => (
                <motion.div
                    key={email}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group snap-start"
                    onClick={() => {
                        const target = list.find(st => {
                            const me = localStorage.getItem('userEmail');
                            return !(Array.isArray(st.viewers) && st.viewers.some(v => v.email === me));
                        }) || latest;
                        navigate(`/story/${target.id}`);
                    }}
                >
                    <div className={`relative p-[3px] rounded-full transition-all duration-500 ${unseenCount > 0 ? 'story-ring' : 'story-ring seen'}`}>
                        <div className="w-[66px] h-[66px] rounded-full border-[3px] border-black bg-zinc-900 overflow-hidden flex items-center justify-center relative">
                            {latest?.mediaUrl ? (
                                /\.(mp4|webm|ogg)$/i.test(latest.mediaUrl) ? (
                                    <video className="w-full h-full object-cover" src={`http://localhost:62223${latest.mediaUrl}`} muted playsInline />
                                ) : (
                                    <img src={`http://localhost:62223${latest.mediaUrl}`} alt={user?.username || 'story'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                )
                            ) : (
                                <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">👤</span>
                            )}
                            {list.length > 1 && (
                                <span className="absolute -bottom-1 -right-1 bg-pink-500 text-white text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center border-[3px] border-black">
                                    {list.length}
                                </span>
                            )}
                        </div>
                    </div>
                    <span className="text-[10px] font-bold truncate w-full text-center tracking-tight text-gray-300 group-hover:text-white">
                        {user?.username || user?.email?.split('@')[0] || 'Story'}
                    </span>
                </motion.div>
            ))}
        </div>
    );
};

export default Stories;
