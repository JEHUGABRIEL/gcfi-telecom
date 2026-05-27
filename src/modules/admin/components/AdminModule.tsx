import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ShoppingBag, GraduationCap, Megaphone, FileText, Star, Award,
  TrendingUp, ChevronRight, ChevronLeft, CheckCircle, Clock, AlertCircle,
  Plus, Send, BarChart3, Search, Trash2, Edit, X, MessageSquare, Lock,
  Package, RefreshCw, Menu, BookOpen, Tag, LogOut
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { useNotifications } from '@/shared/context/NotificationContext';
import { useAuth } from '@/shared/context/AuthContext';
import ProductStockManager from './ProductStockManager';
import QuotesTab from './tabs/QuotesTab';
import ContentTab from './tabs/ContentTab';
import OverviewTab from './tabs/OverviewTab';
import OrdersTab from './tabs/OrdersTab';
import UsersTab from './tabs/UsersTab';
import ProductsTab from './tabs/ProductsTab';
import TrainingsTab from './tabs/TrainingsTab';
import BlogTab from './tabs/BlogTab';
import PromoTab from './tabs/PromoTab';
import NotificationsTab from './tabs/NotificationsTab';
import { useSearchParams } from 'react-router-dom';

const VALID_TABS = [
  'overview','notifications','orders','users','formations','produits',
  'stock','commentaires','devis','temoignages','realisations','partenaires','actualites','blog','promotions'
] as const;
type AdminTab = typeof VALID_TABS[number];

const NAV_ITEMS = [
  { tab: 'overview',       icon: BarChart3,     label: 'Vue d\'ensemble' },
  { tab: 'users',          icon: Users,         label: 'Utilisateurs' },
  { tab: 'notifications',  icon: Megaphone,     label: 'Notifications' },
  { tab: 'orders',         icon: ShoppingBag,   label: 'Commandes' },
  { tab: 'formations',     icon: GraduationCap, label: 'Formations' },
  { tab: 'produits',       icon: ShoppingBag,   label: 'Produits' },
  { tab: 'blog',           icon: BookOpen,      label: 'Blog' },
  { tab: 'promotions',     icon: Tag,           label: 'Promotions' },
  { tab: 'stock',          icon: Package,       label: 'Gestion Stock' },
  { tab: 'commentaires',   icon: MessageSquare, label: 'Commentaires' },
  { tab: 'devis',          icon: FileText,      label: 'Devis reçus' },
  { tab: 'temoignages',    icon: Star,          label: 'Témoignages' },
  { tab: 'realisations',   icon: Award,         label: 'Réalisations' },
  { tab: 'partenaires',    icon: Users,         label: 'Partenaires' },
  { tab: 'actualites',     icon: Megaphone,     label: 'Actualités' },
] as const;

