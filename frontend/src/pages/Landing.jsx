import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Image, MessageCircle, Share2, Globe, Users, Star, ArrowRight, Shield, Zap, Sparkles } from "lucide-react";
import { useCharacter } from "../context/CharacterContext";

const Reveal = ({ children, width = "fit-content" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <div ref={ref} style={{ position: "relative", width, overflow: "hidden" }}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#05050f]">
      {/* 200 tiny particles */}
      <div className="absolute inset-0">
        {[...Array(200)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-20"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `-${Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* Animated Nebula Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-purple-600/10 rounded-full blur-[120px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, 60, 0],
          rotate: [0, -45, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-blue-600/10 rounded-full blur-[140px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.05, 0.15, 0.05]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] right-[10%] w-[40vw] h-[40vw] bg-pink-500/5 rounded-full blur-[100px]" 
      />

      <style>{`
        @keyframes float {
          from { transform: translateY(0) rotate(0deg); }
          to { transform: translateY(-100vh) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const { setEmotion, showBubble } = useCharacter();

  return (
    <div className="relative min-h-screen bg-[#050508] text-white selection:bg-purple-500/30">
      <ParticleBackground />

      <style>{`
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center w-[90%] max-w-7xl px-8 py-4 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-full shadow-2xl">
          <h1 className="text-2xl font-black italic text-vibrant tracking-tighter cursor-pointer" onClick={() => navigate("/")}>
            ConnectHub
          </h1>

          <div className="flex gap-8 items-center font-bold text-xs uppercase tracking-widest">
            <Link 
              to="/login" 
              data-companion-hover="login" 
              className="hidden md:block text-white/60 hover:text-white transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_14px_rgba(129,140,248,0.55)]"
              onMouseEnter={() => {
                setEmotion('excited', 2000);
                showBubble("Psst... logging in? 🔐", 2000);
              }}
            >
              Login
            </Link>
            <Link 
              to="/register" 
              data-companion-hover="signup" 
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
              onMouseEnter={() => {
                setEmotion('happy', 2000);
                showBubble("Join the orbit! 🚀", 2000);
              }}
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* SECTION 1: HERO */}
        <section className="h-screen flex flex-col items-center justify-center text-center px-6 relative perspective-1000">
          <Reveal>
            <motion.div 
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="mb-6 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 cursor-default"
            >
              The future of social connection
            </motion.div>
          </Reveal>
          
          <Reveal>
            <div className="relative">
              <motion.h1 
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="text-7xl md:text-[12rem] font-black leading-[0.8] tracking-tightest drop-shadow-[0_20px_50px_rgba(168,85,247,0.3)]"
              >
                Connect. <br />
                <span className="text-vibrant bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 animate-gradient-x">Build. Grow.</span>
              </motion.h1>
              
              {/* Floating Floating Cards around Hero */}
              <motion.div 
                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-20 -left-20 hidden lg:block glass p-4 rounded-2xl border-white/10 shadow-2xl rotate-[-12deg]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500" />
                  <div className="space-y-1">
                    <div className="w-20 h-2 bg-white/20 rounded-full" />
                    <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-10 -right-20 hidden lg:block glass p-4 rounded-2xl border-white/10 shadow-2xl rotate-[8deg]"
              >
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20" />
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20" />
                  <div className="w-6 h-6 rounded-lg bg-pink-500/20" />
                </div>
              </motion.div>
            </div>
          </Reveal>

          <Reveal>
            <p className="mt-14 text-gray-400 max-w-xl text-lg md:text-2xl font-medium leading-relaxed">
              Experience social media reconstructed. <br />
              <span className="text-white">A premium, ad-free space for absolute connection.</span>
            </p>
          </Reveal>

          <Reveal>
            <div className="mt-14 flex flex-col md:flex-row gap-6">
              <motion.button
                onClick={() => navigate("/register")}
                data-companion-hover="signup"
                whileHover={{ scale: 1.08, y: -2, boxShadow: "0 0 32px rgba(168,85,247,0.45)" }}
                whileTap={{ scale: 0.96 }}
                className="px-12 py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full font-black text-sm shadow-2xl shadow-purple-500/30 transition-all tracking-widest"
                onMouseEnter={() => {
                  setEmotion('excited', 2200);
                  showBubble("Let's build your orbit. 🚀", 2200);
                }}
              >
                GET STARTED
              </motion.button>
              <motion.button
                onClick={() => navigate("/login")}
                data-companion-hover="login"
                whileHover={{ scale: 1.08, y: -2, boxShadow: "0 0 28px rgba(59,130,246,0.35)" }}
                whileTap={{ scale: 0.96 }}
                className="px-12 py-6 glass rounded-full font-black text-sm border-white/10 hover:bg-white/12 transition-all duration-300 tracking-widest shadow-[0_0_0_rgba(59,130,246,0)]"
                onMouseEnter={() => {
                  setEmotion('curious', 2200);
                  showBubble("Ready to jump back in? 🔐", 2200);
                }}
              >
                LOGIN
              </motion.button>
            </div>
          </Reveal>
          
          <motion.div 
            animate={{ y: [0, 10, 0] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20"
          >
            <div className="w-6 h-10 rounded-full border-2 border-white flex justify-center p-2">
              <div className="w-1 h-2 bg-white rounded-full" />
            </div>
          </motion.div>
        </section>

        {/* SECTION 2: WHAT IS CONNECTHUB */}
        <section className="min-h-screen py-32 px-8 flex flex-col items-center justify-center bg-white/[0.01]">
          <div className="max-w-3xl text-center">
            <Reveal width="100%">
              <h2 className="text-4xl md:text-6xl font-black mb-8">Your Premium <span className="text-vibrant">Social Space</span></h2>
            </Reveal>
            <Reveal width="100%">
              <p className="text-xl md:text-2xl text-gray-400 font-medium leading-relaxed">
                ConnectHub is a private, ad-free social platform built for real connection. 
                Post, story, chat, explore — all in one beautiful, high-performance space. 
                No algorithms, no data mining. Just you and your orbit.
              </p>
            </Reveal>
          </div>
        </section>

        {/* SECTION 3: FEATURES GRID */}
        <section className="py-32 px-8 max-w-7xl mx-auto">
          <Reveal width="100%">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black">Everything you need</h2>
              <p className="text-gray-500 mt-4 font-bold uppercase tracking-widest text-xs">All in one orbit</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard 
              icon="📸" 
              title="Rich Posts" 
              text="Share images, videos and text. Edit with premium filters, crop, and adjust. Total control over your visibility and engagement metrics." 
            />
            <FeatureCard 
              icon="⭕" 
              title="Expressive Stories" 
              text="Multi-slide stories with integrated camera, filters, captions and stickers. See exactly who watched with detailed viewer analytics." 
            />
            <FeatureCard 
              icon="💬" 
              title="Real Conversations" 
              text="Direct messages with images, voice notes, GIFs and real-time emoji reactions. A chat experience that feels fluid and alive." 
            />
            <FeatureCard 
              icon="🌐" 
              title="Orbit Rooms" 
              text="Live temporary spaces unique to ConnectHub. Chat, draw on a shared whiteboard, and run polls. Real-time collaboration reimagined." 
            />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-8 bg-[#05050f] relative">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
            <Reveal>
              <div className="space-y-8">
                <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
                  Discover <br /> without <br /> <span className="text-vibrant">limits.</span>
                </h2>
                <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-lg">
                  Explore a masonry grid of posts and reels from everyone on the network. 
                  Full-screen reel viewer, TikTok-style scroll, and instant reactions 
                  without ever leaving your flow.
                </p>
                <div className="flex gap-4">
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">Fast</div>
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">Fluid</div>
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">Infinite</div>
                </div>
              </div>
            </Reveal>
            <div className="relative group">
              <div className="absolute -inset-10 bg-vibrant/20 blur-[100px] rounded-full group-hover:bg-vibrant/30 transition-all duration-500" />
              <div className="relative aspect-[9/16] max-w-[320px] mx-auto rounded-[3rem] border-8 border-white/10 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 to-black" />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/20 rounded-full" />
                <div className="p-0 space-y-0 h-full flex flex-col">
                  {/* Mock Feed Content */}
                  <div className="flex-1 overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=320" className="w-full h-full object-cover" alt="mock-post" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-6 flex flex-col justify-end">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border-2 border-white/20" />
                        <div>
                          <div className="text-xs font-black text-white">@space_vibe</div>
                          <div className="text-[10px] text-white/60">Orbit: Galaxy Prime</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-white mb-6">Chasing the nebula colors today. Pure magic in the orbit! ✨🌌</div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-white/80 font-black text-[10px]">❤️ 2.4k</div>
                        <div className="flex items-center gap-1.5 text-white/80 font-black text-[10px]">💬 128</div>
                        <div className="flex items-center gap-1.5 text-white/80 font-black text-[10px]">🚀 45</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Orbit Rooms Feature */}
        <section className="py-32 px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1 relative group">
              <div className="absolute -inset-10 bg-blue-500/20 blur-[100px] rounded-full group-hover:bg-blue-500/30 transition-all duration-500" />
              <div className="relative aspect-video rounded-[2rem] border-4 border-white/10 overflow-hidden shadow-2xl bg-black">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-2 border-blue-500/50 animate-ping" />
                  <div className="absolute w-24 h-24 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
                  </div>
                </div>
              </div>
            </div>
            <Reveal>
              <div className="order-1 md:order-2 space-y-8">
                <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
                  Real-time <br /> Orbit <br /> <span className="text-blue-500">Rooms.</span>
                </h2>
                <p className="text-xl text-gray-400 font-medium leading-relaxed">
                  The first social experience with a 3D soul. Hang out in Orbit Rooms with 
                  shared whiteboards, polls, and live mood settings. 
                  It's not just a chat—it's a shared dimension.
                </p>
                <div className="flex gap-4">
                  <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">3D Scene</div>
                  <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">Whiteboard</div>
                  <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">Polls</div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Hero Section */}
        <section className="h-screen flex flex-col items-center justify-center text-center px-8 relative overflow-hidden">
          {/* Animated Orbit Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
             <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
               className="absolute w-[800px] h-[800px] border border-dashed border-purple-500/30 rounded-full" 
             />
             <motion.div 
               animate={{ rotate: -360 }} 
               transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
               className="absolute w-[600px] h-[600px] border border-dashed border-blue-500/30 rounded-full" 
             />
             <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
               className="absolute w-[400px] h-[400px] border border-dashed border-pink-500/30 rounded-full" 
             />
          </div>

          <Reveal width="100%">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-7xl md:text-[10rem] font-black mb-8 bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent leading-[0.85] tracking-tighter">
                The Orbit <br /> awaits.
              </h1>
              <p className="text-xl md:text-3xl text-gray-400 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                Connect without algorithms. Share without limits. <br />
                <span className="text-white font-bold">Your world, your rules.</span>
              </p>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <motion.button
                  onClick={() => navigate("/register")}
                  data-companion-hover="signup"
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-16 py-8 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full font-black text-xl shadow-[0_0_50px_rgba(168,85,247,0.4)] transition-all overflow-hidden"
                  onMouseEnter={() => {
                    setEmotion('excited', 3000);
                    showBubble("The orbit is waiting for you! 🚀", 3000);
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10 flex items-center gap-3 text-white">
                    GET STARTED <ArrowRight size={24} />
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => navigate("/login")}
                  data-companion-hover="login"
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="px-16 py-8 rounded-full font-black text-xl border-2 border-white/10 hover:border-white/30 transition-all text-white backdrop-blur-sm"
                  onMouseEnter={() => {
                    setEmotion('happy', 3000);
                    showBubble("Welcome back, space traveler! ✨", 3000);
                  }}
                >
                  LOGIN
                </motion.button>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Footer */}
        <footer className="py-12 px-8 border-t border-white/5 text-center text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">
          ConnectHub &copy; 2024 · Built for the next generation
        </footer>
      </div>
    </div>
  );
}

const FeatureCard = ({ icon, title, text }) => {
  return (
    <Reveal width="100%">
      <motion.div 
        whileHover={{ 
          rotateY: 10, 
          rotateX: -5, 
          scale: 1.02,
          translateZ: 20
        }}
        className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] hover:border-purple-500/30 transition-all duration-500 h-full cursor-default perspective-1000 shadow-2xl hover:shadow-purple-500/10"
      >
        <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-500 origin-left drop-shadow-2xl">{icon}</div>
        <h3 className="text-2xl font-black mb-4 text-white group-hover:text-vibrant transition-colors tracking-tight">{title}</h3>
        <p className="text-gray-400 font-medium leading-relaxed group-hover:text-gray-300 transition-colors">{text}</p>
      </motion.div>
    </Reveal>
  );
};

function Pill({ icon, label }) {
  return (
    <div className="px-6 py-3 rounded-full bg-white/5 border border-purple-500/30 text-white font-black text-xs flex items-center gap-2 hover:bg-purple-500/10 transition-colors">
      <span>{icon}</span> {label}
    </div>
  );
}
