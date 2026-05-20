import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, GraduationCap, ShoppingBag, Phone, Wrench, BookOpen,
  User, Bell, Search, ShieldCheck, Menu, X, LogOut, Moon, Sun
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
  const { user, profile, isAdmin, setShowSignOutModal, setShowAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, clearAll, requestPermission } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const navItems = [
    { to: '/',          label: 'Accueil',   icon: Home },
    { to: '/formation', label: 'Formation', icon: GraduationCap },
    { to: '/boutique',  label: 'Boutique',  icon: ShoppingBag },
    { to: '/services',  label: 'Services',  icon: Wrench },
    { to: '/blog',      label: 'Blog',      icon: BookOpen },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  // Prénom ou username de l'utilisateur connecté
  const displayName = React.useMemo(() => {
    if (profile?.full_name) return profile.full_name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return null;
  }, [profile, user]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <NavLink to="/" className="shrink-0">
              <GcfiLogo />
            </NavLink>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to!}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all',
                      isActive
                        ? 'text-[var(--accent)] font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("w-4 h-4", isActive && "text-[var(--accent)]")} />
                      <span className={isActive ? "text-[var(--accent)]" : ""}>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)] rounded-full"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              {/* Bouton Contact — blanc avec bordure bleue */}
              <button
                onClick={onContactOpen}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[var(--accent)] bg-white border-2 border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_8%,white)] transition-all ml-1"
              >
                <Phone className="w-4 h-4" />
                Contact
              </button>
            </nav>

            {/* Actions droite */}
            <div className="flex items-center gap-2">
              {/* Recherche */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Toggle Dark / Light */}
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notifications — visible uniquement si connecté */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen(v => !v)}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all relative"
                    title="Mes notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--accent)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <NotificationCenter
                        notifications={notifications}
                        onMarkAsRead={markAsRead}
                        onClearAll={clearAll}
                        onRequestPermission={requestPermission}
                        onClose={() => setIsNotificationsOpen(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* User — bouton Connexion ou avatar+nom selon état */}
              {user ? (
                <NavLink
                  to="/profil"
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all border border-slate-200"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName ?? ''}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-[var(--accent)]/30"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-[var(--accent)] rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-black">
                        {displayName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-slate-700 max-w-[100px] truncate">{displayName}</span>
                </NavLink>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-md shadow-[color-mix(in_srgb,var(--accent)_15%,transparent)]"
                >
                  <User className="w-4 h-4" />
                  Connexion
                </button>
              )}



              {/* Menu hamburger mobile */}
              <button
                onClick={() => setIsMenuOpen(v => !v)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {navItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to!}
                    end={item.to === '/'}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all',
                        isActive
                          ? 'text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,white)]'
                          : 'text-slate-600 hover:bg-slate-50'
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}
                <button
                  onClick={() => { onContactOpen(); closeMenu(); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-[var(--accent)] border-2 border-[var(--accent)] w-full transition-all hover:bg-[color-mix(in_srgb,var(--accent)_8%,white)]"
                >
                  <Phone className="w-5 h-5" />
                  Contact
                </button>

                {user ? (
                  <>
                    <NavLink
                      to="/profil"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={displayName ?? ''}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--accent)]/30 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-black">
                            {displayName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="truncate">{displayName ?? 'Mon profil'}</span>
                    </NavLink>

                  </>
                ) : (
                  <button
                    onClick={() => { setShowAuthModal(true); closeMenu(); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] w-full transition-all"
                  >
                    <User className="w-5 h-5" />
                    Se connecter
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Global Search */}
      <AnimatePresence>
        {isSearchOpen && (
          <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}