import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X, ChevronRight } from 'lucide-react';
import { useNotifications } from '@/shared/context/NotificationContext';

export default function GlobalAnnouncement() {
  const { notifications, markAsRead } = useNotifications();

  // Get the latest unread global notification
  const latestGlobal = notifications
    .filter(n => n.id.startsWith('global-') && !n.read)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

  const handleDismiss = () => {
    if (latestGlobal) {
      markAsRead(latestGlobal.id);
    }
  };

  if (!latestGlobal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[60] bg-[#2563B0] text-white py-3 px-4 shadow-lg border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
              <span className="font-black uppercase tracking-widest text-[10px] bg-white text-[#2563B0] px-2 py-0.5 rounded">
                Info
              </span>
              <p className="text-sm font-bold truncate">
                <span className="hidden sm:inline">{latestGlobal.title}: </span>
                {latestGlobal.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <button 
              onClick={() => {
                alert(`${latestGlobal.title}\n\n${latestGlobal.message}`);
              }}
              className="hidden md:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest hover:underline transition-all"
            >
              Détails <ChevronRight className="w-3 h-3" />
            </button>
            <button 
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
