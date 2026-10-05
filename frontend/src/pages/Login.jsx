import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "../services/api";
import ThreeBackground from "../components/ThreeBackground";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Meteors } from "@/components/ui/meteors";
import { useCharacter } from "../context/CharacterContext";
import { useToast } from "../context/ToastContext";
import companionDialogues from "../data/companionDialogues";

function Login() {
  const navigate = useNavigate();
  const { setEmotion, showBubble } = useCharacter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [showForgot, setShowForgot] = useState(false); // Forgot Password Mode
  const [showRecover2FA, setShowRecover2FA] = useState(false); // Recover 2FA Mode

  useEffect(() => {
    // Reset 2FA state if user changes email (trying a different account)
    if (twoFactorRequired) {
      setTwoFactorRequired(false);
      setCode("");
      setError("");
    }
  }, [email, twoFactorRequired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    try {
      await authService.login(email, password, twoFactorRequired ? code : null);
      // Removed text bubble per user request - just transition
      addToast("Login successful! Welcome back.", "success");
      navigate("/home");
    } catch (err) {
      const status = err?.response?.data?.status;
      const unreachable = !err?.response;
      setEmotion('shocked', 3000)
      showBubble("That's not right! 😱 Try again?", 3000)
      setTimeout(() => {
        setEmotion('thinking', 2000)
        showBubble('Forgot your password? 🤔', 2000)
      }, 3000);

      if (unreachable) {
        addToast("Can't reach the API. The live site needs VITE_API_URL pointing at a running backend.", "error");
        setError("Can't reach the server. This deployed app is not connected to a live API.");
      } else if (status === "2fa_required") {
        addToast("Two-factor code required.", "error");
        setTwoFactorRequired(true);
        setError("Enter your two-factor code.");
      } else if (status === "invalid_2fa") {
        addToast("Invalid two-factor code.", "error");
        setError("Invalid two-factor code.");
      } else {
        addToast("Invalid credentials. Please try again.", "error");
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email first.");
      return;
    }
    setLoading(true);
    setError("");
    setMsg("");

    try {
      if (showRecover2FA) {
        const res = await authService.recover2FA(email);
        setMsg(res.message);
        setShowRecover2FA(false);
        setTwoFactorRequired(false); // Assume recovery disables 2FA
      } else {
        const res = await authService.forgotPassword(email);
        setMsg(res.message);
        setShowForgot(false);
      }
    } catch {
      setError("Request failed. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center p-6">
      <ThreeBackground />

      <div className="absolute top-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md glass-card p-10 rounded-[2.5rem] border-white/10 shadow-2xl shadow-blue-500/10 overflow-hidden group"
      >
        <div className="absolute inset-0 pointer-events-none">
          <GlowingEffect glow proximity={64} inactiveZone={0.05} borderWidth={2} className="rounded-[inherit]" disabled={false} />
          <Meteors number={16} />
        </div>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-vibrant mb-2">
            {showForgot ? "Reset Password" : showRecover2FA ? "Recover 2FA" : "Welcome Back"}
          </h2>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">
            {showForgot ? "Enter email to reset" : showRecover2FA ? "Lost your device?" : "Login to your account"}
          </p>
        </div>

        {!showForgot && !showRecover2FA ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-purple-500 transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => {
                  setEmotion('peek', 0);
                  showBubble("Ooh, logging in? 👀 Welcome!", 2000);
                }}
                onBlur={() => setEmotion('neutral', 1000)}
                required
              />
            </div>

            <div className="relative group">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest"
                >
                  Forgot?
                </button>
              </div>
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

            {twoFactorRequired && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Two-Factor Code</label>
                  <button
                    type="button"
                    onClick={() => setShowRecover2FA(true)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest"
                  >
                    Lost Code?
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="6-digit code"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-purple-500 transition-all outline-none"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
            )}

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
              {msg && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-green-400 text-xs font-bold text-center"
                >
                  {msg}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(99,102,241,0.45)" }}
              whileTap={{ scale: 0.98 }}
              data-companion-hover="login"
              onMouseEnter={() => {
                setEmotion('excited', 2000);
                showBubble("Let’s log you in. ⚡", 2000);
              }}
              disabled={loading}
              className={`w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 font-black text-sm shadow-xl shadow-blue-500/20 hover:scale-[1.03] transition-all ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? "PROCESSING..." : "CONTINUE"}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleRecovery} className="space-y-6">
            <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">Email Address</label>
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-purple-500 transition-all outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => {
                setEmotion('excited', 2000);
                showBubble("Welcome back! 🚀", 2000);
              }}
              onBlur={() => setEmotion('neutral', 1000)}
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
              {msg && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-green-400 text-xs font-bold text-center"
                >
                  {msg}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(99,102,241,0.45)" }}
              whileTap={{ scale: 0.98 }}
              data-companion-hover="login"
              onMouseEnter={() => {
                setEmotion('curious', 1800);
                showBubble("Recovery mode ready ✉️", 1800);
              }}
              disabled={loading}
              className={`w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 font-black text-sm shadow-xl shadow-blue-500/20 hover:scale-[1.03] transition-all ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? "SEND..." : (showRecover2FA ? "DISABLE 2FA" : "SEND RESET LINK")}
            </motion.button>

            <button
              type="button"
              onClick={() => { setShowForgot(false); setShowRecover2FA(false); setError(""); setMsg(""); }}
              className="w-full text-center text-xs text-gray-500 font-medium hover:text-white transition"
            >
              Back to Login
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-gray-500 font-medium font-outfit">
          Don't have an account? <Link to="/register" data-companion-hover="signup" className="text-white hover:text-blue-400 font-black transition-all hover:drop-shadow-[0_0_12px_rgba(96,165,250,0.55)]">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
