'use client';

import React from 'react';
import Image from 'next/image';
import { User, LogOut, LogIn, Settings, Shield, CreditCard, Package, Mail, Lock, UserPlus, Heart, Clock, Truck, CheckCircle2, ChevronRight, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { motion, AnimatePresence } from 'motion/react';
import ProfileSettings from './ProfileSettings';
import { cn } from '@/shared/lib/utils';
import { Order } from '@/shared/types';
import { useAuth } from '@/shared/context/AuthContext';
import { useLang } from '@/shared/context/LanguageContext';

type ProfileTab = 'dashboard' | 'settings' | 'orders' | 'investments' | 'wishlist';


export default function ProfileModule() {
  const { t } = useLang();
  const router = useRouter();
  const { user, profile, signOut, setShowSignOutModal, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState<ProfileTab>('dashboard');
  const [wishlistVersion, setWishlistVersion] = React.useState(0);
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userOrders, setUserOrders] = React.useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);
  const [storeProducts, setStoreProducts] = React.useState<{ id: string; name: string; price: number; image: string; category: string }[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(false);

  React.useEffect(() => {
    if (user && activeTab === 'orders') {
      fetchOrders();
    }
    if (user && activeTab === 'wishlist') {
      fetchStoreProducts();
    }
  }, [user, activeTab]);

  const fetchOrders = async () => {
    if (!user) return;
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

  const fetchStoreProducts = async () => {
    if (storeProducts.length > 0) return; // déjà chargés
    setProductsLoading(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, image, category');
      setStoreProducts(data || []);
    } catch (err) {
      logError('ProfileModule/fetchStoreProducts', err);
    } finally {
      setProductsLoading(false);
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
    } catch (error: unknown) {
      logError("ProfileModule/signIn", error);
      setAuthError(error instanceof Error ? error.message : t.profile_page.auth_error_google);
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
        setAuthSuccess(t.profile_page.auth_success_signup);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email, password
        });
        if (error) throw error;
      }
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : t.common.error);
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
      setAuthSuccess(t.profile_page.auth_success_reset);
    } catch (error: unknown) {
      logError("ProfileModule/resetPassword", error);
      setAuthError(error instanceof Error ? error.message : t.profile_page.auth_error_reset);
    }
  };

  // Only show the full screen loader if we are still initializing and don't know the auth state yet
  if (authLoading && !user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white dark:bg-slate-900 transition-colors">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full mb-4"
        />
        <p className="text-sm font-bold text-slate-500 animate-pulse">{t.profile_page.sync_title}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-20 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              {authMode === 'login' ? <LogIn className="w-10 h-10 text-[var(--accent)]" /> : <UserPlus className="w-10 h-10 text-[var(--accent)]" />}
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {authMode === 'login' ? t.profile_page.welcome_title : t.profile_page.signup_title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {authMode === 'login' ? t.profile_page.welcome_sub : t.profile_page.signup_sub}
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-3">
              <Shield className="w-4 h-4 shrink-0" />
              {authError}
            </div>
          )}
          {authSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {authSuccess}
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
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-900 dark:text-white transition-all shadow-sm"
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
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-900 dark:text-white transition-all shadow-sm"
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
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-900 dark:text-white transition-all shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
            >
              {isSubmitting ? t.common.loading : authMode === 'login' ? t.auth.login_btn : t.auth.signup_btn}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400"><span className="bg-white dark:bg-slate-800 px-4">{t.auth.or_continue}</span></div>
          </div>

          <button 
            onClick={handleSignIn}
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-4 rounded-2xl font-bold hover:bg-white dark:hover:bg-slate-700/50 transition-colors flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm hover:border-[var(--accent)]/30"
          >
            <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} className="mr-3" unoptimized />
            Google
          </button>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {authMode === 'login' ? t.auth.no_account : t.auth.has_account}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="ml-2 font-bold text-[var(--accent)] hover:underline"
            >
              {authMode === 'login' ? t.auth.switch_signup : t.auth.switch_login}
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
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-[var(--accent)]/10 bg-slate-100 relative">
                <Image src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || user?.email || 'U')}&background=C1272D&color=fff`} alt={profile?.full_name || ''} fill className="object-cover" sizes="96px" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile?.full_name || user.email?.split('@')[0]}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>

            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  activeTab === 'dashboard' ? "text-[var(--accent)] bg-[var(--accent)]/5" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <User className="w-5 h-5 mr-3" />
                {t.profile_page.my_profile}
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  activeTab === 'orders' ? "text-[var(--accent)] bg-[var(--accent)]/5" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <Package className="w-5 h-5 mr-3" />
                {t.profile_page.my_orders}
              </button>
              <button 
                onClick={() => setActiveTab('wishlist')}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  activeTab === 'wishlist' ? "text-[var(--accent)] bg-[var(--accent)]/5" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <Heart className="w-5 h-5 mr-3" />
                {t.profile_page.my_wishlist}
              </button>
              <button 
                onClick={() => setActiveTab('investments')}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  activeTab === 'investments' ? "text-[var(--accent)] bg-[var(--accent)]/5" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <CreditCard className="w-5 h-5 mr-3" />
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  activeTab === 'settings' ? "text-[var(--accent)] bg-[var(--accent)]/5" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <Settings className="w-5 h-5 mr-3" />
                {t.profile_page.settings}
              </button>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowSignOutModal(true)}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {t.profile_page.logout}
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
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t.profile_page.dashboard}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-white dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600 shadow-sm">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t.profile_page.courses_in_progress}</p>
                    <p className="text-3xl font-bold text-[var(--accent)]">0</p>
                  </div>
                  <div className="p-6 bg-white dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600 shadow-sm">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t.profile_page.orders_delivered}</p>
                    <p className="text-3xl font-bold text-[var(--accent)]">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.profile_page.security}</h3>
                  <Shield className="text-green-500 w-6 h-6" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t.profile_page.security_desc}</p>
                {/* ✅ Reset password uniquement pour les utilisateurs classiques */}
                {(profile?.role === 'admin' || profile?.role === 'superadmin') ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-xl">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{t.profile_page.reset_pwd_admin}</span>
                  </div>
                ) : (
                  <button 
                    onClick={handlePasswordReset}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--accent)] hover:underline"
                  >
                    <Lock className="w-4 h-4" />
                    {t.profile_page.reset_pwd}
                  </button>
                )}
              </div>
            </>
          )}

          {activeTab === 'settings' && <ProfileSettings user={user} />}
          
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t.profile_page.my_orders}</h3>
                <span className="text-xs font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/5 px-4 py-2 rounded-full">
                  {userOrders.length} {t.profile_page.my_orders}
                </span>
              </div>
              
              {ordersLoading ? (
                <div className="p-12 text-center text-slate-400">{t.profile_page.loading_orders}</div>
              ) : userOrders.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-[2rem] text-center text-slate-500 border border-slate-100 dark:border-slate-700">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">{t.profile_page.empty_orders}</p>
                </div>
              ) : userOrders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{t.profile_page.order_number}</p>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">#{order.id.slice(0, 8)}</h4>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{t.profile_page.order_date}</p>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{t.profile_page.order_status}</p>
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
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{t.profile_page.order_total}</p>
                      <p className="text-lg font-black text-[var(--accent)]">{(order.total || 0).toLocaleString()} FCFA</p>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    {/* Stepper tracking */}
                    <div className="relative flex justify-between mb-12 max-w-2xl mx-auto">
                      <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 dark:bg-slate-700" />
                      <div 
                        className="absolute top-5 left-0 h-[2px] bg-[var(--accent)] transition-all duration-1000"
                        style={{ 
                          width: order.status === 'completed' ? '100%' : 
                                 order.status === 'Expédiée' ? '66%' : 
                                 '33%' 
                        }}
                      />
                      
                      {(t.profile_page.order_steps as unknown as string[]).map((label: string, idx: number) => {
                        const icons = [Clock, Truck, CheckCircle2];
                        const Icon = icons[idx];
                        const active = idx === 0 ? true : idx === 1 ? (order.status === 'Expédiée' || order.status === 'completed') : order.status === 'completed';
                        return (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                            active 
                              ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg shadow-blue-500/20" 
                              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300"
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={cn(
                            "absolute top-12 whitespace-nowrap text-[10px] font-black uppercase tracking-widest",
                            active ? "text-slate-900 dark:text-white" : "text-slate-400"
                          )}>
                            {label}
                          </span>
                        </div>
                        );})
                      }
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 mt-16 flex items-center justify-between shadow-sm border border-slate-50 dark:border-transparent">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 relative">
                            <Image src={order.items[0].image} alt="" fill className="object-cover" sizes="64px" />
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
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8">{t.profile_page.my_wishlist}</h3>
              {(() => {
                const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
                const wishlistItems = storeProducts.filter(p => wishlistIds.includes(p.id));

                if (wishlistItems.length === 0) {
                  return (
                    <div className="bg-white dark:bg-slate-800 p-16 rounded-[2.5rem] shadow-lg border border-slate-100 dark:border-slate-700 text-center">
                      <Heart className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-6" />
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.profile_page.wishlist_empty_title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-8">{t.profile_page.wishlist_empty_text}</p>
                      <button 
                        onClick={() => window.location.reload()} 
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all"
                      >
                        {t.profile_page.wishlist_back}
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
                          <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative">
                            <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="96px" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-1">{product.category}</p>
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
                                {t.profile_page.wishlist_remove}
                              </button>
                              <div className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                              <button 
                                onClick={() => window.location.reload()}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                              >
                                {t.profile_page.wishlist_view}
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.profile_page.investments_empty_title}</h3>
              <p className="text-slate-500 dark:text-slate-400">{t.profile_page.investments_empty_text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}