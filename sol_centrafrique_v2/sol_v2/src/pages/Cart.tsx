import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Trash2, ArrowRight, Sun, MessageSquare, ShoppingBag, Lock } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();
  // User auth removed
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="pt-32 pb-24 min-h-screen bg-brand-neutral">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Votre sélection
              </span>
            </div>
            <h1 className="text-4xl font-black text-brand-secondary flex items-center gap-4">
              <ShoppingCart className="h-10 w-10 text-brand-primary" /> Mon Panier
            </h1>
          </div>

          {cart.length > 0 && (
            <button 
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Vider le panier
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-16 text-center shadow-xl shadow-brand-secondary/5"
          >
            <div className="bg-brand-neutral w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingCart className="h-12 w-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-brand-secondary mb-4">Votre panier est vide</h2>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto">
              Vous n'avez pas encore ajouté de services à votre demande de devis. Parcourez nos solutions pour commencer.
            </p>
            <Link 
              to="/services"
              className="bg-brand-primary text-brand-secondary px-8 py-4 rounded-2xl font-bold inline-flex items-center gap-3 hover:scale-105 transition-transform shadow-lg shadow-brand-primary/20"
            >
              Découvrir nos services <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {cart.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-neutral flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-primary">
                          <Sun className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          item.type === 'service' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-accent/10 text-brand-accent'
                        }`}>
                          {item.type === 'service' ? 'Service' : 'Produit'}
                        </span>
                      </div>
                      <h3 className="font-bold text-brand-secondary text-lg">{item.title}</h3>
                      {item.price && (
                        <p className="text-brand-primary font-black">{item.price} FCFA</p>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                    aria-label="Supprimer du panier"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Retirer</span>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-brand-secondary p-10 rounded-[3rem] text-white mt-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <ShoppingBag className="h-40 w-40" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Finaliser votre commande</h3>
                <p className="text-white/70 mb-8 max-w-lg leading-relaxed">
                  Votre sélection est prête. Vous pouvez soit demander un devis complet pour vos services, soit commander les produits directement sur WhatsApp.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {true ? (
                    <Link 
                      to="/contact"
                      className="bg-brand-primary text-brand-secondary px-10 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-brand-primary/20"
                    >
                      <MessageSquare className="h-5 w-5" /> Devis complet
                    </Link>
                  ) : (
                    <button
                      onClick={() => {}}
                      className="bg-brand-primary text-brand-secondary px-10 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-brand-primary/20"
                    >
                      <Lock className="h-5 w-5" /> Se connecter pour commander
                    </button>
                  )}
                  
                  {true && (
                    <a 
                      href={`https://wa.me/23675000000?text=${encodeURIComponent(
                        `Bonjour SOL! Centrafrique, je souhaite commander : \n${cart.map(i => `- ${i.title}${i.price ? ` (${i.price} FCFA)` : ''}`).join('\n')}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white px-10 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20"
                    >
                      <ShoppingBag className="h-5 w-5" /> Commander via WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
