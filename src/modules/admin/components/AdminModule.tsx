'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { 
  Users,
  ShoppingBag,
  GraduationCap,
  Megaphone,
  FileText,
  Star,
  Award,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Send,
  BarChart3,
  Search,
  Filter,
  Trash2,
  Edit,
  X,
  Menu,
  MessageSquare,
  Lock,
  Package,
  Minus,
  RefreshCw,
  Tag,
  Wrench,
  Megaphone as MegaphoneIcon,
  LogOut
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { useNotifications } from '@/shared/context/NotificationContext';
import { useAuth } from '@/shared/context/AuthContext';
import { useLang } from '@/shared/context/LanguageContext';
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
import ServicesTab from './tabs/ServicesTab';
import AnnouncementsTab from './tabs/AnnouncementsTab';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAdminProducts, useAdminComments, useAdminNotifications,
} from '@/shared/lib/queries';
import { useAdminToast, AdminToast } from '@/shared/components/AdminToast';

const VALID_TABS = ['overview','notifications','orders','users','formations','produits','stock','commentaires','devis','temoignages','realisations','partenaires','actualites','blog','promotions','services','annonces'] as const;
type AdminTab = typeof VALID_TABS[number];

// Tables qui supportent le soft delete (les autres — logs, notifications — restent en suppression dure)
const SOFT_DELETE_TABLES = ['products', 'trainings', 'blog_posts', 'testimonials', 'achievements', 'partners', 'news', 'services', 'announcements', 'quotes'];

interface SidebarItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

