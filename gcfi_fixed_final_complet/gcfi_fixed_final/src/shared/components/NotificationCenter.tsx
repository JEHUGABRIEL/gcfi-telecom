import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Package, Tag, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'offer' | 'info';
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onClearAll
}: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — plus opaque pour meilleure lisibilité */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/50"
          />
          {/* Panneau latéral */}
          <motion.div
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
          >
            {/* En-tête */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#2563B0]/10 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#2563B0]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-[#2563B0] font-semibold">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 px-6">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-5">
                    <Bell className="w-9 h-9 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm mb-1">Aucune notification</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Vous êtes à jour ! Les nouvelles alertes apparaîtront ici.</p>
                </div>
              ) : (
                notifications.map((notification: AppNotification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onMarkRead(notification.id)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer relative bg-white dark:bg-slate-800",
                      notification.read
                        ? "border-slate-100 dark:border-slate-700"
                        : "border-[#2563B0]/20 dark:border-[#2563B0]/30 shadow-sm"
                    )}
                  >
                    {!notification.read && (
                      <span className="absolute top-4 right-4 w-2 h-2 bg-[#2563B0] rounded-full" />
                    )}
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        notification.type === 'order'  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" :
                        notification.type === 'offer'  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" :
                        "bg-slate-100 dark:bg-slate-700 text-slate-500"
                      )}>
                        {notification.type === 'order'  ? <Package className="w-5 h-5" /> :
                         notification.type === 'offer'  ? <Tag className="w-5 h-5" /> :
                         <Info className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 truncate">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Intl.DateTimeFormat('fr-FR', {
                            hour: '2-digit', minute: '2-digit',
                            day: '2-digit', month: 'short'
                          }).format(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Pied */}
            {notifications.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button
                  onClick={onClearAll}
                  className="w-full py-2.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                  Tout effacer
                </button>
              </div>
            )}

            <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <span>Notifications configurées</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
