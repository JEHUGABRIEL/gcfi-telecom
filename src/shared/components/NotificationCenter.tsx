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
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onRequestPermission?: () => void;
}

export default function NotificationCenter({
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll,
  onRequestPermission,
}: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
      >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell className="w-5 h-5 text-slate-900 dark:text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-50 dark:border-transparent">
                    <Bell className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Vous n'avez aucune notification pour le moment.</p>
                </div>
              ) : (
                notifications.map((notification: AppNotification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onMarkAsRead(notification.id)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer group relative",
                      notification.read 
                        ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800" 
                        : "bg-red-50/30 dark:bg-red-900/10 border-red-100 dark:border-red-900/20"
                    )}
                  >
                    {!notification.read && (
                      <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        notification.type === 'order' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" :
                        notification.type === 'offer' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-600"
                      )}>
                        {notification.type === 'order' ? <Package className="w-5 h-5" /> :
                         notification.type === 'offer' ? <Tag className="w-5 h-5" /> :
                         <Info className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-red-500 transition-colors">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Intl.DateTimeFormat('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short'
                          }).format(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={onClearAll}
                  className="w-full py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                >
                  Tout effacer
                </button>
              </div>
            )}
            
            <div className="p-6 bg-white dark:bg-slate-800/50 mt-auto border-t border-slate-50 dark:border-transparent">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Notifications Push configurées</span>
              </div>
            </div>
      </motion.div>
    </>
  );
}