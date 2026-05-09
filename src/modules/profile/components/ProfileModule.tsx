import React from 'react';
import { User, LogOut, LogIn, Settings, Shield, CreditCard, Package, Mail, Lock, UserPlus, Heart, Clock, Truck, CheckCircle2, ChevronRight, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { motion, AnimatePresence } from 'motion/react';
import ProfileSettings from './ProfileSettings';
import { cn } from '@/shared/lib/utils';
import { Order } from '@/shared/types';
import { useAuth } from '@/shared/context/AuthContext';
import { useProducts } from '@/shared/lib/queries';

type ProfileTab = 'dashboard' | 'settings' | 'orders' | 'investments' | 'wishlist';


export default function ProfileModule() {
  const navigate = useNavigate();
  const { user, profile, signOut, loading: authLoading, setShowSignOutModal } = useAuth();
  const { data: storeProducts = [] } = useProducts(); // ✅ fix "products is not defined"
  const [activeTab, setActiveTab] = React.useState<ProfileTab>('dashboard');
  const [wishlistVersion, setWishlistVersion] = React.useState(0);
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userOrders, setUserOrders] = React.useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);

  React.useEffect(() => {
    if (user && activeTab === 'orders') {
      fetchOrders();
    }
  }, [user, activeTab]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      setUserOrders(data || []);
    } catch (err) {
      logError("ProfileModule/fetchOrders", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      if (error) throw error;
    } catch (error: any) {
      logError("ProfileModule/signIn", error);
      setAuthError(error.message || "Échec de la connexion avec Google.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;
        alert("Inscription réussie ! Veuillez vérifier votre email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email, password
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    try {
      setAuthError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert("Un lien de réinitialisation a été envoyé à votre adresse email.");
    } catch (error: any) {
      logError("ProfileModule/resetPassword", error);
      setAuthError(error.message || "Erreur lors de l'envoi de l'email de réinitialisation.");
    }
  };

  // Only show the full screen loader if we are still initializing and don't know the auth state yet
  if (authLoading && !user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white dark:bg-slate-900 transition-colors">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#2563B0]/20 border-t-[#2563B0] rounded-full mb-4"
        />
        <p className="text-sm font-bold text-slate-500 animate-pulse">Synchronisation de votre profil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-20 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              {authMode === 'login' ? <LogIn className="w-10 h-10 text-[#2563B0]" /> : <UserPlus className="w-10 h-10 text-[#2563B0]" />}
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {authMode === 'login' ? 'Bienvenue' : 'Créer un compte'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {authMode === 'login' 
                ? 'Connectez-vous pour accéder à vos services GCFI.' 
                : 'Rejoignez la communauté GCFI dès aujourd\'hui.'}
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-3">
              <Shield className="w-4 h-4 shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2563B0] text-slate-900 dark:text-white transition-all shadow-sm"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2563B0] text-slate-900 dark:text-white transition-all shadow-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2563B0] text-slate-900 dark:text-white transition-all shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
            >
              {isSubmitting ? 'Chargement...' : authMode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400"><span className="bg-white dark:bg-slate-800 px-4">Ou continuer avec</span></div>
          </div>

          <button 
            onClick={handleSignIn}
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-4 rounded-2xl font-bold hover:bg-white dark:hover:bg-slate-700/50 transition-colors flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm hover:border-[#2563B0]/30"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-3" />
            Google
          </button>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {authMode === 'login' ? "Pas encore de compte ?" : "Déjà inscrit ?"}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="ml-2 font-bold text-[#2563B0] hover:underline"
            >
              {authMode === 'login' ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-white dark:bg-slate-900 transition-colors">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700">
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-[#2563B0]/10 bg-slate-100">
                <img src={profile?.avatar_url || user.photoURL || `https://ui-avatars.com/api/?name=${profile?.full_name || user.email}`} alt={profile?.full_name || ''} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile?.full_name || user.email?.split('@')[0]}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>

            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  activeTab === 'dashboard' ? "text-[#2563B0] bg-[#2563B0]/5" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <User className="w-5 h-5 mr-3" />
                Mon Profil
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  activeTab === 'orders' ? "text-[#2563B0] bg-[#2563B0]/5" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <Package className="w-5 h-5 mr-3" />
                Mes Commandes
              </button>
              <button 
                onClick={() => setActiveTab('wishlist')}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  activeTab === 'wishlist' ? "text-[#2563B0] bg-[#2563B0]/5" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <Heart className="w-5 h-5 mr-3" />
                Liste de Souhaits
              </button>
              <button 
                onClick={() => setActiveTab('investments')}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  activeTab === 'investments' ? "text-[#2563B0] bg-[#2563B0]/5" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <CreditCard className="w-5 h-5 mr-3" />
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  activeTab === 'settings' ? "text-[#2563B0] bg-[#2563B0]/5" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <Settings className="w-5 h-5 mr-3" />
                Paramètres
              </button>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                  onClick={() => setShowSignOutModal(true)}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Déconnexion
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'dashboard' && (
            <>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700 transition-colors">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Tableau de bord</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-white dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600 shadow-sm">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Formations en cours</p>
                    <p className="text-3xl font-bold text-[#2563B0]">0</p>
                  </div>
                  <div className="p-6 bg-white dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600 shadow-sm">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Commandes livrées</p>
                    <p className="text-3xl font-bold text-[#2563B0]">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sécurité</h3>
                  <Shield className="text-green-500 w-6 h-6" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Votre compte est protégé par l'authentification Supabase.</p>
                <button 
                  onClick={handlePasswordReset}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#2563B0] hover:underline"
                >
                  <Lock className="w-4 h-4" />
                  Réinitialiser le mot de passe par email
                </button>
              </div>
            </>
          )}

          {activeTab === 'settings' && <ProfileSettings user={user} />}
          
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Suivi de commandes</h3>
                <span className="text-xs font-black uppercase tracking-widest text-[#2563B0] bg-[#2563B0]/5 px-4 py-2 rounded-full">
                  {userOrders.length} Commandes
                </span>
              </div>
              
              {ordersLoading ? (
                <div className="p-12 text-center text-slate-400">Chargement de vos commandes...</div>
              ) : userOrders.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-[2rem] text-center text-slate-500 border border-slate-100 dark:border-slate-700">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">Vous n'avez pas encore passé de commande.</p>
                </div>
              ) : userOrders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">N° de commande</p>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">#{order.id.slice(0, 8)}</h4>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Date</p>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Statut</p>
                      <span className={cn(
                        "text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg",
                        order.status === 'completed' ? "bg-green-50 dark:bg-green-900/20 text-green-600" :
                        order.status === 'En préparation' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" :
                        "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                      )}>
                        {order.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Total</p>
                      <p className="text-lg font-black text-[#2563B0]">{(order.total || 0).toLocaleString()} FCFA</p>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    {/* Stepper tracking */}
                    <div className="relative flex justify-between mb-12 max-w-2xl mx-auto">
                      <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 dark:bg-slate-700" />
                      <div 
                        className="absolute top-5 left-0 h-[2px] bg-[#2563B0] transition-all duration-1000"
                        style={{ 
                          width: order.status === 'completed' ? '100%' : 
                                 order.status === 'Expédiée' ? '66%' : 
                                 '33%' 
                        }}
                      />
                      
                      {[
                        { label: 'En préparation', icon: Clock, active: true },
                        { label: 'Expédiée', icon: Truck, active: order.status === 'Expédiée' || order.status === 'completed' },
                        { label: 'Livrée', icon: CheckCircle2, active: order.status === 'completed' }
                      ].map((step, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                            step.active 
                              ? "bg-[#2563B0] border-[#2563B0] text-white shadow-lg shadow-blue-500/20" 
                              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300"
                          )}>
                            <step.icon className="w-5 h-5" />
                          </div>
                          <span className={cn(
                            "absolute top-12 whitespace-nowrap text-[10px] font-black uppercase tracking-widest",
                            step.active ? "text-slate-900 dark:text-white" : "text-slate-400"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 mt-16 flex items-center justify-between shadow-sm border border-slate-50 dark:border-transparent">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                            <img src={order.items[0].image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{order.items[0].name}</p>
                            <p className="text-xs text-slate-500">{order.items.length} article(s)</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8">Ma Liste de Souhaits</h3>
              {(() => {
                const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
                const wishlistItems = storeProducts.filter(p => wishlistIds.includes(p.id));

                if (wishlistItems.length === 0) {
                  return (
                    <div className="bg-white dark:bg-slate-800 p-16 rounded-[2.5rem] shadow-lg border border-slate-100 dark:border-slate-700 text-center">
                      <Heart className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-6" />
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Votre liste est vide</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-8">Parcourez notre collection et sauvegardez vos produits favoris.</p>
                      <button 
                        onClick={() => window.location.reload()} 
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all"
                      >
                        Retour à la boutique
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {wishlistItems.map((product) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl group hover:shadow-2xl transition-all"
                      >
                        <div className="flex gap-4">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#2563B0] mb-1">{product.category}</p>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate mb-1">{product.name}</h4>
                            <p className="text-lg font-black text-slate-900 dark:text-white mb-2">{product.price.toLocaleString()} FCFA</p>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
                                  const updated = saved.filter((id: string) => id !== product.id);
                                  localStorage.setItem('wishlist', JSON.stringify(updated));
                                  setWishlistVersion(v => v + 1);
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline"
                              >
                                Retirer
                              </button>
                              <div className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                              <button 
                                onClick={() => window.location.reload()}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                              >
                                Voir produit
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
          
          {activeTab === 'investments' && (
            <div className="bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] shadow-lg border border-slate-100 dark:border-slate-700 text-center transition-colors">
              <Package className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucune donnée trouvée</h3>
              <p className="text-slate-500 dark:text-slate-400">Vous n'avez pas encore d'activité dans cette section.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
