import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userService, postService, authService } from '../services/api';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { useCharacter } from "../context/CharacterContext";

function Settings() {
    const { setEmotion, showBubble } = useCharacter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState('privacy');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [theme, setTheme] = useState('dark');
    // Removed Language setting UI per user request
    // const [language, setLanguage] = useState('en');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => localStorage.getItem(`ch_2fa_enabled_${localStorage.getItem('userId')}`) === 'true');
    const [twoFactorCode, setTwoFactorCode] = useState(() => localStorage.getItem(`ch_2fa_code_${localStorage.getItem('userId')}`) || '');
    const [show2FAVerify, setShow2FAVerify] = useState(false);
    const [verifyCode, setVerifyCode] = useState('');
    const [isPrivate, setIsPrivate] = useState(() => localStorage.getItem(`ch_private_${localStorage.getItem('userId')}`) === 'true');
    const [isVerified, setIsVerified] = useState(() => localStorage.getItem(`ch_verified_${localStorage.getItem('userId')}`) === 'true');
    
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    const applyTheme = useCallback((value) => {
        const resolved = value === 'light' ? 'light' : 'dark';
        document.documentElement.dataset.theme = resolved;
        document.documentElement.style.colorScheme = resolved;
        localStorage.setItem('theme', resolved);
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            const data = await userService.getProfile();
            setNotificationsEnabled(data.notificationsEnabled ?? true);
            setTheme(data.theme || 'dark');
            applyTheme(data.theme || 'dark');
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setLoading(false);
        }
    }, [applyTheme]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleNotificationsToggle = async () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        try {
            await userService.updateNotifications(newValue);
        } catch (error) {
            console.error("Failed to update notifications:", error);
            setNotificationsEnabled(!newValue);
        }
    };

    const handleThemeChange = async (value) => {
        setTheme(value);
        applyTheme(value);
        try {
            await userService.updateTheme(value);
        } catch (error) {
            console.error("Failed to update theme:", error);
        }
    };

    const handleTwoFactorToggle = async () => {
        if (!twoFactorEnabled) {
            // Generate a random 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setTwoFactorCode(code);
            setShow2FAVerify(true);
        } else {
            setTwoFactorEnabled(false);
            localStorage.setItem(`ch_2fa_enabled_${localStorage.getItem('userId')}`, 'false');
            setEmotion('thinking', 2000);
            showBubble('2FA Disabled. Stay safe! 🛡️', 2000);
        }
    };

    const confirm2FA = () => {
        if (verifyCode === twoFactorCode) {
            setTwoFactorEnabled(true);
            setShow2FAVerify(false);
            const userId = localStorage.getItem('userId');
            localStorage.setItem(`ch_2fa_enabled_${userId}`, 'true');
            localStorage.setItem(`ch_2fa_code_${userId}`, twoFactorCode);
            setEmotion('celebrating', 3000);
            showBubble('2FA Enabled! Your account is secure! 🔒', 2500);
        } else {
            alert("Invalid code. Try again!");
        }
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            alert("New passwords do not match!");
            return;
        }
        // Simulated update
        setEmotion('celebrating', 3000);
        showBubble('Password updated! Stay secure! 🔒', 2500);
        setPasswords({ current: '', new: '', confirm: '' });
    };

    const togglePrivate = () => {
        const newValue = !isPrivate;
        setIsPrivate(newValue);
        localStorage.setItem(`ch_private_${localStorage.getItem('userId')}`, newValue.toString());
        setEmotion(newValue ? 'thinking' : 'happy', 2000);
        showBubble(newValue ? 'Account is now private! 🔒' : 'Account is now public! 🌐', 2000);
    };

    const toggleVerified = () => {
        const newValue = !isVerified;
        setIsVerified(newValue);
        localStorage.setItem(`ch_verified_${localStorage.getItem('userId')}`, newValue.toString());
    };

    const handleExportData = async () => {
        setExporting(true);
        try {
            const [profile, posts, following, followers] = await Promise.all([
                userService.getProfile(),
                postService.getPersonalPosts(),
                userService.getFollowing(),
                userService.getFollowers()
            ]);
            const payload = {
                profile,
                posts: posts.content || [],
                following,
                followers
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'connecthub-data-export.json';
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export data:", error);
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Deactivate your account? You can contact support to restore.")) return;
        setDeleting(true);
        try {
            await userService.deleteAccount();
            authService.logout();
        } catch (error) {
            console.error("Failed to deactivate account:", error);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center h-[calc(100vh-2rem)]">
                <div className="w-12 h-12 border-4 border-vibrant border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pt-8 px-4 h-full flex flex-col">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="absolute inset-0 pointer-events-none">
                    <GlowingEffect glow proximity={64} inactiveZone={0.05} borderWidth={2} className="rounded-[inherit]" disabled={false} />
                </div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg">Settings</h1>
                <p className="text-white/60 font-medium mt-2">Manage your account preferences and privacy.</p>
            </motion.div>

            <div className="flex gap-8 flex-1">
                {/* Sidebar Navigation for Settings */}
                <div className="w-64 flex flex-col gap-2">
                    {['privacy', 'notifications', 'appearance', 'security', 'data'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 rounded-[1.5rem] text-left font-bold capitalize transition-all ${activeTab === tab
                                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Settings Content Area */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {activeTab === 'privacy' && (
                            <motion.div
                                key="privacy"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="glass-card p-10 rounded-[2rem] border-white/10 flex flex-col gap-8"
                            >
                                <div className="border-b border-white/10 pb-6">
                                    <h2 className="text-2xl font-black text-vibrant mb-2">Account Privacy</h2>
                                    <p className="text-white/50 text-sm font-medium">Control who can see your content and message you.</p>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            🔒 Private Account
                                            {saving && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full uppercase tracking-wider animate-pulse">Saving...</span>}
                                        </h3>
                                        <p className="text-white/50 text-sm mt-1 max-w-md">
                                            When your account is public, your profile and posts can be seen by anyone.
                                            When it's private, only the followers you approve can see what you share and send you direct messages.
                                        </p>
                                    </div>

                                    {/* Custom Toggle Switch */}
                                    <button
                                        onClick={togglePrivate}
                                        className={`w-16 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${isPrivate ? 'bg-vibrant shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}
                                    >
                                        <motion.div
                                            animate={{ x: isPrivate ? 32 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className="w-6 h-6 bg-white rounded-full shadow-md"
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            ✓ Verified Badge
                                        </h3>
                                        <p className="text-white/50 text-sm mt-1 max-w-md">
                                            Show the blue verification checkmark on your profile.
                                        </p>
                                    </div>

                                    <button
                                        onClick={toggleVerified}
                                        className={`w-16 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${isVerified ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`}
                                    >
                                        <motion.div
                                            animate={{ x: isVerified ? 32 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className="w-6 h-6 bg-white rounded-full shadow-md"
                                        />
                                    </button>
                                </div>

                                <div className="mt-auto pt-6 border-t border-white/10">
                                    <p className="text-xs text-white/30 text-center font-medium">
                                        Note: Existing followers won't be affected if you turn on Private Account.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'notifications' && (
                            <motion.div
                                key="notifications"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="glass-card p-10 rounded-[2rem] border-white/10 flex flex-col gap-8"
                            >
                                <div className="border-b border-white/10 pb-6">
                                    <h2 className="text-2xl font-black text-vibrant mb-2">Notifications</h2>
                                    <p className="text-white/50 text-sm font-medium">Control push and in-app alerts.</p>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Enable Notifications</h3>
                                        <p className="text-white/50 text-sm mt-1">Likes, comments, follows, and messages.</p>
                                    </div>
                                    <button
                                        onClick={handleNotificationsToggle}
                                        className={`w-16 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${notificationsEnabled ? 'bg-vibrant shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}
                                    >
                                        <motion.div
                                            animate={{ x: notificationsEnabled ? 32 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className="w-6 h-6 bg-white rounded-full shadow-md"
                                        />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'appearance' && (
                            <motion.div
                                key="appearance"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="glass-card p-10 rounded-[2rem] border-white/10 flex flex-col gap-8"
                            >
                                <div className="border-b border-white/10 pb-6">
                                    <h2 className="text-2xl font-black text-vibrant mb-2">Appearance</h2>
                                    <p className="text-white/50 text-sm font-medium">Theme and interface preferences.</p>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500">Theme</label>
                                    <div className="flex gap-3">
                                        {['dark', 'light'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => handleThemeChange(t)}
                                                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${theme === t ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Language removed per user request */}
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="glass-card p-10 rounded-[2rem] border-white/10 flex flex-col gap-8"
                            >
                                <div className="border-b border-white/10 pb-6">
                                    <h2 className="text-2xl font-black text-vibrant mb-2">Security</h2>
                                    <p className="text-white/50 text-sm font-medium">Account protection and access control.</p>
                                </div>

                                {/* 2FA Section */}
                                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Two-Factor Authentication</h3>
                                            <p className="text-white/50 text-sm mt-1">Extra layer of security on login.</p>
                                        </div>
                                        <button
                                            onClick={handleTwoFactorToggle}
                                            className={`w-16 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${twoFactorEnabled ? 'bg-vibrant shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}
                                        >
                                            <motion.div
                                                animate={{ x: twoFactorEnabled ? 32 : 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                className="w-6 h-6 bg-white rounded-full shadow-md"
                                            />
                                        </button>
                                    </div>

                                    {show2FAVerify && (
                                        <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-6">
                                            <div className="w-48 h-48 bg-white p-4 rounded-xl relative overflow-hidden">
                                                {/* Simulated QR Code Pattern */}
                                                <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-1">
                                                    {[...Array(64)].map((_, i) => (
                                                        <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-white/80 font-bold mb-2">Scan with Authenticator App</p>
                                                <p className="text-white/40 text-xs mb-4">Enter the 6-digit code to verify</p>
                                                <div className="flex gap-2 justify-center mb-6">
                                                    <input
                                                        type="text"
                                                        maxLength="6"
                                                        value={verifyCode}
                                                        onChange={(e) => setVerifyCode(e.target.value)}
                                                        className="w-40 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-center text-xl font-black tracking-[0.5em] text-white focus:border-vibrant outline-none"
                                                        placeholder="000000"
                                                    />
                                                </div>
                                                <div className="flex gap-4 justify-center">
                                                    <button onClick={confirm2FA} className="px-6 py-2 bg-vibrant text-white font-black text-[10px] uppercase tracking-widest rounded-full">Verify & Enable</button>
                                                    <button onClick={() => setShow2FAVerify(false)} className="px-6 py-2 bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-widest rounded-full">Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {twoFactorEnabled && (
                                        <div className="pt-6 border-t border-white/5">
                                            <p className="text-[10px] uppercase tracking-widest text-vibrant font-black mb-2">✓ 2FA ACTIVATED</p>
                                            <p className="text-white/40 text-xs">Your account is protected by an additional security layer.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Password Change Section */}
                                <form onSubmit={handlePasswordChange} className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                                    <h3 className="text-lg font-bold text-white mb-2">Change Password</h3>
                                    <div className="space-y-3">
                                        <input 
                                            type="password" 
                                            placeholder="Current Password" 
                                            value={passwords.current}
                                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-vibrant outline-none"
                                        />
                                        <input 
                                            type="password" 
                                            placeholder="New Password" 
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-vibrant outline-none"
                                        />
                                        <input 
                                            type="password" 
                                            placeholder="Confirm New Password" 
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-vibrant outline-none"
                                        />
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/90 transition">
                                        Update Password
                                    </button>
                                </form>

                                {/* Session Management */}
                                <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                                    <h3 className="text-lg font-bold text-white mb-4">Active Sessions</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white">This Device (Windows PC)</p>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Active Now • New York, US</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Current</span>
                                        </div>
                                        <button className="w-full py-3 border border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-500/5 transition">
                                            Log out all other devices
                                        </button>
                                    </div>
                                </div>

                                {/* Logout Button */}
                                <div className="flex items-center justify-between p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                                    <div>
                                        <h3 className="text-lg font-bold text-red-500">Sign Out</h3>
                                        <p className="text-red-500/40 text-sm mt-1">Log out of your account on this device.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEmotion("sad");
                                            showBubble("Goodbye... come back soon 🥺");
                                            setTimeout(() => authService.logout(), 2000);
                                        }}
                                        className="px-8 py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-red-600 transition shadow-lg shadow-red-500/20"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'data' && (
                            <motion.div
                                key="data"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="glass-card p-10 rounded-[2rem] border-white/10 flex flex-col gap-8"
                            >
                                <div className="border-b border-white/10 pb-6">
                                    <h2 className="text-2xl font-black text-vibrant mb-2">Data & Account</h2>
                                    <p className="text-white/50 text-sm font-medium">Export your data or deactivate your account.</p>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Export Data</h3>
                                        <p className="text-white/50 text-sm mt-1">Download profile, posts, followers, and following.</p>
                                    </div>
                                    <button
                                        onClick={handleExportData}
                                        className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full"
                                    >
                                        {exporting ? "Preparing..." : "Download"}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-red-500/20">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Deactivate Account</h3>
                                        <p className="text-white/50 text-sm mt-1">Your profile becomes hidden until reactivated.</p>
                                    </div>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="px-6 py-2.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full"
                                    >
                                        {deleting ? "Deactivating..." : "Deactivate"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default Settings;
