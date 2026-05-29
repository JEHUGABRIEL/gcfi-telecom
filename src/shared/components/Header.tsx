'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, GraduationCap, ShoppingBag, Phone, Wrench, BookOpen,
  User, Bell, Search, ShieldCheck, Menu, X, Moon, Sun, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import { useTheme } from '@/shared/context/ThemeContext';
import { cn } from '@/shared/lib/utils';
import GcfiLogo from './GcfiLogo';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import { useNotifications } from '@/shared/context/NotificationContext';

interface HeaderProps {
  onContactOpen: () => void;
}

export default function Header({ onContactOpen }: HeaderProps) {
  const { user, profile, isAdmin, setShowAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, clearAll, requestPermission } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const pathname = usePathname();

  const closeMenu = () => setIsMenuOpen(false);

  // Close drawer on route change
  React.useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const navItems = [
    { to: '/',          label: 'Accueil',   icon: Home },
    { to: '/formation', label: 'Formation', icon: GraduationCap },
    { to: '/boutique',  label: 'Boutique',  icon: ShoppingBag },
    { to: '/services',  label: 'Services',  icon: Wrench },
    { to: '/blog',      label: 'Blog',      icon: BookOpen },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  const displayName = React.useMemo(() => {
    if (profile?.full_name) return profile.full_name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return null;
  }, [profile, user]);

  const isActive = (to: string) => to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="shrink-0">
              <GcfiLogo />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all',
                    isActive(item.to)
                      ? 'bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}

              <button
                onClick={onContactOpen}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-sm ml-1"
              >
                <Phone className="w-4 h-4" />
                Contact
              </button>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                aria-label="Rechercher"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"
                aria-label="Changer de thème"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {user && (
                <>
                  <button
                    onClick={() => setIsNotificationsOpen(v => !v)}
                    className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-[var(--accent)] text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationCenter
                    isOpen={isNotificationsOpen}
                    notifications={notifications}
                    onMarkAsRead={markAsRead}
                    onClearAll={clearAll}
                    onRequestPermission={requestPermission}
                    onClose={() => setIsNotificationsOpen(false)}
                  />
                </>
              )}

              {user ? (
                <Link
                  href="/profil"
                  className="hidden md:flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all border border-slate-200 ml-1"
                >
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt={displayName ?? ''} width={28} height={28} className="rounded-full object-cover ring-2 ring-[var(--accent)]/20" />
                  ) : (
                    <div className="w-7 h-7 bg-[var(--accent)] rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-black">{displayName?.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="max-w-[90px] truncate">{displayName}</span>
                </Link>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-sm ml-1"
                >
                  <User className="w-4 h-4" />
                  Connexion
                </button>
              )}

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setIsMenuOpen(v => !v)}
                className="md:hidden relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all ml-1"
                aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={isMenuOpen}
              >
                <motion.span
                  key={isMenuOpen ? 'x' : 'menu'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
              onClick={closeMenu}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col md:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Menu</span>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User section */}
              {user ? (
                <Link
                  href="/profil"
                  onClick={closeMenu}
                  className="flex items-center gap-3 mx-4 mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt={displayName ?? ''} width={40} height={40} className="rounded-full object-cover ring-2 ring-[var(--accent)]/30 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-black">{displayName?.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName ?? 'Mon profil'}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              ) : (
                <button
                  onClick={() => { setShowAuthModal(true); closeMenu(); }}
                  className="flex items-center gap-3 mx-4 mt-4 p-3 rounded-2xl bg-[var(--accent)] text-white font-bold text-sm transition-all hover:bg-[var(--accent-hover)]"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  Se connecter
                </button>
              )}

              {/* Nav items */}
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item, idx) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Link
                      href={item.to}
                      onClick={closeMenu}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all',
                        isActive(item.to)
                          ? 'bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)] dark:bg-[color-mix(in_srgb,var(--accent)_15%,black)]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      )}
                    >
                      <span className={cn(
                        'p-1.5 rounded-xl',
                        isActive(item.to)
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      )}>
                        <item.icon className="w-4 h-4" />
                      </span>
                      {item.label}
                      {isActive(item.to) && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Contact button at bottom */}
              <div className="px-4 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => { onContactOpen(); closeMenu(); }}
                  className="flex items-center justify-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-lg shadow-[var(--accent)]/20"
                >
                  <Phone className="w-4 h-4" />
                  Nous contacter
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchOpen && (
          <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
