import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, Compass, MessageCircle, Plus, Users, Bell, User, Settings, LogOut } from "lucide-react";
import { useContext } from "react";
import NotificationContext from "../context/NotificationContext";
import { useCharacter } from "../context/CharacterContext";
import { authService } from "../services/api";

const Sidebar = () => {
    const location = useLocation();
    const { totalUnread } = useContext(NotificationContext);
    const { setEmotion, showBubble } = useCharacter();
    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { name: "Home", path: "/home", icon: Home },
        { name: "Search", path: "/search", icon: Search },
        { name: "Explore", path: "/explore", icon: Compass },
        { name: "Chat", path: "/chat", icon: MessageCircle },
        { name: "Create", path: "/create-post", icon: Plus },
        { name: "Requests", path: "/requests", icon: Users },
        { name: "Notifications", path: "/notifications", icon: Bell },
        { name: "Profile", path: "/profile", icon: User },
        { name: "Settings", path: "/settings", icon: Settings },
    ];

    return (
        <div className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/5 p-6 flex flex-col z-50 bg-black/40 backdrop-blur-3xl">
            <div className="mb-12 px-4">
                <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent tracking-tighter italic">
                    ConnectHub
                </h1>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Premium Digital Orbit</p>
            </div>

            <div className="flex-1 flex flex-col gap-3">
                {menuItems.map((item) => {
                    const hoverKey = item.name === "Explore" ? "explore" : 
                                   item.name === "Chat" ? "chat" : 
                                   item.name === "Create" ? "create" : 
                                   item.name === "Notifications" ? "notifications" : 
                                   item.name.toLowerCase();
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            data-companion-hover={hoverKey}
                            data-tooltip={item.name}
                            className={`group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${isActive(item.path)
                                ? "bg-white/10 text-white shadow-xl shadow-purple-500/10 border border-white/10"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            {isActive(item.path) && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"
                                />
                            )}
                            <div className="relative">
                                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6 ${isActive(item.path) ? 'text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-gray-400 group-hover:text-white'}`} />
                                {item.name === "Chat" && totalUnread > 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-2 -right-2 w-4 h-4 bg-vibrant-gradient rounded-full flex items-center justify-center border-2 border-black"
                                    >
                                        <span className="text-[8px] font-black text-white">
                                            {totalUnread > 99 ? '99+' : totalUnread}
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                            <span className={`text-sm font-black tracking-widest uppercase transition-all ${isActive(item.path) ? 'tracking-[0.15em]' : ''}`}>
                                {item.name}
                            </span>
                            {isActive(item.path) && (
                                <motion.div
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="ml-auto w-1.5 h-1.5 bg-vibrant rounded-full shadow-[0_0_10px_#A855F7]"
                                />
                            )}
                        </Link>
                    );
                })}

                <button
                    onClick={() => {
                        setEmotion('sad', 4000) 
                        showBubble('Come back soon 🥺', 3500) 
                        setTimeout(() => authService.logout(), 3000) 
                    }}
                    data-companion-hover="logout"
                    data-tooltip="Logout"
                    className="group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden text-gray-400 hover:bg-red-500/10 hover:text-red-400 mt-4"
                >
                    <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 text-gray-400 group-hover:text-red-400" />
                    <span className="text-sm font-black tracking-widest uppercase">
                        Logout
                    </span>
                </button>
            </div>

            <div className="mt-auto border-t border-white/5 pt-8">
                <Link to="/profile" className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 hover:bg-white/10 transition group border border-white/5">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-blue-500 p-[2px] shadow-lg group-hover:rotate-12 transition-transform duration-500">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xl overflow-hidden">
                                👤
                            </div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-vibrant rounded-full border-2 border-black flex items-center justify-center">
                            <span className="text-[8px] font-black text-white">★</span>
                        </div>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate group-hover:text-vibrant transition-colors">Your Orbit</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Gold Member</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;
