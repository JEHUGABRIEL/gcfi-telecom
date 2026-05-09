import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { AuthProvider } from '@/shared/context/AuthContext';
import { NotificationProvider } from '@/shared/context/NotificationContext';
import Header from '@/shared/components/Header';
import AdminHeader from '@/shared/components/AdminHeader';
import Footer from '@/shared/components/Footer';
import BottomNav from '@/shared/components/BottomNav';
import ScrollProgress from '@/shared/components/ScrollProgress';
import ScrollToTop from '@/shared/components/ScrollToTop';
import FloatingContact from '@/shared/components/FloatingContact';
import ContactModal from '@/shared/components/ContactModal';
import AuthModal from '@/shared/components/AuthModal';
import { useAuth } from '@/shared/context/AuthContext';

const StoreModule    = lazy(() => import('@/modules/store').then(m => ({ default: m.StoreModule })));
const TrainingModule = lazy(() => import('@/modules/training').then(m => ({ default: m.TrainingModule })));
const ProfileModule  = lazy(() => import('@/modules/profile').then(m => ({ default: m.ProfileModule })));
const AdminModule    = lazy(() => import('@/modules/admin').then(m => ({ default: m.AdminModule })));
const HomeView       = lazy(() => import('./HomeView'));

function ModuleLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[var(--bg-primary)]">
      <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-[var(--accent)] rounded-full animate-spin" />
    </div>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <ModuleLoader />;
  if (!loading && (!user || !isAdmin)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ClientRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  // Ne pas bloquer — afficher le contenu pendant que l'auth se résout
  if (loading) return <>{children}</>;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function ProtectedClientRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, setShowAuthModal } = useAuth();
  React.useEffect(() => {
    if (!loading && !user) setShowAuthModal(true);
  }, [loading, user, setShowAuthModal]);
  if (loading) return <>{children}</>;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRedirect() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!loading && isAdmin) navigate('/admin', { replace: true });
  }, [isAdmin, loading, navigate]);
  return null;
}

function AnimatedRoutes({ onContactOpen }: { onContactOpen: () => void }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<ClientRoute><Suspense fallback={<ModuleLoader />}><HomeView onContactOpen={onContactOpen} /></Suspense></ClientRoute>} />
          <Route path="/boutique" element={<ClientRoute><Suspense fallback={<ModuleLoader />}><StoreModule /></Suspense></ClientRoute>} />
          <Route path="/formation" element={<ClientRoute><Suspense fallback={<ModuleLoader />}><TrainingModule onContactOpen={onContactOpen} /></Suspense></ClientRoute>} />
          <Route path="/profil" element={<ProtectedClientRoute><Suspense fallback={<ModuleLoader />}><ProfileModule /></Suspense></ProtectedClientRoute>} />
          <Route path="/admin" element={<AdminRoute><Suspense fallback={<ModuleLoader />}><AdminModule /></Suspense></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const { loading: authLoading, isAdmin } = useAuth();
  const [isContactOpen, setIsContactOpen] = React.useState(false);

  // ✅ Ne plus bloquer le rendu — l'auth se résout en arrière-plan
  // if (authLoading) { return <spinner> }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-white dark:bg-[var(--bg-primary)] font-sans transition-colors">
      <ScrollProgress hideButton={isAdmin} />
      {isAdmin ? <AdminHeader /> : <Header onContactOpen={() => setIsContactOpen(true)} />}
      <AdminRedirect />
      <main>
        <Suspense fallback={<ModuleLoader />}>
          <AnimatedRoutes onContactOpen={() => setIsContactOpen(true)} />
        </Suspense>
      </main>
      {!isAdmin && (
        <>
          <Footer />
          <FloatingContact />
          <BottomNav />
          <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </>
      )}
      <ScrollToTop />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,      // ✅ supprime le warning startTransition
        v7_relativeSplatPath: true,    // ✅ supprime le warning relativeSplatPath
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
            <AuthModal />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
