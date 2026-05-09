import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Bell, LogOut, Menu, X, LayoutDashboard, Sun, Moon, Search, Package, Users, ShoppingBag, GraduationCap, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { useTheme } from '@/shared/context/ThemeContext';
import { useNotifications } from '@/shared/context/NotificationContext';
import { supabase } from '@/shared/lib/supabase';
import GcfiLogo from './GcfiLogo';
import NotificationCenter from './NotificationCenter';

interface SearchResult {
  id: string;
  type: 'user' | 'order' | 'product' | 'training' | 'quote';
  label: string;
  sub: string;
}

function AdminSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // ✅ Mapping type → onglet admin
  const TAB_MAP: Record<SearchResult['type'], string> = {
    user:     'users',
    order:    'orders',
    product:  'produits',
    training: 'formations',
    quote:    'devis',
  };

  React.useEffect(() => { inputRef.current?.focus(); }, []);

  React.useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timeout = setTimeout(() => search(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  async function search(q: string) {
    setLoading(true);
    const like = `%${q}%`;
    const [users, orders, products, trainings, quotes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, role').or(`full_name.ilike.${like},email.ilike.${like}`).limit(4),
      supabase.from('orders').select('id, customer_email, status, total').or(`customer_email.ilike.${like},status.ilike.${like}`).limit(4),
      supabase.from('products').select('id, name, category, price').or(`name.ilike.${like},category.ilike.${like}`).limit(4),
      supabase.from('trainings').select('id, title, category').or(`title.ilike.${like},category.ilike.${like}`).limit(4),
      supabase.from('quotes').select('id, full_name, email, service_type').or(`full_name.ilike.${like},email.ilike.${like},service_type.ilike.${like}`).limit(4),
    ]);
    const all: SearchResult[] = [
      ...(users.data || []).map(u => ({ id: u.id, type: 'user' as const, label: u.full_name || u.email, sub: u.role })),
      ...(orders.data || []).map(o => ({ id: o.id, type: 'order' as const, label: `Commande #${o.id.slice(0,8)}`, sub: `${o.status} · ${o.total?.toLocaleString()} FCFA` })),
      ...(products.data || []).map(p => ({ id: p.id, type: 'product' as const, label: p.name, sub: `${p.category} · ${p.price?.toLocaleString()} FCFA` })),
      ...(trainings.data || []).map(t => ({ id: t.id, type: 'training' as const, label: t.title, sub: t.category })),
      ...(quotes.data || []).map(q => ({ id: q.id, type: 'quote' as const, label: q.full_name || q.email, sub: q.service_type })),
    ];
    setResults(all);
    setLoading(false);
  }

  const icons: Record<SearchResult['type'], React.ReactNode> = {
    user:     <Users className="w-4 h-4 text-blue-500" />,
    order:    <ShoppingBag className="w-4 h-4 text-green-500" />,
    product:  <Package className="w-4 h-4 text-amber-500" />,
    training: <GraduationCap className="w-4 h-4 text-purple-500" />,
    quote:    <FileText className="w-4 h-4 text-rose-500" />,
  };
  const labels: Record<SearchResult['type'], string> = {
    user: 'Utilisateur', order: 'Commande', product: 'Produit', training: 'Formation', quote: 'Devis',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: -20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher utilisateurs, commandes, produits..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none text-sm font-medium" />
          {loading && <div className="w-4 h-4 border-2 border-slate-200 border-t-[#2563B0] rounded-full animate-spin shrink-0" />}
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Search className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Tapez au moins 2 caractères</p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">Aucun résultat pour <span className="font-bold text-slate-600 dark:text-slate-300">&ldquo;{query}&rdquo;</span></p>
            </div>
          ) : (
            <div className="py-2">
              {results.map(r => (
                <div key={`${r.type}-${r.id}`}
                  onClick={() => {
                    navigate(`/admin?tab=${TAB_MAP[r.type]}`);
                    onClose();
                  }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {icons[r.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.label}</p>
                    <p className="text-xs text-slate-500 truncate">{r.sub}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                    {labels[r.type]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminHeader() {
  const { profile, setShowSignOutModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-[var(--border)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/admin')}>
              <GcfiLogo />
              <span className="hidden sm:flex items-center gap-1.5 bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Administration
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-[var(--bg-tertiary)] rounded-full border border-slate-200 dark:border-[var(--border)]">
                <div className="w-7 h-7 bg-[var(--accent)] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-black">{profile?.full_name?.charAt(0) ?? 'A'}</span>
                </div>
                <div className="text-sm">
                  <p className="font-bold text-slate-900 dark:text-white leading-none">{profile?.full_name ?? 'Administrateur'}</p>
                  <p className="text-[10px] text-[var(--accent)] font-black uppercase tracking-wider">{profile?.role ?? 'admin'}</p>
                </div>
              </div>

              {/* ✅ Recherche */}
              <button onClick={() => setIsSearchOpen(true)} title="Recherche globale"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                <Search className="w-5 h-5" />
              </button>

              {/* ✅ Light/Dark toggle */}
              <button onClick={toggleTheme} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setIsNotificationsOpen(v => !v)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--accent)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {/* ✅ Props corrigées */}
                <NotificationCenter isOpen={isNotificationsOpen} notifications={notifications}
                  onMarkRead={markAsRead} onClearAll={clearAll} onClose={() => setIsNotificationsOpen(false)} />
              </div>

              <button onClick={() => setShowSignOutModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 border border-red-200 dark:border-red-900/30 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>

              <button onClick={() => setIsMenuOpen(v => !v)}
                className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

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
                  <LayoutDashboard className="w-5 h-5" /> Tableau de bord
                </button>
                <button onClick={() => { setIsSearchOpen(true); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 w-full transition-all">
                  <Search className="w-5 h-5" /> Recherche
                </button>
                <button onClick={() => { toggleTheme(); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 w-full transition-all">
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                  {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                </button>
                <button onClick={() => { setShowSignOutModal(true); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 w-full transition-all">
                  <LogOut className="w-5 h-5" /> Se déconnecter
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {isSearchOpen && <AdminSearch onClose={() => setIsSearchOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
