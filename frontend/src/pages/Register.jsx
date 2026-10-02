import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "../services/api";
import ThreeBackground from "../components/ThreeBackground";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Meteors } from "@/components/ui/meteors";
import { useCharacter } from "../context/CharacterContext";
import companionDialogues from "../data/companionDialogues";

function Register() {
  const navigate = useNavigate();
  const { setEmotion, showBubble } = useCharacter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authService.register(username, email, password);
      setEmotion('excited', 5000)
      showBubble("You're in the orbit now! 🚀\nWelcome to ConnectHub!", 4000)
      navigate("/login");
    } catch {
      setEmotion('error', 2000)
      showBubble('Fill everything in! 📝', 2000)
      setError("Registration failed. This email or username might be already in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center p-6">
      <ThreeBackground />

      <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md glass-card p-10 rounded-[2.5rem] border-white/10 shadow-2xl shadow-pink-500/10 overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <GlowingEffect glow proximity={64} inactiveZone={0.05} borderWidth={2} className="rounded-[inherit]" disabled={false} />
          <Meteors number={20} />
        </div>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50" />

        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-vibrant mb-2">Create Account</h2>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest text-[10px]">Join the ConnectHub Community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">Username</label>
            <input
              type="text"
              placeholder="Username"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-purple-500 transition-all outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => {
                setEmotion('peek', 0);
                showBubble("Ooh, what's our new name? 👀", 2000);
              }}
              onBlur={() => setEmotion('neutral', 1000)}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">Email Address</label>
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-purple-500 transition-all outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => {
                setEmotion('peek', 0);
                showBubble("Joining the orbit? 🚀 How exciting!", 2000);
              }}
              onBlur={() => setEmotion('neutral', 1000)}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">Password</label>
            <input
              type="password"
              placeholder="Password"
              data-companion-hover="password"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-purple-500 transition-all outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => {
                setEmotion('coveringeyes', 0);
                const pool = companionDialogues.PASSWORD_FOCUS;
                const dialogue = pool[Math.floor(Math.random() * pool.length)];
                showBubble(dialogue, 0);
              }}
              onBlur={() => {
                setEmotion('neutral', 1000);
                showBubble(null, 0); 
              }}
              required
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-400 text-xs font-bold text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 34px rgba(236,72,153,0.45)" }}
            whileTap={{ scale: 0.98 }}
            data-companion-hover="signup"
            onMouseEnter={() => {
              setEmotion('excited', 2200);
              showBubble("Signup power activated 🚀", 2200);
            }}
            disabled={loading}
            className={`w-full py-5 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 font-black text-sm shadow-xl shadow-pink-500/20 hover:scale-[1.03] transition-all ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? "REGISTERING..." : "SIGN UP"}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-[10px] text-gray-500 font-medium">
          Already have an account? <Link to="/login" data-companion-hover="login" className="text-white hover:text-pink-400 font-black transition-all hover:drop-shadow-[0_0_12px_rgba(244,114,182,0.55)]">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;
