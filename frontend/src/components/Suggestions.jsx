import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Suggestions({ users }) {
  return (
    <div className="w-full max-w-[550px] mx-auto my-12">
      <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 px-4">Suggestions For You</h3>
      {(!users || users.length === 0) ? (
        <div className="text-center py-10 glass-card rounded-2xl">
          <p className="text-white/60 mb-4">No suggestions for you right now.</p>
          <Link to="/explore" className="btn-gradient px-6 py-2 rounded-xl text-sm font-black uppercase">Find People</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {users.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/profile/${user.id}`} className="block glass-card rounded-2xl p-4 text-center hover:bg-white/10 transition-colors duration-300">
                <img 
                  src={user.profileImage ? `http://localhost:62223${user.profileImage}` : "/placeholder-avatar.svg"} 
                  alt={user.username}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-white/10"
                />
                <h4 className="text-sm font-bold text-white truncate">{user.username}</h4>
                <p className="text-xs text-white/50 truncate">{user.email}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
