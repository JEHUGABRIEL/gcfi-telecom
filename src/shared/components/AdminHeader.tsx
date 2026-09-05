'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { Bell, LogOut, Menu, X, LayoutDashboard, Search, Settings, User, Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/context/AuthContext';
import { useNotifications } from '@/shared/context/NotificationContext';
import { useLang } from '@/shared/context/LanguageContext';
import { useTheme } from '@/shared/context/ThemeContext';
import { cn } from '@/shared/lib/utils';
import GcfiLogo from './GcfiLogo';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';

export default function AdminHeader() {
  const { t } = useLang();
  const { profile, setShowSignOutModal } = useAuth();
  const { notifications, unreadCount, markAsRead, clearAll, requestPermission } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const settingsRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Ferme le menu engrenage quand on clique ailleurs
  React.useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleSignOut = async () => {
    setShowSignOutModal(true);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-[var(--border)] transition-colors">
      <div className="flex items-center justify-between h-16">

          {/* Logo + Administration — bandeau rouge aligné au-dessus de la sidebar */}
          <div className="flex items-center h-16 shrink-0 bg-[var(--accent)] text-white px-4 sm:px-6 lg:w-72 cursor-pointer" onClick={() => router.push('/admin')}>
            <GcfiLogo showText={false} />
            <span className="ml-2.5 font-black text-base tracking-tight truncate">{t.admin_page.badge}</span>
          </div>

          {/* Info admin + actions */}
          <div className="flex items-center gap-2 px-4 sm:px-6 ml-auto">

            {/* Profil admin */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-[var(--bg-tertiary)] rounded-full border border-slate-200 dark:border-[var(--border)]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile?.full_name ?? 'Admin'} width={28} height={28} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center bg-[var(--accent)] text-white text-xs font-black">
                    {profile?.full_name?.charAt(0) ?? 'A'}
                  </span>
                )}
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-900 dark:text-white leading-none">
                  {profile?.full_name ?? t.admin_page.admin_label}
                </p>
                <p className="text-[10px] text-[var(--accent)] font-black uppercase tracking-wider">
                  {profile?.role ?? 'admin'}
                </p>
              </div>
            </div>

            {/* Recherche globale */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              aria-label="Recherche globale"
              title="Recherche globale (Ctrl K)"
            >
              <Search className="w-5 h-5" />
            </button>
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Engrenage — Mon Profil + mode clair/sombre */}
            <div ref={settingsRef} className="relative">
              <button
                onClick={() => setIsSettingsOpen(v => !v)}
                className={cn('p-2 rounded-full transition-all',
                  isSettingsOpen
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800')}
                aria-label={t.admin_page.profile_photo_title}
                title={t.admin_page.profile_photo_title}
              >
                <Settings className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    {/* Lien vers la page Mon Profil (/profil) */}
                    <Link
                      href="/profil"
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <span className="p-1.5 rounded-lg bg-[#C1272D]/10 text-[#C1272D]">
                        <User className="w-4 h-4" />
                      </span>
                      {t.profile_page.my_profile}
                    </Link>
                    <div className="border-t border-slate-100 dark:border-slate-700" />
                    <button
                      onClick={() => { setIsSettingsOpen(false); toggleTheme(); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500">
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </span>
                      {theme === 'dark' ? t.admin_page.theme_light : t.admin_page.theme_dark}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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
              {t.admin_page.disconnect}
            </button>

            {/* Menu mobile */}
            <button onClick={() => setIsMenuOpen(v => !v)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              aria-label="Menu">
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-secondary)] overflow-hidden">
            <div className="px-4 py-4 space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-[var(--bg-tertiary)] rounded-2xl mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt={profile?.full_name ?? 'Admin'} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center bg-[var(--accent)] text-white text-sm font-black">{profile?.full_name?.charAt(0) ?? 'A'}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{profile?.full_name ?? t.admin_page.admin_label}</p>
                  <p className="text-xs text-[var(--accent)] font-black uppercase tracking-wider">{profile?.role ?? 'admin'}</p>
                </div>
              </div>
              <button onClick={() => { router.push('/admin'); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 w-full transition-all">
                <LayoutDashboard className="w-5 h-5" />
                {t.admin_page.dashboard}
              </button>
              {profile && (profile.role === 'admin' || profile.role === 'superadmin') && (
                <Link href="/profil" onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 w-full transition-all">
                  <User className="w-5 h-5" />
                  {t.profile_page.my_profile}
                </Link>
              )}
              <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 w-full transition-all">
                <LogOut className="w-5 h-5" />
                {t.admin_page.sign_out}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}