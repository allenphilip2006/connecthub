import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../../lib/config';

export default function NotificationBubble({ notifications = [], onDismiss }) {
  const navigate = useNavigate();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-[420px] px-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notif, index) => (
          <motion.div
            key={notif.id}
            layout
            initial={{ y: -60, opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 1 - (index * 0.05),
              filter: 'blur(0px)',
              marginTop: index > 0 ? -20 : 0
            }}
            exit={{ 
              y: -20, 
              opacity: 0, 
              scale: 0.9,
              filter: 'blur(5px)',
              transition: { duration: 0.2 }
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 30,
              mass: 0.8
            }}
            style={{ 
              zIndex: 100 - index,
              transformOrigin: 'top center'
            }}
            className={`glass-dark rounded-[2rem] p-3 flex items-center gap-3 shadow-2xl border ${notif.type === 'orbit-invite' ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/10 bg-black/60'} backdrop-blur-2xl pointer-events-auto cursor-pointer hover:bg-white/10 transition-colors group relative overflow-hidden`}
            onClick={() => {
              if (notif.roomId) {
                navigate(`/orbit/${notif.roomId}`);
              } else if (notif.senderEmail) {
                navigate(`/chat`, { state: { selectedEmail: notif.senderEmail } });
              }
              onDismiss(notif.id);
            }}
          >
            {/* Background Glow for Invites */}
            {notif.type === 'orbit-invite' && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent pointer-events-none animate-pulse" />
            )}

            {/* Sender Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-2xl border border-white/20 overflow-hidden bg-black/40 shadow-lg">
                <img 
                  src={mediaUrl(notif.avatar) || '/placeholder-avatar.svg'} 
                  alt="avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              {notif.type === 'orbit-invite' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 border-2 border-black flex items-center justify-center">
                  <span className="text-[8px]">🌐</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-widest ${notif.type === 'orbit-invite' ? 'text-purple-400' : 'text-white'}`}>
                  {notif.username || notif.senderUsername || 'New Message'}
                </span>
                {notif.type === 'orbit-invite' && (
                  <span className="text-[8px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded-full animate-bounce">INVITE</span>
                )}
              </div>
              <div className="text-white/60 text-[11px] font-medium truncate leading-tight">
                {notif.text ? (notif.text.length > 35 ? notif.text.substring(0, 35) + '...' : notif.text) : 'Sent a message'}
              </div>
            </div>

            {/* Action Icon / Count */}
            <div className="flex items-center gap-2 shrink-0">
              {notif.count > 1 ? (
                <div className="bg-vibrant-gradient text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-purple-500/30">
                  +{notif.count - 1} more
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 group-hover:text-white/60 transition-colors">
                  <span className="text-lg">→</span>
                </div>
              )}
            </div>
            
            {/* Progress Bar (Auto-dismiss timer) */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4, ease: "linear" }}
              className="absolute bottom-0 left-0 h-0.5 bg-purple-500/50"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
