'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, GraduationCap, ShoppingBag, Phone, Wrench, BookOpen,
  User, Bell, Search, ShieldCheck, Menu, X, Moon, Sun,
  ChevronDown, ChevronRight, ArrowRight,
  Wifi, Network, Video, Globe, Radio,
  Megaphone, Palette, Film
} from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import { useTheme } from '@/shared/context/ThemeContext';
import { useLang, type Translations } from '@/shared/context/LanguageContext';
import { cn } from '@/shared/lib/utils';
import GcfiLogo from './GcfiLogo';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import { useNotifications } from '@/shared/context/NotificationContext';

interface HeaderProps { onContactOpen: () => void; }

const SERVICES_MENU = (t: Translations) => [
  {
    category: t.header.mega_telecom,
    items: [
      { icon: Network,  label: t.header.mega_service_items.lan,       desc: t.header.mega_service_descs.lan,     href: '/services' },
      { icon: Wifi,     label: t.header.mega_service_items.wan,       desc: t.header.mega_service_descs.wan,     href: '/services' },
      { icon: Globe,    label: t.header.mega_service_items.starlink,  desc: t.header.mega_service_descs.starlink, href: '/services' },
      { icon: Radio,    label: t.header.mega_service_items.p2p,       desc: t.header.mega_service_descs.p2p,     href: '/services' },
      { icon: Video,    label: t.header.mega_service_items.cctv,      desc: t.header.mega_service_descs.cctv,    href: '/services' },
    ],
  },
  {
    category: t.header.mega_comm,
    items: [
      { icon: Megaphone, label: t.header.mega_service_items.digital, desc: t.header.mega_service_descs.digital, href: '/services' },
      { icon: Palette,   label: t.header.mega_service_items.content, desc: t.header.mega_service_descs.content, href: '/services' },
      { icon: Film,      label: t.header.mega_service_items.video,   desc: t.header.mega_service_descs.video,   href: '/services' },
    ],
  },
];

const FORMATION_MENU = (t: Translations) => [
  { label: t.header.mega_training_items.infra, desc: t.header.mega_training_descs.infra, href: '/formation' },
  { label: t.header.mega_training_items.cyber, desc: t.header.mega_training_descs.cyber, href: '/formation' },
  { label: t.header.mega_training_items.wifi,  desc: t.header.mega_training_descs.wifi,  href: '/formation' },
  { label: t.header.mega_training_items.isp,   desc: t.header.mega_training_descs.isp,   href: '/formation' },
];

