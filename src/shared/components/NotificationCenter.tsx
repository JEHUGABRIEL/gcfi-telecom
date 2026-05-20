import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Package, Tag, Info, CheckCircle, Trash2 } from 'lucide-react';
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
}: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Backdrop — z-[200] pour couvrir header et tout le reste */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Panel latéral — z-[201] au-dessus du backdrop */}
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 bottom-0 z-[201] w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
      >
        {/* ── En-tête ──────────────────────────────────────────── */}
        <div className="shrink-0 p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-[var(--accent-light)] rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-[var(--accent)]" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-[var(--accent)] font-bold">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          {/* Bouton fermer — stopPropagation pour éviter tout conflit */}
          <button
            onClick={e => { e.stopPropagation(); onClose(); }}
            className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Liste des notifications — flex-1 + overflow-y-auto ── */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2 min-h-0">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 min-h-[200px]">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Aucune notification</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Vous êtes à jour !</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onMarkAsRead(notif.id)}
                className={cn(
                  'p-4 rounded-2xl border transition-all cursor-pointer group relative',
                  notif.read
                    ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                    : 'bg-[var(--accent-light)] border-[var(--accent)]/20 hover:border-[var(--accent)]/40'
                )}
              >
                {!notif.read && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-[var(--accent)] rounded-full" />
                )}
                <div className="flex gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    notif.type === 'order' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    : notif.type === 'offer' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  )}>
                    {notif.type === 'order' ? <Package className="w-4 h-4" />
                    : notif.type === 'offer' ? <Tag className="w-4 h-4" />
                    : <Info className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5 group-hover:text-[var(--accent)] transition-colors truncate">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Intl.DateTimeFormat('fr-FR', {
                        hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
                      }).format(notif.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ── Pied de panel ─────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {notifications.length > 0 && (
            <button
              onClick={e => { e.stopPropagation(); onClearAll(); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[var(--accent)] transition-colors border-b border-slate-100 dark:border-slate-800"
            >
              <Trash2 className="w-3.5 h-3.5" /> Tout effacer
            </button>
          )}
          <div className="flex items-center gap-2 px-5 py-3 text-xs text-slate-400">
            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <span>Notifications configurées</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}