import { motion } from "framer-motion";

export default function OrbitActivityRing({ events = [] }) {
  const items = events.slice(0, 8);
  const total = Math.max(items.length, 1);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="relative w-full h-full"
      >
        {items.map((eventText, index) => {
          const angle = (index / total) * 360;
          return (
            <motion.div
              key={`${eventText}-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.55, 0.2] }}
              transition={{ duration: 5, repeat: Infinity, delay: index * 0.35 }}
              className="absolute left-1/2 top-1/2 text-white font-black uppercase tracking-widest whitespace-nowrap"
              style={{
                fontSize: "10px",
                transform: `rotate(${angle}deg) translateX(140px) rotate(${-angle}deg)`,
                transformOrigin: "0 0"
              }}
            >
              {eventText}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