function MegaMenu({ type, onClose, t }: { type: 'services' | 'formations'; onClose: () => void; t: Translations }) {
  const services = SERVICES_MENU(t);
  const formations = FORMATION_MENU(t);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }}
      className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {type === 'services' ? (
          <div className="grid grid-cols-3 gap-10">
            {services.map(group => (
              <div key={group.category}>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#C1272D] mb-4">{group.category}</p>
                <div className="space-y-1">
                  {group.items.map(item => (
                    <Link key={item.label} href={item.href} onClick={onClose}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                      <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#C1272D] transition-colors">
                        <item.icon className="w-4 h-4 text-[#C1272D] group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#C1272D] mb-2">{t.header.mega_services_title}</p>
                <h3 className="text-xl font-black text-white leading-tight mb-3">{t.header.mega_services_subtitle}</h3>
                <p className="text-sm text-slate-400">{t.header.mega_services_desc}</p>
              </div>
              <Link href="/#contact" onClick={onClose}
                className="mt-6 flex items-center gap-2 bg-[#C1272D] text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                {t.header.mega_services_cta} <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {formations.map(item => (
              <Link key={item.label} href={item.href} onClick={onClose}
                className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-[#C1272D] hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-all group">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#C1272D] transition-colors">
                  <GraduationCap className="w-5 h-5 text-[#C1272D] group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{item.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                <p className="text-xs font-black text-[#C1272D] mt-3 flex items-center gap-1">
                  {t.header.mega_training_cta} <ChevronRight className="w-3 h-3" />
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Header({ onContactOpen }: HeaderProps) {
  const { user, profile, isAdmin, setShowAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, setLang } = useLang();
  const { notifications, unreadCount, markAsRead, clearAll, requestPermission } = useNotifications();
  const [isMenuOpen,   setIsMenuOpen]   = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isNotifOpen,  setIsNotifOpen]  = React.useState(false);
  const [megaMenu,     setMegaMenu]     = React.useState<'services' | 'formations' | null>(null);
  const pathname = usePathname();
  const headerRef = React.useRef<HTMLElement>(null);

  const closeMenu = () => setIsMenuOpen(false);
  const closeMega = () => setMegaMenu(null);

  React.useEffect(() => { setIsMenuOpen(false); closeMega(); }, [pathname]);
  React.useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);
  React.useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) closeMega();
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const displayName = React.useMemo(() => {
    if (profile?.full_name) return profile.full_name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return null;
  }, [profile, user]);

  const isActive = (to: string) => to === '/' ? pathname === '/' : pathname.startsWith(to);

  const mobileNavItems = [
    { to: '/',          label: t.nav.home,       icon: Home },
    { to: '/services',  label: t.nav.services,   icon: Wrench },
    { to: '/formation', label: t.nav.formations, icon: GraduationCap },
    { to: '/boutique',  label: t.nav.boutique,   icon: ShoppingBag },
    { to: '/blog',      label: t.nav.blog,       icon: BookOpen },
    ...(isAdmin ? [{ to: '/admin', label: t.nav.admin, icon: ShieldCheck }] : []),
  ];

  return (
    <>
      <header ref={headerRef}
        className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── 3-column grid: logo | nav | actions ── */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center h-[68px] gap-4">

            {/* Logo */}
            <Link href="/" onClick={closeMega} className="shrink-0">
              <GcfiLogo />
            </Link>

            {/* Nav — parfaitement centré */}
            <nav className="hidden lg:flex items-center justify-center gap-0.5">

              <Link href="/"
                className={cn('px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                  isActive('/') ? 'text-[#C1272D] bg-red-50 dark:bg-red-900/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')}>
                {t.nav.home}
              </Link>

              <button onClick={() => setMegaMenu(m => m === 'services' ? null : 'services')}
                className={cn('flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                  pathname.startsWith('/services') || megaMenu === 'services'
                    ? 'text-[#C1272D] bg-red-50 dark:bg-red-900/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')}>
                {t.nav.services}
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', megaMenu === 'services' && 'rotate-180')} />
              </button>

              <button onClick={() => setMegaMenu(m => m === 'formations' ? null : 'formations')}
                className={cn('flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                  pathname.startsWith('/formation') || megaMenu === 'formations'
                    ? 'text-[#C1272D] bg-red-50 dark:bg-red-900/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')}>
                {t.nav.formations}
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', megaMenu === 'formations' && 'rotate-180')} />
              </button>

              <Link href="/boutique"
                className={cn('px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                  isActive('/boutique') ? 'text-[#C1272D] bg-red-50 dark:bg-red-900/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')}>
                {t.nav.boutique}
              </Link>

              <Link href="/blog"
                className={cn('px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                  isActive('/blog') ? 'text-[#C1272D] bg-red-50 dark:bg-red-900/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')}>
                {t.nav.blog}
              </Link>

              {isAdmin && (
                <Link href="/admin"
                  className={cn('flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                    isActive('/admin') ? 'text-[#C1272D] bg-red-50 dark:bg-red-900/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')}>
                  <ShieldCheck className="w-3.5 h-3.5" /> {t.nav.admin}
                </Link>
              )}
            </nav>

            {/* Actions droite */}
            <div className="flex items-center gap-1 justify-end">

              <button onClick={() => { setIsSearchOpen(true); closeMega(); }}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Search className="w-5 h-5" />
              </button>

              <button onClick={toggleTheme}
                className="hidden lg:inline-flex p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {user && (
                <>
                  <button onClick={() => setIsNotifOpen(v => !v)}
                    className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#C1272D] text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationCenter isOpen={isNotifOpen} notifications={notifications}
                    onMarkAsRead={markAsRead} onClearAll={clearAll}
                    onRequestPermission={requestPermission} onClose={() => setIsNotifOpen(false)} />
                </>
              )}

              <div className="hidden lg:block">
                <LanguageSwitcher />
              </div>
              <div className="hidden lg:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

              {user ? (
                <Link href="/profil"
                  className="hidden lg:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt={displayName ?? ''} width={26} height={26} className="rounded-lg object-cover" />
                  ) : (
                    <div className="w-6 h-6 bg-[#C1272D] rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-[10px] font-black">{displayName?.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="max-w-[72px] truncate">{displayName}</span>
                </Link>
              ) : (
                <button onClick={() => setShowAuthModal(true)}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <User className="w-4 h-4" /> {t.nav.connexion}
                </button>
              )}

              <button onClick={onContactOpen}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#C1272D] hover:bg-red-700 transition-colors shadow-sm">
                <Phone className="w-4 h-4" /> {t.nav.contact}
              </button>

              <button onClick={() => setIsMenuOpen(v => !v)}
                className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {megaMenu && <MegaMenu type={megaMenu} onClose={closeMega} t={t} />}
        </AnimatePresence>
      </header>

      {/* Overlay mega menu */}
      <AnimatePresence>
        {megaMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px]"
            style={{ top: '68px' }} onClick={closeMega} />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
              onClick={closeMenu} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col lg:hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <GcfiLogo />
                <button onClick={closeMenu} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {user ? (
                <Link href="/profil" onClick={closeMenu}
                  className="flex items-center gap-3 mx-4 mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                  <div className="w-10 h-10 bg-[#C1272D] rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-black">{displayName?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </Link>
              ) : (
                <button onClick={() => { setShowAuthModal(true); closeMenu(); }}
                  className="flex items-center gap-3 mx-4 mt-4 p-3 rounded-xl bg-[#C1272D] text-white font-bold text-sm hover:bg-red-700 transition-all">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  {t.header.login_mobile}
                </button>
              )}
              <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
                {mobileNavItems.map((item, idx) => (
                  <motion.div key={item.to} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}>
                    <Link href={item.to} onClick={closeMenu}
                      className={cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                        isActive(item.to) ? 'bg-red-50 dark:bg-red-900/20 text-[#C1272D]' : 'text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                      <span className={cn('p-1.5 rounded-lg shrink-0',
                        isActive(item.to) ? 'bg-[#C1272D] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
                        <item.icon className="w-4 h-4" />
                      </span>
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="px-4 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-center gap-4">
                  <button onClick={toggleTheme}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                    {theme === 'dark' ? <><Sun className="w-4 h-4" /> Clair</> : <><Moon className="w-4 h-4" /> Sombre</>}
                  </button>
                  {[{ code: 'fr' as const, label: 'FR', flag: '🇫🇷' }, { code: 'en' as const, label: 'EN', flag: '🇬🇧' }].map(l => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                        lang === l.code
                          ? 'bg-[#C1272D] text-white'
                          : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => { onContactOpen(); closeMenu(); }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl text-sm font-bold text-white bg-[#C1272D] hover:bg-red-700 transition-all shadow-lg">
                  <Phone className="w-4 h-4" /> {t.header.contact_us}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchOpen && <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
      </AnimatePresence>
    </>
  );
}