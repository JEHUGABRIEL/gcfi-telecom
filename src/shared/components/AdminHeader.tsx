import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Bell, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { useNotifications } from '@/shared/context/NotificationContext';
import GcfiLogo from './GcfiLogo';
import NotificationCenter from './NotificationCenter';

export default function AdminHeader() {
  const { profile, setShowSignOutModal } = useAuth();
  const { notifications, unreadCount, markAsRead, clearAll, requestPermission } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setShowSignOutModal(true);
    navigate('/', { replace: true });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-[var(--border)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo + badge Admin */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/admin')}>
            <GcfiLogo />
            <span className="hidden sm:flex items-center gap-1.5 bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Administration
            </span>
          </div>

          {/* Info admin + actions */}
          <div className="flex items-center gap-2">

            {/* Profil admin */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-[var(--bg-tertiary)] rounded-full border border-slate-200 dark:border-[var(--border)]">
              <div className="w-7 h-7 bg-[var(--accent)] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-black">
                  {profile?.full_name?.charAt(0) ?? 'A'}
                </span>
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-900 dark:text-white leading-none">
                  {profile?.full_name ?? 'Administrateur'}
                </p>
                <p className="text-[10px] text-[var(--accent)] font-black uppercase tracking-wider">
                  {profile?.role ?? 'admin'}
                </p>
              </div>
            </div>


            {/* Notifications */}
            <button onClick={() => setIsNotificationsOpen(v => !v)}
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              aria-label="Notifications">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--accent)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {/* NotificationCenter via Portal — en dehors du header pour éviter le stacking context */}
            <NotificationCenter
              isOpen={isNotificationsOpen}
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onClearAll={clearAll}
              onRequestPermission={requestPermission}
              onClose={() => setIsNotificationsOpen(false)}
            />

            {/* Déconnexion desktop */}
            <button onClick={handleSignOut}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 border border-red-200 dark:border-red-900/30 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>

            {/* Menu mobile */}
            <button onClick={() => setIsMenuOpen(v => !v)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              aria-label="Menu">
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-secondary)] overflow-hidden">
            <div className="px-4 py-4 space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-[var(--bg-tertiary)] rounded-2xl mb-4">
                <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-black">{profile?.full_name?.charAt(0) ?? 'A'}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{profile?.full_name ?? 'Administrateur'}</p>
                  <p className="text-xs text-[var(--accent)] font-black uppercase tracking-wider">{profile?.role ?? 'admin'}</p>
                </div>
              </div>
              <button onClick={() => { navigate('/admin'); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 w-full transition-all">
                <LayoutDashboard className="w-5 h-5" />
                Tableau de bord
              </button>
              <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 w-full transition-all">
                <LogOut className="w-5 h-5" />
                Se déconnecter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}