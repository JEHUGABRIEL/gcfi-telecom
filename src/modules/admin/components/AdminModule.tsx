import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShoppingBag, 
  GraduationCap, 
  Megaphone,
  FileText,
  Star,
  Award, 
  TrendingUp, 
  ChevronRight, 
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
  MessageSquare,
  Lock,
  Package,
  Minus,
  RefreshCw,
  ChevronLeft,
  Menu,
  BookOpen,
  Tag
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

const VALID_TABS = ['overview','notifications','orders','users','formations','produits','stock','commentaires','devis','temoignages','realisations','partenaires','actualites','blog','promotions'] as const;
type AdminTab = typeof VALID_TABS[number];

const AdminModule = () => {
  const { addNotification } = useNotifications();
  const { user: adminUser, isAdmin: isAuthorized, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<AdminTab>(() => {
    const param = searchParams.get('tab') as AdminTab;
    return VALID_TABS.includes(param) ? param : 'overview';
  });
  const [msgTitle, setMsgTitle] = React.useState('');
  const [msgContent, setMsgContent] = React.useState('');
  const [category, setCategory] = React.useState('info');
  const [isSending, setIsSending] = React.useState(false);
  const [sendSuccess, setSendSuccess] = React.useState(false);
  
  const [users, setUsers] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [trainings, setTrainings] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [comments, setComments] = React.useState<any[]>([]);
  const [allNotifications, setAllNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any>(null);
  const [formType, setFormType] = React.useState<'product' | 'training' | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = React.useState('');

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{ id: string, table: string } | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      // Fetch all needed data for stats regardless of activeTab
      const [
        { data: profilesData },
        { data: ordersData },
        { data: trainingsData },
        { data: productsData },
        { data: commentsData },
        { data: globalNotifsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('trainings').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at', { ascending: false }),
        supabase.from('global_notifications').select('*').order('created_at', { ascending: false })
      ]);

      setUsers(profilesData || []);
      setOrders(ordersData || []);
      setTrainings(trainingsData || []);
      setProducts(productsData || []);
      setComments(commentsData || []);
      setAllNotifications(globalNotifsData || []);
    } catch (error) {
      logError("AdminModule: Error fetching data", error)
    } finally {
      setLoading(false);
    }
  }, [isAuthorized]);

  React.useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [activeTab, isAuthorized, fetchData]);

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
            title: "Nouvelle Commande !",
            message: `Commande #${newOrder.id.slice(0, 8)} reçue de ${newOrder.customer_email || 'un client'}.`,
            type: 'info'
          });

          // Refresh data
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [isAuthorized, addNotification, fetchData]);

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
      fetchData();
    } catch (err) {
      logError("AdminModule: Error saving item", err)
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    const { id, table } = deleteConfirmation;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      setDeleteConfirmation(null);
      fetchData();
    } catch (err) {
      logError("AdminModule: Error deleting item", err)
    }
  };

  const handleApproveComment = async (id: string) => {
    try {
      const { error } = await supabase.from('comments').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      logError("AdminModule: Error approving comment", err)
    }
  };

  const handleRejectComment = async (id: string) => {
    try {
      const { error } = await supabase.from('comments').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      logError("AdminModule: Error rejecting comment", err)
    }
  };

  const handleCompleteOrder = async (order: any) => {
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
          title: "Commande Terminée ✅",
          message: `Votre commande #${order.id.slice(0, 8)} a été traitée avec succès ! Merci de votre confiance.`,
          type: 'success',
          read: false
        }]);

      if (notifyError) throw notifyError;

      addNotification({
        title: "Commande Clôturée",
        message: `La commande #${order.id.slice(0, 8)} a été marquée comme terminée.`,
        type: 'info'
      });

      fetchData();
    } catch (err) {
      logError("AdminModule: Error completing order", err)
    }
  };

  const getFilteredData = (data: any[], type: string) => {
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

  const navItems = [
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
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 pt-24">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-[#C1272D] animate-spin" />
          <p className="text-sm font-bold text-slate-500">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 pt-20">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-[#C1272D]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 transition-colors">Accès Refusé</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 transition-colors">Vous n'avez pas les privilèges nécessaires pour accéder au panel d'administration GCFI.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-[#C1272D] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" />
      </div>
    );
  }

  const calculateStats = () => {
    const totalUsers = users.length;
    const totalOrders = orders.length;
    const activeTrainings = trainings.length;
    
    // Revenue from completed orders this month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return o.status === 'completed' && 
               orderDate.getMonth() === currentMonth && 
               orderDate.getFullYear() === currentYear;
      })
      .reduce((sum, o) => sum + (Number(o.total_amount) || Number(o.total) || 0), 0);

    return [
      { label: 'Utilisateurs', value: totalUsers.toLocaleString(), icon: Users, color: 'blue', change: '+12%' },
      { label: 'Commandes', value: totalOrders.toLocaleString(), icon: ShoppingBag, color: 'emerald', change: '+8%' },
      { label: 'Cours Actifs', value: activeTrainings.toLocaleString(), icon: GraduationCap, color: 'red', change: '0%' },
      { label: 'Revenu Mensuel', value: `${(monthlyRevenue / 1000).toFixed(1)}k F`, icon: TrendingUp, color: 'amber', change: '+15%' },
    ];
  };

  const dynamicStats = calculateStats();

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle || !msgContent) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from('global_notifications').insert([
        {
          title: msgTitle,
          message: msgContent,
          type: category,
        }
      ]);
      
      if (error) throw error;

      setSendSuccess(true);
      setMsgTitle('');
      setMsgContent('');
      setCategory('info');
      fetchData();
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      logError("AdminModule: Error sending notification", error)
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Panel <span className="text-[#C1272D]">Administration</span></h1>
            <p className="text-slate-600 dark:text-slate-400">Gérez le contenu, les utilisateurs et les opérations de GCFI.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-slate-200 dark:border-slate-700">
              <BarChart3 className="w-4 h-4" /> Rapport mensuel
            </button>
            <div className="w-10 h-10 rounded-full bg-[#C1272D] flex items-center justify-center text-white font-black">
              {adminUser?.email?.[0].toUpperCase() || 'A'}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {dynamicStats.map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  stat.color === 'blue' && "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
                  stat.color === 'emerald' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20",
                  stat.color === 'red' && "bg-red-50 text-red-600 dark:bg-red-900/20",
                  stat.color === 'amber' && "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                )}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase text-emerald-500">{stat.change}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-slate-800 shadow-2xl flex flex-col p-4 gap-2 overflow-y-auto z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Menu</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              {navItems.map(({ tab, icon: Icon, label }) => (
                <button key={tab} onClick={() => { setActiveTab(tab as any); setMobileSidebarOpen(false); }}
                  className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all w-full",
                    activeTab === tab ? "bg-red-50 text-[#C1272D] dark:bg-red-900/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50")}>
                  <Icon className="w-4 h-4 shrink-0" /><span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bouton hamburger mobile */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300 capitalize">{navItems.find(n => n.tab === activeTab)?.label || 'Menu'}</span>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-6">
          {/* Sidebar desktop */}
          <div className={cn("hidden lg:flex flex-col shrink-0 transition-all duration-300", sidebarOpen ? "w-56" : "w-16")}>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-1 sticky top-24">
              {/* Toggle button */}
              <button onClick={() => setSidebarOpen(v => !v)}
                className="flex items-center justify-center w-full p-2 mb-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-[#C1272D]">
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {navItems.map(({ tab, icon: Icon, label }) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)}
                  title={!sidebarOpen ? label : undefined}
                  className={cn("flex items-center gap-3 py-3 rounded-2xl text-sm font-bold transition-all",
                    sidebarOpen ? "px-4" : "px-0 justify-center",
                    activeTab === tab ? "bg-red-50 text-[#C1272D] dark:bg-red-900/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50")}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span className="truncate">{label}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            {/* Tab Content */}
            {activeTab === 'overview' && <OverviewTab onNavigate={(tab) => setActiveTab(tab as any)} />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'notifications' && <NotificationsTab onDelete={(id, table) => setDeleteConfirmation({ id, table })} />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'formations' && <TrainingsTab />}
            {activeTab === 'blog' && <BlogTab />}
            {activeTab === 'promotions' && <PromoTab />}
            {activeTab === 'produits' && <ProductsTab />}
            {activeTab === 'stock' && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#C1272D]/10 to-[#C1272D]/5 rounded-3xl flex items-center justify-center mx-auto">
                    <Package className="w-12 h-12 text-[#C1272D]" />
                  </div>
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full">Bientôt</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Coming Soon...</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  Le module de gestion de stock est en cours de développement. Il sera disponible très prochainement.
                </p>
                <div className="mt-8 flex items-center gap-2 text-xs text-[#C1272D] font-bold bg-[#C1272D]/5 px-6 py-3 rounded-full">
                  <span className="w-2 h-2 bg-[#C1272D] rounded-full animate-pulse" />
                  En développement actif
                </div>
              </div>
            )}
            {activeTab === 'commentaires' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Commentaires</h2>
                <p>Module de gestion des commentaires en cours de développement</p>
              </div>
            )}
            {activeTab === 'devis' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                <QuotesTab />
              </div>
            )}
            {activeTab === 'temoignages' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                <ContentTab type="testimonials" />
              </div>
            )}
            {activeTab === 'realisations' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                <ContentTab type="achievements" />
              </div>
            )}
            {activeTab === 'partenaires' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                <ContentTab type="partners" />
              </div>
            )}
            {activeTab === 'actualites' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                <ContentTab type="news" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                  {editingItem ? 'Modifier' : 'Ajouter'} {formType === 'product' ? 'un Produit' : 'une Formation'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    {formType === 'product' ? 'Nom du produit' : 'Titre de la formation'}
                  </label>
                  <input 
                    name={formType === 'product' ? 'name' : 'title'}
                    defaultValue={editingItem ? (formType === 'product' ? editingItem.name : editingItem.title) : ''}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Catégorie</label>
                  <input 
                    name="category"
                    defaultValue={editingItem?.category || ''}
                    placeholder={formType === 'product' ? "Mobile, Réseau..." : "IT, Télécom..."}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Prix (FCFA)</label>
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
                      {formType === 'product' ? 'Stock' : 'Niveau'}
                    </label>
                    <input 
                      type={formType === 'product' ? 'number' : 'text'}
                      name={formType === 'product' ? 'stock' : 'level'}
                      min={formType === 'product' ? "0" : undefined}
                      defaultValue={editingItem ? (formType === 'product' ? editingItem.stock : editingItem.level) : ''}
                      placeholder={formType === 'training' ? "Ex: Débutant" : ""}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                    />
                  </div>
                </div>
                {formType === 'training' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Instructeur</label>
                      <input 
                        name="instructor"
                        defaultValue={editingItem?.instructor || ''}
                        placeholder="Nom"
                        className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Durée</label>
                      <input 
                        name="duration"
                        defaultValue={editingItem?.duration || ''}
                        placeholder="Ex: 3 mois"
                        className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</label>
                  <textarea 
                    name="description"
                    defaultValue={editingItem?.description || ''}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">URL Image</label>
                  <input 
                    name="image"
                    defaultValue={editingItem?.image || ''}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D]"
                  />
                </div>
                <button type="submit" className="w-full bg-[#C1272D] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 mt-4">
                  Confirmer
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Confirmation</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleDelete}
                  className="py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-[#C1272D] text-white shadow-lg shadow-blue-500/20"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminModule;