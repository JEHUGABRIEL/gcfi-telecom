import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, ShoppingCart, LogOut, LayoutDashboard, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { itemCount, isCartAnimating } = useCart();
  const { isAdmin, logout } = useAuth();

  const isAdminPage = location.pathname.startsWith('/admin');

  React.useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const navLinks = isAdminPage ? [] : [
    { name: 'Accueil',  path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Boutique', path: '/shop' },
    { name: 'Portfolio',path: '/portfolio' },
    { name: 'À Propos', path: '/a-propos' },
    { name: 'Blog',     path: '/blog' },
  ];

  return (
    <nav className="fixed w-full z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">

          {/* Logo */}
          <div className="flex items-center">
            <Link to={isAdminPage ? '/admin' : '/'} className="flex items-center space-x-3 group">
              <div className="relative w-12 h-12 bg-white rounded-full overflow-hidden shadow-lg border-2 border-brand-primary transform group-hover:scale-110 transition-transform duration-300">
                <img src="/logo_sol_centrafrique.png" alt="SOL!" className="w-full h-full object-contain p-1" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-2xl text-brand-secondary leading-none tracking-tighter">
                  SOL<span className="text-brand-primary">!</span>
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-primary leading-none mt-1">
                  {isAdminPage ? 'Admin' : 'Centrafrique'}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path}
                className={`text-sm font-semibold transition-colors hover:text-brand-primary ${location.pathname === link.path ? 'text-brand-primary' : 'text-brand-secondary'}`}>
                {link.name}
              </Link>
            ))}

            {/* Panier */}
            {!isAdminPage && (
              <div className="relative group">
                <Link to="/cart" className="p-2 text-brand-secondary hover:text-brand-primary transition-colors">
                  <motion.div animate={isCartAnimating ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}} transition={{ duration: 0.5 }}>
                    <ShoppingCart className={`h-6 w-6 ${isCartAnimating ? 'text-brand-primary' : ''}`} />
                  </motion.div>
                  {itemCount > 0 && (
                    <motion.span key={itemCount} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-1 -right-1 bg-brand-primary text-brand-secondary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {itemCount}
                    </motion.span>
                  )}
                </Link>
              </div>
            )}

            {/* Admin : Dashboard + Déconnexion si connecté */}
            {isAdmin && (
              <div className="flex items-center gap-4">
                {!isAdminPage && (
                  <Link to="/admin" className="p-2 text-brand-secondary hover:text-brand-primary transition-colors flex items-center gap-2 font-semibold text-sm">
                    <LayoutDashboard className="h-5 w-5" /><span>Admin</span>
                  </Link>
                )}
                <button onClick={logout}
                  className="p-2 text-brand-secondary hover:text-red-500 transition-colors flex items-center gap-2 font-semibold text-sm">
                  <LogOut className="h-5 w-5" /><span>Déconnexion</span>
                </button>
              </div>
            )}

            {!isAdminPage && (
              <Link to="/contact"
                className="bg-brand-primary text-brand-secondary px-6 py-2.5 rounded-full font-bold text-sm hover:bg-brand-primary/90 transition-all flex items-center gap-2">
                Devis Gratuit
              </Link>
            )}
          </div>

          {/* Bouton menu mobile */}
          <div className="md:hidden flex items-center">
            <button onClick={() => { if (navigator.vibrate) navigator.vibrate(5); setIsOpen(!isOpen); }}
              className="text-brand-secondary p-2 focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-lg transition-transform active:scale-90"
              aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Menu mobile ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-brand-secondary/60 z-[55] md:hidden backdrop-brightness-50 backdrop-blur-sm" />

            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-screen w-[85%] max-w-sm bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.3)] z-[60] md:hidden flex flex-col">

              {/* En-tête menu */}
              <div className="p-6 flex justify-between items-center border-b border-gray-100 bg-brand-neutral/30">
                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-white rounded-full overflow-hidden border-2 border-brand-primary p-0.5 shadow-sm">
                    <img src="/logo_sol_centrafrique.png" alt="SOL!" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-display font-black text-lg text-brand-secondary tracking-tighter uppercase italic">SOL<span className="text-brand-primary">!</span></span>
                    <span className="text-[6px] font-black uppercase text-brand-primary tracking-widest">Centrafrique</span>
                  </div>
                </Link>
                <button onClick={() => setIsOpen(false)} className="bg-brand-neutral p-3 rounded-2xl text-brand-secondary hover:bg-brand-primary/10 transition-all active:scale-95">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Liens */}
              <div className="p-8 space-y-3 flex-grow overflow-y-auto bg-white">
                <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Navigation principale</p>
                {navLinks.map((link, idx) => (
                  <motion.div key={link.path} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + idx * 0.05, ease: [0.16, 1, 0.3, 1] }}>
                    <Link to={link.path} onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setIsOpen(false); }}
                      className={`group flex items-center justify-between px-6 py-5 rounded-[2rem] transition-all active:scale-95 border-2 ${
                        location.pathname === link.path
                          ? 'bg-brand-primary border-brand-primary text-brand-secondary font-black shadow-2xl shadow-brand-primary/20'
                          : 'text-gray-600 font-bold border-transparent hover:bg-brand-neutral hover:text-brand-secondary'}`}>
                      <span className="text-xl tracking-tight">{link.name}</span>
                      {location.pathname === link.path
                        ? <div className="w-2.5 h-2.5 bg-brand-secondary rounded-full" />
                        : <ChevronRight className="h-5 w-5 text-brand-primary opacity-0 group-hover:opacity-100 transition-all" />}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Bas du menu mobile */}
              <div className="p-8 space-y-6 bg-brand-neutral/40 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  {/* Panier */}
                  {!isAdminPage && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      <Link to="/cart" onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setIsOpen(false); }}
                        className="flex flex-col h-full items-center justify-center p-5 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all relative group">
                        <div className="relative mb-1">
                          <ShoppingCart className="h-7 w-7 text-brand-secondary group-hover:text-brand-primary transition-colors" />
                          {itemCount > 0 && (
                            <span className="absolute -top-1 -right-2 bg-brand-primary text-brand-secondary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white">
                              {itemCount}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Panier</span>
                      </Link>
                    </motion.div>
                  )}

                  {/* Déconnexion admin OU vide */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="h-full">
                    {isAdmin ? (
                      <button onClick={() => { logout(); setIsOpen(false); }}
                        className="w-full flex h-full flex-col items-center justify-center p-5 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <LogOut className="h-7 w-7 text-brand-secondary group-hover:text-red-500 transition-colors mb-1" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logout</span>
                      </button>
                    ) : (
                      <div className="h-full" />
                    )}
                  </motion.div>
                </div>

                {!isAdminPage && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <Link to="/contact" onClick={() => { if (navigator.vibrate) navigator.vibrate([20, 40, 20]); setIsOpen(false); }}
                      className="w-full bg-brand-secondary text-white px-6 py-5 rounded-2xl font-black flex justify-center items-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group">
                      <Phone className="h-6 w-6 text-brand-primary" />
                      <span className="uppercase tracking-widest text-lg">Devis Gratuit</span>
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