const AdminModule = () => {
  const { t } = useLang();
  const { addNotification } = useNotifications();
  const { toast, showToast, dismiss } = useAdminToast();
  const { user: adminUser, profile: adminProfile, isAdmin: isAuthorized, loading: authLoading, setShowSignOutModal } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<AdminTab>(() => {
    const param = searchParams.get('tab') as AdminTab;
    return VALID_TABS.includes(param) ? param : 'overview';
  });
  const [msgTitle, setMsgTitle] = React.useState('');
  const [msgContent, setMsgContent] = React.useState('');
  const [category, setCategory] = React.useState('info');
  const [isSending, setIsSending] = React.useState(false);
  const [sendSuccess, setSendSuccess] = React.useState(false);
  
  const queryClient = useQueryClient();
  const { data: products = [] }         = useAdminProducts(isAuthorized);
  const { data: comments = [] }         = useAdminComments(isAuthorized);
  const { data: allNotifications = [] } = useAdminNotifications(isAuthorized);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any>(null);
  const [formType, setFormType] = React.useState<'product' | 'training' | null>(null);

  // Sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = React.useState('');

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{ id: string, table: string } | null>(null);

  React.useEffect(() => {
    if (!isAuthorized) return;

    // Listen for new orders in real-time
    const ordersSubscription = supabase
      .channel('admin_orders_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          // Nouvelle commande reçue
          const newOrder = payload.new;
          
          // Add notification via context
          addNotification({
            title: ap.notif_new_order,
            message: ap.notif_order_received.replace('{id}', newOrder.id.slice(0, 8)).replace('{email}', newOrder.customer_email || ap.notif_unknown_customer),
            type: 'info'
          });

          // Refresh orders cache
          queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [isAuthorized, addNotification, queryClient]);

  // Alertes temps réel : devis reçus, nouvelles inscriptions, et
  // ajout / modification / suppression de produits, formations, articles.
  React.useEffect(() => {
    if (!isAuthorized) return;
    const ap2 = t.admin_page;

    const entityAlert = (
      payload: { eventType: string; new?: any; old?: any },
      nameKey: string,
      labels: Record<string, string>
    ) => {
      const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as any;
      const name = row?.[nameKey] ? String(row[nameKey]) : '';
      // Un soft delete arrive comme UPDATE avec deleted_at renseigné → on l'annonce comme suppression
      const eventType = payload.eventType === 'UPDATE' && row?.deleted_at ? 'DELETE' : payload.eventType;
      const title = labels[eventType];
      if (title) addNotification({ title, message: name, type: 'info' });
    };

    const channel = supabase
      .channel('admin_content_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const q = payload.new as any;
          const who = q.email || q.full_name || ap2.notif_unknown_customer;
          addNotification({ title: ap2.notif_new_quote, message: `${who}${q.service_type ? ` — ${q.service_type}` : ''}`, type: 'info' });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
        const p = payload.new as any;
        addNotification({ title: ap2.notif_new_signup, message: p.email || '', type: 'info' });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) =>
        entityAlert(payload, 'name', { INSERT: ap2.notif_product_added, UPDATE: ap2.notif_product_updated, DELETE: ap2.notif_product_deleted })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trainings' }, (payload) =>
        entityAlert(payload, 'title', { INSERT: ap2.notif_training_added, UPDATE: ap2.notif_training_updated, DELETE: ap2.notif_training_deleted })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, (payload) =>
        entityAlert(payload, 'title', { INSERT: ap2.notif_blog_added, UPDATE: ap2.notif_blog_updated, DELETE: ap2.notif_blog_deleted })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthorized, addNotification, t]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    const table = formType === 'product' ? 'products' : 'trainings';
    
    try {
      if (editingItem) {
        const { error } = await supabase.from(table).update(data).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert([data]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      showToast(`${t.admin_page.item} ${t.admin_page.save_success}`);
    } catch (err) {
      logError("AdminModule: Error saving item", err);
      showToast(t.admin_page.save_error, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    const { id, table } = deleteConfirmation;
    try {
      const { error } = SOFT_DELETE_TABLES.includes(table)
        ? await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id)
        : await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      setDeleteConfirmation(null);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      showToast(t.admin_page.delete_success);
    } catch (err) {
      logError("AdminModule: Error deleting item", err);
      showToast(t.admin_page.delete_error, 'error');
    }
  };

  const handleApproveComment = async (id: string) => {
    try {
      const { error } = await supabase.from('comments').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
      showToast(t.admin_page.comment_approved);
    } catch (err) {
      logError("AdminModule: Error approving comment", err);
      showToast(t.admin_page.comment_approve_error, 'error');
    }
  };

  const handleRejectComment = async (id: string) => {
    try {
      const { error } = await supabase.from('comments').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
      showToast(t.admin_page.comment_rejected);
    } catch (err) {
      logError("AdminModule: Error rejecting comment", err);
      showToast(t.admin_page.comment_reject_error, 'error');
    }
  };

  interface AdminOrder {
    id: string;
    created_at: string;
    status: string;
    customer_id: string;
    customer_email: string;
    total_amount?: number;
    total?: number;
  }

  const handleCompleteOrder = async (order: AdminOrder) => {
    try {
      // 1. Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id);
      
      if (orderError) throw orderError;

      // 2. Notify client
      const { error: notifyError } = await supabase
        .from('notifications')
        .insert([{
          user_id: order.customer_id,
          title: ap.notif_order_completed,
          message: ap.notif_order_completed_msg.replace('{id}', order.id.slice(0, 8)),
          type: 'success',
          read: false
        }]);

      if (notifyError) throw notifyError;

      addNotification({
        title: ap.notif_order_closed,
        message: ap.notif_order_closed_msg.replace('{id}', order.id.slice(0, 8)),
        type: 'info'
      });

      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    } catch (err) {
      logError("AdminModule: Error completing order", err);
      showToast(ap.order_complete_error, 'error');
    }
  };

  const getFilteredData = (data: Record<string, any>[], type: string) => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    
    switch (type) {
      case 'users':
        return data.filter(u => 
          (u.full_name?.toLowerCase().includes(query)) || 
          (u.email?.toLowerCase().includes(query)) ||
          (u.role?.toLowerCase().includes(query))
        );
      case 'orders':
        return data.filter(o => 
          (o.id.toLowerCase().includes(query)) || 
          (o.customer_email?.toLowerCase().includes(query)) ||
          (o.status?.toLowerCase().includes(query))
        );
      case 'trainings':
        return data.filter(t => 
          (t.title?.toLowerCase().includes(query)) || 
          (t.description?.toLowerCase().includes(query)) ||
          (t.level?.toLowerCase().includes(query)) ||
          (t.instructor?.toLowerCase().includes(query))
        );
      case 'products':
      case 'stock':
        return data.filter(p => 
          (p.name?.toLowerCase().includes(query)) || 
          (p.description?.toLowerCase().includes(query)) ||
          (p.category?.toLowerCase().includes(query))
        );
      case 'comments':
        return data.filter(c => 
          (c.content?.toLowerCase().includes(query)) || 
          (c.status?.toLowerCase().includes(query)) ||
          (c.resource_type?.toLowerCase().includes(query))
        );
      default:
        return data;
    }
  };

  React.useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  // Quand le chargement est terminé et qu'il n'y a pas d'utilisateur connecté,
  // on redirige vers /admin-login au lieu d'afficher un spinner indéfiniment.
  React.useEffect(() => {
    if (!authLoading && !adminUser) {
      window.location.replace('/admin-login');
    }
  }, [authLoading, adminUser]);

  if (authLoading || (!adminUser && !isAuthorized)) {
    // Show spinner while auth is resolving OR when there is no user yet
    // (INITIAL_SESSION race before initializeAuth completes).
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 pt-24">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-[#C1272D] animate-spin" />
          <p className="text-sm font-bold text-slate-500">{t.admin_page.auth_verifying}</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    // Redirection en cours — afficher un spinner discret
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" />
      </div>
    );
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle || !msgContent) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from('global_notifications').insert([
        {
          title: msgTitle,
          message: msgContent,
          type: category, // Using the dynamic category
        }
      ]);
      
      if (error) throw error;

      setSendSuccess(true);
      setMsgTitle('');
      setMsgContent('');
      setCategory('info');
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      logError("AdminModule: Error sending notification", error);
      showToast(t.admin_page.notify_error, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const ap = t.admin_page;
  const sidebarGroups: SidebarGroup[] = [
    {
      label: ap.sidebar_dashboard,
      items: [
        { id: 'overview' as AdminTab, label: ap.sidebar_overview, icon: BarChart3 },
      ],
    },
    {
      label: ap.sidebar_management,
      items: [
        { id: 'users' as AdminTab,      label: ap.sidebar_users,        icon: Users },
        { id: 'orders' as AdminTab,     label: ap.sidebar_orders,       icon: ShoppingBag },
        { id: 'formations' as AdminTab, label: ap.sidebar_trainings,    icon: GraduationCap },
        { id: 'produits' as AdminTab,   label: ap.sidebar_products,     icon: ShoppingBag },
        { id: 'stock' as AdminTab,      label: ap.sidebar_stock,        icon: Package },
        { id: 'promotions' as AdminTab, label: ap.sidebar_promotions,   icon: Tag },
        { id: 'services' as AdminTab,   label: ap.sidebar_services,     icon: Wrench },
        { id: 'annonces' as AdminTab,   label: ap.sidebar_banners,      icon: MegaphoneIcon },
      ],
    },
    {
      label: ap.sidebar_content,
      items: [
        { id: 'blog' as AdminTab,          label: ap.sidebar_blog,           icon: FileText },
        { id: 'commentaires' as AdminTab,  label: ap.sidebar_comments,       icon: MessageSquare },
        { id: 'devis' as AdminTab,         label: ap.sidebar_quotes,         icon: FileText },
        { id: 'temoignages' as AdminTab,   label: ap.sidebar_testimonials,   icon: Star },
        { id: 'realisations' as AdminTab,  label: ap.sidebar_achievements,   icon: Award },
        { id: 'partenaires' as AdminTab,   label: ap.sidebar_partners,       icon: Users },
        { id: 'actualites' as AdminTab,    label: ap.sidebar_news,           icon: Megaphone },
      ],
    },
    {
      label: ap.sidebar_communication,
      items: [
        { id: 'notifications' as AdminTab, label: ap.sidebar_notifications, icon: Megaphone },
      ],
    },
  ];

  // Contenu partagé de la sidebar (drawer mobile + panneau fixe desktop)
  const sidebarBody = (
    <div className="flex-1 overflow-y-auto p-3">
      {sidebarGroups.map((group, groupIdx) => (
        <div key={group.label} className={cn(groupIdx > 0 && "mt-3 pt-3 border-t border-slate-100 dark:border-slate-800")}>
          <p className="px-3 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {group.label}
          </p>
          {group.items.map((item, idx) => {
            const active = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-left mb-0.5",
                  active
                    ? "bg-red-50 text-[#C1272D] dark:bg-red-900/20 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <span className={cn(
                  "p-2 rounded-xl shrink-0 transition-all",
                  active
                    ? "bg-[#C1272D] text-white shadow-sm shadow-[#C1272D]/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}>
                  <item.icon className="w-4 h-4" />
                </span>
                <span className="truncate">{item.label}</span>
                {active && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-[#C1272D] shrink-0" />
                )}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );

  const sidebarFooter = (
    <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
          {adminProfile?.avatar_url ? (
            <Image src={adminProfile.avatar_url} alt={adminProfile?.full_name ?? 'Admin'} width={36} height={36} className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center bg-[#C1272D] text-white text-sm font-black">
              {adminProfile?.full_name?.charAt(0) ?? adminUser?.email?.[0].toUpperCase() ?? 'A'}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-900 dark:text-white truncate">{adminUser?.email?.split('@')[0]}</p>
          <p className="text-[10px] text-[#C1272D] font-bold">{t.admin_page.admin_label}</p>
        </div>
      </div>
      {/* Déconnexion */}
      <button
        onClick={() => setShowSignOutModal(true)}
        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
      >
        <LogOut className="w-4 h-4" />
        {t.admin_page.disconnect}
      </button>
    </div>
  );

  return (
    <>
    <AdminToast toast={toast} onDismiss={dismiss} />

    {/* Sidebar fixe — toujours visible sur desktop (lg+) */}
    <aside className="hidden lg:flex fixed top-16 left-0 bottom-0 z-40 w-72 bg-white dark:bg-slate-900 shadow-2xl flex-col border-r border-slate-100 dark:border-slate-800">
      {sidebarBody}
      {sidebarFooter}
    </aside>

    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 lg:pl-72 transition-colors">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">

        {/* Admin Header — titre personnalisé selon l'onglet */}
        <div className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#C1272D] mb-1">{t.admin_page.dashboard}</p>
          {(() => {
            const meta = ap.page_meta[activeTab];
            const words = (meta?.title ?? ap.header_title).split(' ');
            const first = words[0] ?? '';
            const rest = words.slice(1).join(' ');
            return (
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                {first}{rest ? <> <span className="text-[#C1272D]">{rest}</span></> : null}
              </h1>
            );
          })()}
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{ap.page_meta[activeTab]?.subtitle ?? ap.header_subtitle}</p>
        </div>

        {/* Nav bar mobile : hamburger + libellé de l'onglet actif */}
        <div className="flex items-center gap-3 mb-6 lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300"
          >
            <Menu className="w-4 h-4" />
            {t.admin_page.header_nav}
          </button>
          {(() => {
            const current = sidebarGroups.flatMap(g => g.items).find(i => i.id === activeTab);
            if (!current) return null;
            return (
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{current.label}</span>
            );
          })()}
        </div>

        {/* Sidebar Drawer */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                key="admin-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
              <motion.div
                key="admin-drawer"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col lg:hidden"
              >
                {/* Drawer header — fermer */}
                <div className="px-4 py-3 flex items-center justify-end shrink-0 border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {sidebarBody}
                {sidebarFooter}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Full-width Tab Content */}
        <div>
            {activeTab === 'overview' && <OverviewTab onNavigate={(tab) => setActiveTab(tab as AdminTab)} />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'notifications' && <NotificationsTab onDelete={(id, table) => setDeleteConfirmation({ id, table })} notifications={allNotifications as { id: string; title: string; message: string; type: string; created_at: string }[]} />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'formations' && <TrainingsTab />}
            {activeTab === 'blog' && <BlogTab />}
            {activeTab === 'promotions' && <PromoTab />}
            {activeTab === 'produits' && <ProductsTab />}
            {activeTab === 'services' && <ServicesTab />}
            {activeTab === 'annonces' && <AnnouncementsTab />}
            {activeTab === 'stock' && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#C1272D]/10 to-[#C1272D]/5 rounded-3xl flex items-center justify-center mx-auto">
                    <Package className="w-12 h-12 text-[#C1272D]" />
                  </div>
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full">{t.admin_page.coming_soon_badge_new}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">{t.admin_page.coming_soon_title}</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  {t.admin_page.coming_soon_text}
                </p>
                <div className="mt-8 flex items-center gap-2 text-xs text-[#C1272D] font-bold bg-[#C1272D]/5 px-6 py-3 rounded-full">
                  <span className="w-2 h-2 bg-[#C1272D] rounded-full animate-pulse" />
                  {t.admin_page.coming_soon_badge}
                </div>
              </div>
            )}
            {activeTab === 'devis' && <QuotesTab />}
            {activeTab === 'temoignages' && <ContentTab type="testimonials" />}
            {activeTab === 'realisations' && <ContentTab type="achievements" />}
            {activeTab === 'partenaires' && <ContentTab type="partners" />}
            {activeTab === 'actualites' && <ContentTab type="news" />}
        </div>
      </div>

      {/* Admin Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {(editingItem ? ap.modal_title_edit : ap.modal_title_add)} {formType === 'product' ? ap.modal_product_label : ap.modal_training_label}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    {formType === 'product' ? ap.product_name : ap.training_title}
                  </label>
                  <input 
                    name={formType === 'product' ? 'name' : 'title'}
                    defaultValue={editingItem ? (formType === 'product' ? editingItem.name : editingItem.title) : ''}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ap.modal_field_category}</label>
                  <input 
                    name="category"
                    defaultValue={editingItem?.category || ''}
                    placeholder={formType === 'product' ? ap.modal_category_placeholder_product : ap.modal_category_placeholder_training}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ap.modal_field_price}</label>
                    <input 
                      type="number"
                      name="price"
                      min="0"
                      step="1"
                      defaultValue={editingItem?.price || ''}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      {formType === 'product' ? ap.modal_field_stock : ap.modal_field_level}
                    </label>
                    <input 
                      type={formType === 'product' ? 'number' : 'text'}
                      name={formType === 'product' ? 'stock' : 'level'}
                      min={formType === 'product' ? "0" : undefined}
                      defaultValue={editingItem ? (formType === 'product' ? editingItem.stock : editingItem.level) : ''}
                      placeholder={formType === 'training' ? ap.modal_level_placeholder : ""}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                    />
                  </div>
                </div>
                {formType === 'training' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ap.modal_field_instructor}</label>
                      <input 
                        name="instructor"
                        defaultValue={editingItem?.instructor || ''}
                        placeholder={ap.modal_instructor_placeholder}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ap.modal_field_duration}</label>
                      <input 
                        name="duration"
                        defaultValue={editingItem?.duration || ''}
                        placeholder={ap.modal_duration_placeholder}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                      />
                    </div>
                  </div>
                )}
                <div>                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ap.modal_field_description}</label>
                  <textarea 
                    name="description"
                    defaultValue={editingItem?.description || ''}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D] resize-none"
                  />
                </div>
                <div>                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ap.modal_field_image_url}</label>
                  <input 
                    name="image"
                    defaultValue={editingItem?.image || ''}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                  />
                </div>
                <button type="submit" className="w-full bg-[#C1272D] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 mt-4">
                  {ap.modal_confirm}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-[#C1272D]" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{ap.confirm_delete_title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                {ap.confirm_delete_message}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  {t.admin_page.confirm_delete_cancel}
                </button>
                <button 
                  onClick={handleDelete}
                  className="py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-[#C1272D] text-white shadow-lg shadow-blue-500/20"
                >
                  {t.admin_page.confirm_delete_confirm}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

export default AdminModule;