const AdminModule = () => {
  const { addNotification } = useNotifications();
  const { user: adminUser, profile: adminProfile, isAdmin: isAuthorized, loading: authLoading, setShowSignOutModal } = useAuth();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = React.useState<AdminTab>(() => {
    const param = searchParams.get('tab') as AdminTab;
    return VALID_TABS.includes(param) ? param : 'overview';
  });
  const [sidebarOpen, setSidebarOpen]           = React.useState(true);
  const [mobileSidebarOpen, setMobileSidebar]   = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{ id: string; table: string } | null>(null);

  // Stats data
  const [users, setUsers]         = React.useState<any[]>([]);
  const [orders, setOrders]       = React.useState<any[]>([]);
  const [trainings, setTrainings] = React.useState<any[]>([]);
  const [loading, setLoading]     = React.useState(true);

  const fetchData = React.useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const [{ data: p }, { data: o }, { data: t }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('trainings').select('*').order('created_at', { ascending: false }),
      ]);
      setUsers(p || []);
      setOrders(o || []);
      setTrainings(t || []);
    } catch (err) { logError('AdminModule/fetchData', err); }
    finally { setLoading(false); }
  }, [isAuthorized]);

  React.useEffect(() => { if (isAuthorized) fetchData(); }, [isAuthorized, fetchData]);

  React.useEffect(() => {
    if (!isAuthorized) return;
    const sub = supabase.channel('admin_orders_global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        addNotification({ title: 'Nouvelle Commande !', message: `Commande reçue de ${payload.new.customer_email || 'un client'}.`, type: 'info' });
        fetchData();
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [isAuthorized, addNotification, fetchData]);

  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      await supabase.from(deleteConfirmation.table).delete().eq('id', deleteConfirmation.id);
      setDeleteConfirmation(null);
      fetchData();
    } catch (err) { logError('AdminModule/delete', err); }
  };

  const monthlyRevenue = orders
    .filter(o => { const d = new Date(o.created_at); const n = new Date(); return o.status === 'completed' && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); })
    .reduce((s, o) => s + (Number(o.total_amount) || Number(o.total) || 0), 0);

  const dynamicStats = [
    { label: 'Utilisateurs', value: users.length.toString(), icon: Users, color: 'blue', change: '+12%' },
    { label: 'Commandes', value: orders.length.toString(), icon: ShoppingBag, color: 'emerald', change: '+8%' },
    { label: 'Cours Actifs', value: trainings.length.toString(), icon: GraduationCap, color: 'red', change: '0%' },
    { label: 'Revenu Mensuel', value: `${(monthlyRevenue / 1000).toFixed(1)}k F`, icon: TrendingUp, color: 'amber', change: '+15%' },
  ];

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 pt-24">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="w-8 h-8 text-[#C1272D] animate-spin" />
        <p className="text-sm font-bold text-slate-500">Vérification des accès...</p>
      </div>
    </div>
  );

  if (!isAuthorized) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 pt-20">
      <div className="max-w-md w-full text-center bg-white p-12 rounded-[2.5rem] shadow-2xl border border-slate-100">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-[#C1272D]" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-4">Accès Refusé</h2>
        <p className="text-slate-600 mb-8">Vous n'avez pas les privilèges nécessaires.</p>
        <button onClick={() => window.location.href = '/'} className="w-full bg-[#C1272D] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">
          Retour à l'accueil
        </button>
      </div>
    </div>
  );

  const displayName = adminProfile?.full_name?.split(' ')[0] || adminUser?.email?.split('@')[0] || 'Admin';
  const roleLabel = adminProfile?.role === 'superadmin' ? 'SUPERADMIN' : 'ADMIN';

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">

      {/* ── Overlay mobile ─────────────────────────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileSidebar(false)}
              className="fixed inset-0 bg-black/40 z-[70] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 z-[80] flex flex-col shadow-2xl lg:hidden"
            >
              <MobileSidebarContent
                activeTab={activeTab}
                onSelect={(tab) => { setActiveTab(tab); setMobileSidebar(false); }}
                onClose={() => setMobileSidebar(false)}
                displayName={displayName}
                roleLabel={roleLabel}
                avatarLetter={displayName[0]?.toUpperCase() || 'A'}
                onLogout={() => setShowSignOutModal(true)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Sidebar desktop ────────────────────────────────────── */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-52' : 'w-16'
      )}>
        {/* Logo zone */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className="w-8 h-8 border-2 border-[#C1272D] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-[#C1272D] font-black text-sm">G</span>
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-black text-slate-900 dark:text-white text-sm leading-none">GCFI</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Centrafrique</p>
            </div>
          )}
        </div>

        {/* Avatar admin */}
        {sidebarOpen && (
          <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-700">
            <div className="w-9 h-9 bg-[#C1272D] rounded-full flex items-center justify-center text-white font-black text-sm shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{displayName}</p>
              <p className="text-[10px] text-[#C1272D] font-black uppercase tracking-widest">{roleLabel}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as AdminTab)}
              title={!sidebarOpen ? label : undefined}
              className={cn(
                'flex items-center gap-3 w-full rounded-xl text-sm font-semibold transition-all',
                sidebarOpen ? 'px-3 py-2.5' : 'p-2.5 justify-center',
                activeTab === tab
                  ? 'bg-red-50 dark:bg-red-900/20 text-[#C1272D]'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </button>
          ))}
        </nav>

        {/* Toggle + Déconnexion */}
        <div className="border-t border-slate-100 dark:border-slate-700 p-2 space-y-1">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="flex items-center justify-center w-full p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 transition-colors"
            title={sidebarOpen ? 'Réduire' : 'Agrandir'}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowSignOutModal(true)}
            className={cn(
              'flex items-center gap-3 w-full rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all',
              sidebarOpen ? 'px-3 py-2.5' : 'p-2.5 justify-center'
            )}
            title={!sidebarOpen ? 'Déconnexion' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 lg:px-8 py-3 flex items-center justify-between shrink-0">
          {/* Mobile : avatar + nom */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C1272D] rounded-full flex items-center justify-center text-white font-black text-sm lg:hidden">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="lg:hidden">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{displayName}</p>
              <p className="text-[10px] text-[#C1272D] font-black uppercase">{roleLabel}</p>
            </div>
          </div>

          {/* Logo centré mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 border-2 border-[#C1272D] rounded-lg flex items-center justify-center">
              <span className="text-[#C1272D] font-black text-xs">G</span>
            </div>
            <div>
              <p className="font-black text-slate-900 dark:text-white text-sm leading-none">GCFI</p>
              <p className="text-[8px] text-slate-400 uppercase tracking-widest">Centrafrique</p>
            </div>
          </div>

          {/* Desktop : spacer */}
          <div className="hidden lg:flex flex-1" />

          {/* Badge ADMINISTRATION */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-[#C1272D] text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full">
              <Award className="w-3.5 h-3.5" />
              Administration
            </div>
            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileSidebar(true)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Contenu tab */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {/* En-tête panel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                Panel <span className="text-[#C1272D]">Administration</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Gérez le contenu, les utilisateurs et les opérations de GCFI.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-slate-200 dark:border-slate-700">
                <BarChart3 className="w-4 h-4" /> Rapport mensuel
              </button>
              <div className="w-10 h-10 rounded-full bg-[#C1272D] flex items-center justify-center text-white font-black">
                {displayName[0]?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Stats (uniquement sur overview) */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {dynamicStats.map((stat, idx) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                  className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn('p-2.5 rounded-xl',
                      stat.color === 'blue'   ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                      : stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                      : stat.color === 'red'     ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
                    )}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-emerald-500">{stat.change}</span>
                  </div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
                </motion.div>
              ))}
            </div>
          )}

          {/* Contenu des tabs */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            {activeTab === 'overview'      && <OverviewTab onNavigate={(t) => setActiveTab(t as AdminTab)} />}
            {activeTab === 'users'         && <UsersTab />}
            {activeTab === 'notifications' && <NotificationsTab onDelete={(id, table) => setDeleteConfirmation({ id, table })} />}
            {activeTab === 'orders'        && <OrdersTab />}
            {activeTab === 'formations'    && <TrainingsTab />}
            {activeTab === 'produits'      && <ProductsTab />}
            {activeTab === 'blog'          && <BlogTab />}
            {activeTab === 'promotions'    && <PromoTab />}
            {activeTab === 'stock'         && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Package className="w-10 h-10 text-[#C1272D]" />
                  </div>
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Bientôt</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Coming Soon...</h3>
                <p className="text-slate-500 max-w-xs">Le module de gestion de stock est en cours de développement. Il sera disponible très prochainement.</p>
                <div className="mt-6 flex items-center gap-2 text-xs text-[#C1272D] font-bold bg-red-50 px-5 py-2.5 rounded-full">
                  <span className="w-2 h-2 bg-[#C1272D] rounded-full animate-pulse" /> En développement actif
                </div>
              </div>
            )}
            {activeTab === 'commentaires' && (
              <div><h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Commentaires</h3><p className="text-slate-500">Module de gestion des commentaires en cours de développement</p></div>
            )}
            {activeTab === 'devis'         && <QuotesTab />}
            {activeTab === 'temoignages'   && <ContentTab type="testimonials" />}
            {activeTab === 'realisations'  && <ContentTab type="achievements" />}
            {activeTab === 'partenaires'   && <ContentTab type="partners" />}
            {activeTab === 'actualites'    && <ContentTab type="news" />}
          </div>
        </main>
      </div>

      {/* ── Modal confirmation suppression ─────────────────────── */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-7 h-7 text-[#C1272D]" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirmer la suppression</h3>
              <p className="text-slate-500 text-sm mb-7">Cette action est irréversible.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setDeleteConfirmation(null)}
                  className="py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-600">Annuler</button>
                <button onClick={handleDelete}
                  className="py-3 rounded-2xl font-bold text-sm bg-[#C1272D] text-white">Supprimer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Sidebar mobile content ──────────────────────────────────── */
function MobileSidebarContent({ activeTab, onSelect, onClose, displayName, roleLabel, avatarLetter, onLogout }: {
  activeTab: string; onSelect: (tab: string) => void; onClose: () => void;
  displayName: string; roleLabel: string; avatarLetter: string; onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 border-2 border-[#C1272D] rounded-lg flex items-center justify-center">
            <span className="text-[#C1272D] font-black text-xs">G</span>
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-white text-sm leading-none">GCFI</p>
            <p className="text-[8px] text-slate-400 uppercase tracking-widest">Centrafrique</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ tab, icon: Icon, label }) => (
          <button key={tab} onClick={() => onSelect(tab)}
            className={cn('flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
              activeTab === tab ? 'bg-red-50 dark:bg-red-900/20 text-[#C1272D]' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50')}>
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="border-t border-slate-100 dark:border-slate-700 p-3">
        <button onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
}

export default AdminModule;