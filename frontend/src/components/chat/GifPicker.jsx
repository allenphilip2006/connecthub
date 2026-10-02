import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';

const GIPHY_API_KEY = 'dc6zaTOxFJmzC'; // Public beta key

export default function GifPicker({ onPick, onClose }) {
  const [query, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`);
      const data = await res.json();
      setGifs(data.data || []);
    } catch (e) {
      console.error("Giphy error", e);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (q) => {
    if (!q) return fetchTrending();
    setLoading(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      setGifs(data.data || []);
    } catch (e) {
      console.error("Giphy error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="absolute bottom-20 left-0 z-[150] w-80 h-96 bg-[#0d0d14] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
    >
      <div className="p-4 border-b border-white/5 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input
            autoFocus
            type="text"
            placeholder="Search GIFs..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-purple-500/50 transition-all"
            value={query}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchGifs(e.target.value);
            }}
          />
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 thin-purple-scroll">
        {loading && (
          <div className="col-span-2 flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-purple-500" />
          </div>
        )}
        {!loading && gifs.map(gif => (
          <button
            key={gif.id}
            onClick={() => onPick(gif.images.fixed_height.url)}
            className="rounded-lg overflow-hidden hover:scale-[1.02] active:scale-95 transition-all bg-white/5 group"
          >
            <img 
              src={gif.images.fixed_height_small.url} 
              alt="gif" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
        {!loading && gifs.length === 0 && (
          <div className="col-span-2 text-center py-10 text-gray-500 text-xs font-bold uppercase tracking-widest">
            No GIFs found
          </div>
        )}
      </div>
      <div className="p-2 border-t border-white/5 bg-black/20">
        <p className="text-[8px] text-center text-gray-600 font-black uppercase tracking-widest">Powered by GIPHY</p>
      </div>
    </motion.div>
  );
}
