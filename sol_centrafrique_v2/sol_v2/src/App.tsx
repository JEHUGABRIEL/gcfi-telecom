import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Services from './pages/Services';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Portfolio from './pages/Portfolio';
import About from './pages/About';
import Blog from './pages/Blog';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import FloatingActions from './components/FloatingActions';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
};

// ── Garde de route admin ──────────────────────────────────────
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-neutral">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

// ── Wrap animé ───────────────────────────────────────────────
const Page = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial="initial" animate="animate" exit="exit"
    variants={pageVariants} transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const location = useLocation();

  return (
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <div className="min-h-screen bg-brand-neutral font-sans selection:bg-brand-primary selection:text-brand-secondary">
              <Navbar />

              <main className="relative">
                <AnimatePresence mode="wait">
                  <Routes location={location} key={location.pathname}>
                    {/* ── Pages publiques ── */}
                    <Route path="/"          element={<Page><Home /></Page>} />
                    <Route path="/services"  element={<Page><Services /></Page>} />
                    <Route path="/shop"      element={<Page><Shop /></Page>} />
                    <Route path="/cart"      element={<Page><Cart /></Page>} />
                    <Route path="/portfolio" element={<Page><Portfolio /></Page>} />
                    <Route path="/a-propos"  element={<Page><About /></Page>} />
                    <Route path="/blog"      element={<Page><Blog /></Page>} />
                    <Route path="/contact"   element={<Page><Contact /></Page>} />

                    {/* ── Admin ── */}
                    <Route path="/admin/login" element={<Page><AdminLogin /></Page>} />
                    <Route path="/admin" element={
                      <AdminRoute>
                        <Page><AdminDashboard /></Page>
                      </AdminRoute>
                    } />

                    {/* ── Redirections legacy ── */}
                    <Route path="/login"      element={<Navigate to="/" replace />} />
                    <Route path="/mon-profil" element={<Navigate to="/" replace />} />
                    <Route path="*"           element={<Navigate to="/" replace />} />
                  </Routes>
                </AnimatePresence>
              </main>

              <FloatingActions />

              {/* ── Footer ── */}
              <footer className="bg-brand-secondary text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="bg-brand-primary p-2 rounded-lg">
                          <Sun className="h-6 w-6 text-brand-secondary" />
                        </div>
                        <span className="font-display font-bold text-2xl">SOL!</span>
                      </div>
                      <p className="text-gray-400 max-w-sm">
                        Leader de l'énergie solaire en République Centrafricaine. Nous apportons la lumière et la puissance aux familles et aux entreprises.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-6">Navigation</h4>
                      <ul className="space-y-4 text-gray-400 text-sm">
                        <li><Link to="/"          className="hover:text-brand-primary transition-colors">Accueil</Link></li>
                        <li><Link to="/services"  className="hover:text-brand-primary transition-colors">Nos Services</Link></li>
                        <li><Link to="/portfolio" className="hover:text-brand-primary transition-colors">Réalisations</Link></li>
                        <li><Link to="/contact"   className="hover:text-brand-primary transition-colors">Contact</Link></li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-6">Contact</h4>
                      <ul className="space-y-4 text-gray-400 text-sm">
                        <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-primary" /> Bangui, RCA</li>
                        <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-primary" /> contact@sol-centrafrique.com</li>
                        <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-primary" /> +236 70 00 00 00</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs text-gray-500">© {new Date().getFullYear()} SOL! Centrafrique. Tous droits réservés.</p>
                    <div className="flex gap-6">
                      <Facebook className="h-5 w-5 text-gray-400 hover:text-brand-primary transition-colors cursor-pointer" />
                      <Instagram className="h-5 w-5 text-gray-400 hover:text-brand-primary transition-colors cursor-pointer" />
                      <Linkedin className="h-5 w-5 text-gray-400 hover:text-brand-primary transition-colors cursor-pointer" />
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
