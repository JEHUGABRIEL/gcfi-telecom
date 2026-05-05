import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { 
  BarChart3, Users, Zap, ClipboardList, TrendingUp, DollarSign, 
  Download, RefreshCcw, AlertCircle, LogOut, Loader2, Search, Bell, X, Mail,
  Layout, MessageSquare, ImageIcon, Edit3, Trash2, Plus, ArrowRight, User as UserIcon, Settings, Shield,
  CheckCircle2
} from 'lucide-react';
import { 
  fetchDashboardData, exportToCSV, DashboardData, 
  fetchPosts, createPost, updatePost, deletePost,
  createProject, updateProject, deleteProject,
  fetchComments, deleteComment
} from '../services/adminService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const COLORS = ['#FFD700', '#1A2E35', '#FF4D00'];

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePieIndex, setActivePieIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'content' | 'profile'>('stats');
  
  // Post Management State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [postForm, setPostForm] = useState({
    title: '',
    excerpt: '',
    category: 'Actualités',
    author: 'Admin SOL!',
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=60&w=800'
  });
  const [isPostSubmitting, setIsPostSubmitting] = useState(false);

  // Project Management State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    category: 'residential',
    roi: '',
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1200',
    images: [] as string[]
  });
  const [isProjectSubmitting, setIsProjectSubmitting] = useState(false);
  const [newProjectImage, setNewProjectImage] = useState('');

  const navigate = useNavigate();
  const { isAdmin, logout } = useAuth();
  const { showToast } = useToast();

  const filteredProjects = data?.recentProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.client.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const loadLeads = () => {
    const leads = JSON.parse(localStorage.getItem('admin_leads') || '[]');
    setNotifications(leads);
  };

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    setError(null);
    try {
      const [dashboardResponse, postsResponse, commentsResponse] = await Promise.all([
        fetchDashboardData(),
        fetchPosts(),
        fetchComments()
      ]);
      setData(dashboardResponse);
      setPosts(postsResponse);
      setComments(commentsResponse);
      loadLeads();
      if (refresh) showToast("Données synchronisées", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    loadData();

    // Request notification permission for admin
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleNewLead = (e: any) => {
      const lead = e.detail;
      setNotifications(prev => [lead, ...prev]);
      showToast("Nouvelle demande de devis !", "success");
      // Simulate haptic if possible
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    };

    window.addEventListener('new-lead', handleNewLead);
    return () => window.removeEventListener('new-lead', handleNewLead);
  }, [isAdmin, navigate]);

  const clearNotifications = () => {
    localStorage.setItem('admin_leads', '[]');
    setNotifications([]);
    setShowNotifications(false);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPostSubmitting(true);
    try {
      if (editingPost) {
        await updatePost(editingPost.id, postForm);
        showToast("Article mis à jour !", "success");
      } else {
        await createPost(postForm);
        showToast("Article publié !", "success");
      }
      setIsPostModalOpen(false);
      setEditingPost(null);
      setPostForm({
        title: '',
        excerpt: '',
        category: 'Actualités',
        author: 'Admin SOL!',
        image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=60&w=800'
      });
      loadData(true);
    } catch (err) {
      showToast("Erreur lors de l'enregistrement", "error");
    } finally {
      setIsPostSubmitting(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm("Supprimer cet article ?")) return;
    try {
      await deletePost(id);
      showToast("Article supprimé", "success");
      loadData(true);
    } catch (err) {
      showToast("Erreur de suppression", "error");
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      author: post.author,
      image: post.image
    });
    setIsPostModalOpen(true);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProjectSubmitting(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectForm);
        showToast("Projet mis à jour !", "success");
      } else {
        await createProject(projectForm);
        showToast("Projet ajouté au portfolio !", "success");
      }
      setIsProjectModalOpen(false);
      setEditingProject(null);
      setProjectForm({
        title: '',
        description: '',
        category: 'residential',
        roi: '',
        image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1200',
        images: []
      });
      loadData(true);
    } catch (err) {
      showToast("Erreur lors de l'enregistrement", "error");
    } finally {
      setIsProjectSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Supprimer ce projet du portfolio ?")) return;
    try {
      await deleteProject(id);
      showToast("Projet supprimé", "success");
      loadData(true);
    } catch (err) {
      showToast("Erreur de suppression", "error");
    }
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      category: project.category,
      roi: project.roi,
      image: project.image,
      images: project.images || []
    });
    setIsProjectModalOpen(true);
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    try {
      await deleteComment(id);
      showToast("Commentaire supprimé", "success");
      loadData(true);
    } catch (err) {
      showToast("Erreur de suppression", "error");
    }
  };

  const onPieEnter = (_: any, index: number) => {
    setActivePieIndex(index);
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-brand-secondary p-4 rounded-xl shadow-xl border border-white/10 text-white">
          <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1">{label}</p>
          <p className="text-lg font-black">{payload[0].value} Projets</p>
        </div>
      );
    }
    return null;
  };

  const handleExport = () => {
    if (!data) return;
    const exportData = [
      { Metric: "Projets Totaux", Value: data.totalProjects },
      { Metric: "Économies Moyennes", Value: data.avgSavings },
      { Metric: "Demandes de Devis (30j)", Value: data.quoteRequests },
      { Metric: "Satisfaction Client", Value: data.satisfaction }
    ];
    exportToCSV(exportData, 'sol_stats_summary');
    showToast("Résumé exporté avec succès !", "success");
  };

  const handleExportHistory = () => {
    if (!data) return;
    exportToCSV(data.growth, 'sol_growth_history');
    showToast("Historique de croissance exporté !", "success");
  };

  const handleExportLogins = () => {
    if (!data) return;
    exportToCSV(data.loginAttempts, 'sol_login_attempts');
    showToast("Journal des connexions exporté !", "success");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-neutral">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
        <p className="text-brand-secondary font-bold text-center">
          <span className="block text-2xl font-black mb-2">SOL! Admin</span>
          Chargement du tableau de bord...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-brand-neutral">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full border border-red-100">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-brand-secondary mb-4">Erreur de chargement</h2>
          <p className="text-gray-500 mb-8">{error}</p>
          <div className="flex gap-4">
            <button 
              onClick={() => loadData()}
              className="flex-1 bg-brand-primary text-brand-secondary font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
              <RefreshCcw className="h-5 w-5" /> Réessayer
            </button>
            <button 
              onClick={() => navigate('/admin/login')}
              className="px-6 bg-gray-100 text-gray-500 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Projets Totaux", value: data.totalProjects, icon: Zap, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Économies Moy./Client", value: data.avgSavings, icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { label: "Demandes de Devis (30j)", value: data.quoteRequests, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Satisfaction Client", value: data.satisfaction, icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="pt-32 pb-24 min-h-screen bg-[#F8F9FA] px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Portail Expert SOL!
              </span>
              {isRefreshing && (
                <div className="flex items-center gap-2 text-brand-primary text-[10px] font-bold animate-pulse">
                  <RefreshCcw className="h-3 w-3 animate-spin" /> SYNCHRONISATION...
                </div>
              )}
            </div>
            <h1 className="text-4xl font-black text-brand-secondary flex items-center gap-3">
              <BarChart3 className="h-10 w-10 text-brand-primary" /> 
              {activeTab === 'stats' ? 'Dashboard' : activeTab === 'content' ? 'Gestion Contenu' : 'Mon Profil'}
            </h1>
            <p className="text-gray-500 mt-1">
              {activeTab === 'stats' ? 'Données consolidées de SOL! République Centrafricaine' : 
               activeTab === 'content' ? 'Mettre à jour les actualités, images et commentaires' : 
               'Gérer vos accès et paramètres personnels'}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Tabs */}
            <div className="bg-white border border-gray-200 p-1 rounded-2xl flex gap-1 shadow-sm mr-4">
              <button 
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-brand-secondary'}`}
              >
                Statistiques
              </button>
              <button 
                onClick={() => setActiveTab('content')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-brand-secondary'}`}
              >
                Contenu
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-brand-secondary'}`}
              >
                Profil
              </button>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="bg-white border border-gray-200 p-3 rounded-xl text-brand-secondary hover:border-brand-primary transition-all relative group"
              >
                <Bell className={`h-5 w-5 ${notifications.some(n => n.isNew) ? 'animate-bounce text-brand-primary' : ''}`} />
                {notifications.filter(n => n.isNew).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-primary text-brand-secondary text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {notifications.filter(n => n.isNew).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[100] overflow-hidden"
                  >
                    <div className="p-6 bg-brand-neutral/50 border-b border-gray-100 flex justify-between items-center">
                      <h4 className="font-black text-brand-secondary uppercase tracking-widest text-xs">Derniers Leads</h4>
                      <button 
                        onClick={clearNotifications}
                        className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest"
                      >
                        Tout effacer
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-12 text-center">
                          <Mail className="h-8 w-8 text-gray-200 mx-auto mb-4" />
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aucune notification</p>
                        </div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-brand-neutral/20 transition-colors ${n.isNew ? 'bg-brand-primary/5' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-bold text-brand-secondary text-sm">{n.name}</p>
                              <span className="text-[8px] font-black uppercase text-gray-400">{new Date(n.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mb-2 truncate">{n.message}</p>
                            <span className="bg-brand-primary/10 text-brand-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                              {n.type === 'residential' ? 'Maison' : 'Pro'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="bg-white border border-gray-200 text-brand-secondary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:border-brand-primary transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Rafraîchir les données"
            >
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button 
              onClick={handleExport}
              className="bg-white border border-gray-200 text-brand-secondary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:border-brand-primary transition-all shadow-sm"
            >
              <Download className="h-4 w-4" /> Export Résumé
            </button>
            <button 
              onClick={logout}
              className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 transition-all shadow-sm"
            >
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>

        {activeTab === 'stats' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-black text-brand-secondary mt-1 tracking-tight">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Growth Chart */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col min-h-[520px]"
              >
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="font-black text-xl text-brand-secondary">Croissance Mensuelle</h3>
                    <p className="text-sm text-gray-400">Installations par mois (Bangui & Provinces)</p>
                  </div>
                  <button 
                    onClick={handleExportHistory}
                    className="p-3 bg-brand-neutral text-gray-400 hover:text-brand-primary rounded-xl transition-all"
                    title="Exporter l'historique"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.growth}>
                      <defs>
                        <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFD700" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 700}}
                        dy={15}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 700}}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="projects" 
                        stroke="#FFD700" 
                        strokeWidth={5} 
                        fillOpacity={1} 
                        fill="url(#colorProjects)" 
                        animationBegin={500}
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Distribution Chart */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col min-h-[520px]"
              >
                <h3 className="font-black text-xl text-brand-secondary mb-2">Répartition Secteurs</h3>
                <p className="text-sm text-gray-400 mb-8">Par segment de clientèle</p>
                
                <div className="flex-1 w-full flex flex-col justify-center items-center">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.distribution}
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={8}
                          dataKey="value"
                          onMouseEnter={onPieEnter}
                          onMouseLeave={() => setActivePieIndex(-1)}
                          labelLine={false}
                          label={renderCustomizedLabel}
                          animationBegin={800}
                          animationDuration={1200}
                        >
                          {data.distribution.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              cornerRadius={14}
                              strokeWidth={index === activePieIndex ? 4 : 0}
                              stroke="#fff"
                              className="outline-none"
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 700 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="w-full space-y-4 mt-10">
                    {data.distribution.map((item, i) => (
                      <div 
                        key={i} 
                        className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${activePieIndex === i ? 'bg-brand-neutral' : ''}`}
                        onMouseEnter={() => setActivePieIndex(i)}
                        onMouseLeave={() => setActivePieIndex(-1)}
                      >
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-500 uppercase tracking-widest">
                          <div className={`w-3 h-3 rounded-full ${COLORS[i % COLORS.length]}`} />
                          {item.label}
                        </div>
                        <span className="font-black text-brand-secondary">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Projects Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="font-black text-xl text-brand-secondary">Projets Récents</h3>
                  <p className="text-sm text-gray-400">Dernières installations et suivis</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Rechercher un projet ou client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-neutral pl-12 pr-6 py-3 rounded-xl border border-transparent focus:border-brand-primary outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-brand-neutral/30">
                      <th className="px-10 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Projet</th>
                      <th className="px-10 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Client</th>
                      <th className="px-10 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-10 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-brand-neutral/20 transition-colors">
                        <td className="px-10 py-6">
                          <p className="font-bold text-brand-secondary">{project.name}</p>
                          <p className="text-[10px] text-gray-400">ID: {project.id}</p>
                        </td>
                        <td className="px-10 py-6 text-sm text-gray-600 font-medium">{project.client}</td>
                        <td className="px-10 py-6 text-sm text-gray-500">{project.date}</td>
                        <td className="px-10 py-6 text-right">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                            project.status === 'Terminé' ? 'bg-green-100 text-green-600' :
                            project.status === 'En cours' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Security Attempts */}
            <div className="mt-12 flex flex-col md:flex-row gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="font-black text-xl text-brand-secondary">Sécurité</h3>
                    <p className="text-sm text-gray-400">Dernières tentatives de connexion</p>
                  </div>
                  <button 
                    onClick={handleExportLogins}
                    className="flex items-center gap-2 text-xs font-bold text-brand-primary hover:underline"
                  >
                    <Download className="h-4 w-4" /> Export CSV
                  </button>
                </div>
                <div className="space-y-4">
                  {data.loginAttempts.map((attempt, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-brand-neutral rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-brand-secondary">{attempt.email}</p>
                        <p className="text-[10px] text-gray-400">{attempt.timestamp} • IP: {attempt.ip}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        attempt.status === 'Succès' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {attempt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}

        {activeTab === 'content' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Actualités & Blog", icon: Layout, count: "12 Articles", action: "Gérer les posts" },
                { title: "Galerie & Images", icon: ImageIcon, count: "48 Fichiers", action: "Portfolio" },
                { title: "Commentaires", icon: MessageSquare, count: "24 Actifs", action: "Modération" }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className="w-16 h-16 bg-brand-neutral rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                    <item.icon className="h-8 w-8 text-brand-secondary group-hover:text-brand-primary transition-colors" />
                  </div>
                  <h3 className="font-black text-xl text-brand-secondary mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 mb-6">{item.count}</p>
                  <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-primary group-hover:gap-3 transition-all">
                    {item.action} <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-brand-neutral/30">
                <h3 className="font-black text-xl text-brand-secondary">Gestion des Articles</h3>
                <button 
                  onClick={() => {
                    setEditingPost(null);
                    setPostForm({
                      title: '',
                      excerpt: '',
                      category: 'Actualités',
                      author: 'Admin SOL!',
                      image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=60&w=800'
                    });
                    setIsPostModalOpen(true);
                  }}
                  className="bg-brand-primary text-brand-secondary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4" /> Nouvel Article
                </button>
              </div>
              <div className="p-10 space-y-6">
                {posts.map((post, i) => (
                  <div key={post.id} className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-brand-neutral/20 rounded-3xl border border-transparent hover:border-brand-primary/20 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <img src={post.image} alt="thumb" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-secondary">{post.title}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                          {post.category} • Publié le {post.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditPost(post)}
                        className="p-3 bg-white text-gray-400 hover:text-brand-primary rounded-xl transition-all shadow-sm"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Management Section */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-brand-neutral/30">
                <h3 className="font-black text-xl text-brand-secondary">Gestion du Portfolio</h3>
                <button 
                  onClick={() => {
                    setEditingProject(null);
                    setProjectForm({
                      title: '',
                      description: '',
                      category: 'residential',
                      roi: '',
                      image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1200',
                      images: []
                    });
                    setIsProjectModalOpen(true);
                  }}
                  className="bg-brand-primary text-brand-secondary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4" /> Nouveau Projet
                </button>
              </div>
              <div className="p-10 space-y-6">
                {data.recentProjects.map((project, i) => ( // Using recentProjects as list for now
                  <div key={project.id} className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-brand-neutral/20 rounded-3xl border border-transparent hover:border-brand-primary/20 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden">
                        <Zap className="h-6 w-6 text-brand-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-secondary">{project.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                           Client: {project.client} • {project.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditProject(project)}
                        className="p-3 bg-white text-gray-400 hover:text-brand-primary rounded-xl transition-all shadow-sm"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Management Section */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-brand-neutral/30">
                <h3 className="font-black text-xl text-brand-secondary">Gestion des Commentaires</h3>
              </div>
              <div className="p-10 space-y-6">
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 font-bold uppercase tracking-widest text-xs">
                    Aucun commentaire pour le moment
                  </div>
                ) : (
                  comments.map((comment, i) => (
                    <div key={comment.id} className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-brand-neutral/20 rounded-3xl border border-transparent hover:border-brand-primary/20 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100 uppercase font-black text-brand-secondary text-xs">
                          {comment.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-brand-secondary">{comment.name}</p>
                          <p className="text-xs text-brand-primary font-medium">{posts.find(p => p.id === comment.postId)?.title || 'Article inconnu'}</p>
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2 italic">"{comment.message}"</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm"
            >
              <div className="bg-brand-secondary p-12 text-white relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center p-2 shadow-2xl relative group">
                    <img 
                      src={`https://ui-avatars.com/api/?name=Admin+SOL!&background=E67E22&color=fff`} 
                      alt="Admin" 
                      className="w-full h-full object-cover rounded-full"
                    />
                    <label className="absolute inset-0 bg-brand-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full cursor-pointer">
                      <ImageIcon className="h-6 w-6 text-white" />
                      <input type="file" className="hidden" />
                    </label>
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-3xl font-black mb-2 tracking-tighter">Administrateur SOL!</h3>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-white/60 font-bold uppercase tracking-[0.1em] text-[10px]">
                      <Shield className="h-3 w-3 text-brand-primary" /> Session active • Bangui HQ
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-12 space-y-12">
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="font-black text-brand-secondary uppercase tracking-widest text-xs flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-brand-primary" /> Paramètres Compte
                    </h4>
                    <div className="space-y-4">
                      {[
                        { label: "Nom d'affichage", value: "Expert SOL!" },
                        { label: "Email de notification", value: "jehubin@gmail.com" },
                        { label: "Rôle", value: "Administrateur Système" }
                      ].map((field, idx) => (
                        <div key={idx} className="bg-brand-neutral p-4 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</p>
                            <p className="font-bold text-brand-secondary">{field.value}</p>
                          </div>
                          <button className="text-brand-primary font-black text-[10px] uppercase hover:underline">Editer</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="font-black text-brand-secondary uppercase tracking-widest text-xs flex items-center gap-2">
                      <Settings className="h-4 w-4 text-brand-primary" /> Préférences Admin
                    </h4>
                    <div className="space-y-4">
                      {[
                        "Recevoir alertes de nouveaux leads",
                        "Rapport hebdomadaire PDF",
                        "Mode sombre automatique"
                      ].map((pref, i) => (
                        <label key={i} className="flex items-center justify-between p-4 bg-brand-neutral rounded-2xl cursor-pointer hover:bg-brand-neutral/60 transition-colors">
                          <span className="text-sm font-bold text-brand-secondary">{pref}</span>
                          <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg border-gray-300 text-brand-primary focus:ring-brand-primary" />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-12 border-t border-gray-100 flex flex-wrap gap-4">
                  <button className="bg-brand-secondary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl">
                    Sauvegarder les modifications
                  </button>
                  <button className="bg-gray-100 text-gray-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">
                    Changer Mot de Passe
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Post Modal */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPostModalOpen(false)}
              className="absolute inset-0 bg-brand-secondary/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setIsPostModalOpen(false)} 
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-brand-secondary"
              >
                <X className="h-6 w-6" />
              </button>
              
              <h3 className="text-3xl font-black text-brand-secondary mb-8 tracking-tighter">
                {editingPost ? 'Modifier l\'article' : 'Publier un article'}
              </h3>

              <form onSubmit={handlePostSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Titre de l'article</label>
                  <input 
                    type="text" required
                    value={postForm.title}
                    onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                    placeholder="Ex: Nouveaux panneaux solaires à Bangui"
                    className="w-full bg-brand-neutral border border-gray-100 px-6 py-4 rounded-2xl focus:border-brand-primary outline-none transition-all"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Catégorie</label>
                    <select 
                      value={postForm.category}
                      onChange={(e) => setPostForm({...postForm, category: e.target.value})}
                      className="w-full bg-brand-neutral border border-gray-100 px-6 py-4 rounded-2xl focus:border-brand-primary outline-none transition-all"
                    >
                      <option>Actualités</option>
                      <option>Guides</option>
                      <option>Entretien</option>
                      <option>Projets</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Auteur</label>
                    <input 
                      type="text" required
                      value={postForm.author}
                      onChange={(e) => setPostForm({...postForm, author: e.target.value})}
                      className="w-full bg-brand-neutral border border-gray-100 px-6 py-4 rounded-2xl focus:border-brand-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Résumé / Excerpt</label>
                  <textarea 
                    required rows={3}
                    value={postForm.excerpt}
                    onChange={(e) => setPostForm({...postForm, excerpt: e.target.value})}
                    placeholder="Bref résumé de l'article..."
                    className="w-full bg-brand-neutral border border-gray-100 px-6 py-4 rounded-2xl focus:border-brand-primary outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">URL de l'image (Unsplash)</label>
                  <input 
                    type="url" required
                    value={postForm.image}
                    onChange={(e) => setPostForm({...postForm, image: e.target.value})}
                    className="w-full bg-brand-neutral border border-gray-100 px-6 py-4 rounded-2xl focus:border-brand-primary outline-none transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isPostSubmitting}
                  className="w-full bg-brand-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-primary hover:text-brand-secondary transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isPostSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : editingPost ? 'Mettre à jour' : 'Publier maintenant'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Modal */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsProjectModalOpen(false)}
              className="absolute inset-0 bg-brand-secondary/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsProjectModalOpen(false)} 
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-brand-secondary"
              >
                <X className="h-6 w-6" />
              </button>
              
              <h3 className="text-3xl font-black text-brand-secondary mb-8 tracking-tighter">
                {editingProject ? 'Modifier le projet' : 'Ajouter un projet'}
              </h3>

              <form onSubmit={handleProjectSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Nom du Projet</label>
                  <input 
                    type="text" required
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                    placeholder="Ex: Villa Solaire Bangui"
                    className="w-full bg-brand-neutral border border-gray-100 px-6 py-4 rounded-2xl focus:border-brand-primary outline-none transition-all"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Catégorie</label>
                    <select 
                      value={projectForm.category}
                      onChange={(e) => setProjectForm({...projectForm, category: e.target.value})}
                      className="w-full bg-brand-neutral border border-gray-100 px-6 py-4 rounded-2xl focus:border-brand-primary outline-none transition-all"
                    >
                      <option value="residential">Résidentiel</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industriel</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Économies (ROI)</label>
                    <input 
                      type="text" required
                      value={projectForm.roi}
                      onChange={(e) => setProjectForm({...projectForm, roi: e.target.value})}
                      placeholder="Ex: 500.000 FCFA/an"
                      className="w-full bg-brand-neutral border border-gray-100 px-6 py-4 rounded-2xl focus:border-brand-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Description</label>
                  <textarea 
                    required rows={3}
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                    className="w-full bg-brand-neutral border border-gray-100 px-6 py-4 rounded-2xl focus:border-brand-primary outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Image Principale (URL)</label>
                  <input 
                    type="url" required
                    value={projectForm.image}
                    onChange={(e) => setProjectForm({...projectForm, image: e.target.value})}
                    className="w-full bg-brand-neutral border border-gray-100 px-6 py-4 rounded-2xl focus:border-brand-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Galerie Photos</label>
                   <div className="flex gap-2">
                      <input 
                        type="url"
                        value={newProjectImage}
                        onChange={(e) => setNewProjectImage(e.target.value)}
                        placeholder="Ajouter une URL d'image..."
                        className="flex-1 bg-brand-neutral border border-gray-100 px-6 py-4 rounded-2xl focus:border-brand-primary outline-none transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (newProjectImage) {
                            setProjectForm({...projectForm, images: [...projectForm.images, newProjectImage]});
                            setNewProjectImage('');
                          }
                        }}
                        className="px-6 bg-brand-primary text-brand-secondary rounded-2xl font-bold"
                      >
                        Ajouter
                      </button>
                   </div>
                   <div className="grid grid-cols-4 gap-2">
                      {projectForm.images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square">
                          <img src={img} className="w-full h-full object-cover rounded-xl" />
                          <button 
                            onClick={() => setProjectForm({...projectForm, images: projectForm.images.filter((_, i) => i !== idx)})}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                   </div>
                </div>

                <button 
                  type="submit"
                  disabled={isProjectSubmitting}
                  className="w-full bg-brand-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-primary hover:text-brand-secondary transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isProjectSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : editingProject ? 'Mettre à jour le projet' : 'Ajouter au Portfolio'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
