import React from 'react';
import { motion } from 'framer-motion';
import { SERVICES } from '../constants';
import { CheckCircle2, TrendingUp, ShieldCheck, Clock, Home, Building2, Globe, Settings, ShoppingCart, Check, ArrowRight, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const iconMap: Record<string, React.ElementType> = {
  Home,
  Building2,
  Globe,
  Settings
};

export default function Services() {
  const { addToCart, cart } = useCart();
  // User auth removed
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isInCart = (id: string) => cart.some(item => item.id === id);

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="bg-brand-secondary py-24" aria-labelledby="services-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            id="services-title"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Nos Solutions Énergétiques
          </motion.h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            De la villa résidentielle au complexe hospitalier, nous concevons des systèmes solaires sur-mesure pour une autonomie totale.
          </p>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="py-20 bg-brand-neutral/50" aria-label="Aperçu rapide des services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((service, idx) => {
              const ServiceIcon = iconMap[service.icon] || CheckCircle2;
              return (
                <motion.a
                  href={`#${service.id}`}
                  key={`quick-${service.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 transition-all group flex flex-col items-center text-center border border-gray-100"
                >
                  <div className="w-16 h-16 bg-brand-neutral rounded-2xl flex items-center justify-center text-brand-primary mb-6 group-hover:bg-brand-primary group-hover:text-brand-secondary transition-colors">
                    <ServiceIcon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black text-brand-secondary mb-4 leading-tight">{service.title}</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">{service.description}</p>
                  
                  <span className="text-brand-primary font-bold text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    En savoir plus <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Services List */}
      <section className="py-24 space-y-32" aria-label="Liste détaillée de nos services">
        {SERVICES.map((service, idx) => {
          const ServiceIcon = iconMap[service.icon] || CheckCircle2;
          
          return (
            <div 
              id={service.id} 
              key={service.id} 
              className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-16 items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
            >
              <motion.div {...fadeIn} className="flex-1">
                <div 
                  className="inline-flex p-4 bg-brand-primary/10 rounded-2xl text-brand-primary mb-6 ring-1 ring-brand-primary/20"
                  aria-hidden="true"
                >
                  <ServiceIcon className="h-10 w-10" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-brand-secondary mb-6">{service.title}</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  {service.longDescription}
                </p>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-6 w-6 text-brand-accent flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-bold text-brand-secondary">ROI Élevé</p>
                      <p className="text-xs text-gray-400">Rentabilité en 3-5 ans</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-6 w-6 text-brand-accent flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-bold text-brand-secondary">Garantie</p>
                      <p className="text-xs text-gray-400">Jusqu'à 10 ans</p>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-neutral p-8 rounded-3xl border border-gray-100 shadow-sm mb-8">
                  <h3 className="font-bold text-brand-secondary mb-6 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-brand-primary" /> Processus d'installation
                  </h3>
                  <ol className="space-y-4 text-sm text-gray-600">
                    <li className="flex gap-4">
                      <span className="bg-brand-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-brand-secondary flex-shrink-0">1</span>
                      <p>Étude technique détaillée et diagnostic énergétique personnalisé sans frais.</p>
                    </li>
                    <li className="flex gap-4">
                      <span className="bg-brand-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-brand-secondary flex-shrink-0">2</span>
                      <p>Conception sur-mesure et sélection d'équipements certifiés (Tier 1).</p>
                    </li>
                    <li className="flex gap-4">
                      <span className="bg-brand-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-brand-secondary flex-shrink-0">3</span>
                      <p>Mise en service par nos techniciens experts et formation à l'utilisation.</p>
                    </li>
                  </ol>
                </div>

                <button
                  onClick={() => {
                    if (false) {
                      navigate('/contact');
                      return;
                    }
                    addToCart({ 
                      id: service.id, 
                      title: service.title,
                      type: 'service',
                      image: idx === 0 ? "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=60&w=800" : 
                             idx === 1 ? "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?auto=format&fit=crop&q=60&w=800" :
                             idx === 2 ? "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&q=60&w=800" :
                             "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?auto=format&fit=crop&q=60&w=800"
                    });
                    showToast(`${service.title} ajouté à votre demande !`, 'success');
                  }}
                  disabled={isInCart(service.id)}
                  className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all relative group ${
                    isInCart(service.id)
                      ? 'bg-green-100 text-green-600 cursor-default'
                      : 'bg-brand-secondary text-white hover:bg-brand-secondary/90 shadow-xl shadow-brand-secondary/20 hover:scale-[1.02]'
                  }`}
                >
                  {isInCart(service.id) ? (
                    <>
                      <Check className="h-5 w-5" /> Dans le panier
                    </>
                  ) : (
                    <>
                      
                      <ShoppingCart className="h-5 w-5" /> 
                      'Demander un devis'
                    </>
                  )}
                  {false && (
                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-brand-secondary text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Connexion requise
                     </div>
                  )}
                </button>
              </motion.div>

              <motion.div 
                {...fadeIn}
                transition={{ delay: 0.2 }}
                className="flex-1 w-full"
              >
                <div className="aspect-[4/3] rounded-[3rem] overflow-hidden bg-brand-neutral relative group shadow-2xl">
                  <img 
                    src={idx === 0 ? "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=60&w=800" : 
                         idx === 1 ? "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?auto=format&fit=crop&q=60&w=800" :
                         idx === 2 ? "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&q=60&w=800" :
                         "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?auto=format&fit=crop&q=60&w=800"} 
                    alt={`Illustration pour le service: ${service.title}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[3rem]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            </div>
          );
        })}
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white border-y border-gray-100" aria-labelledby="features-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="features-title" className="text-3xl font-bold text-brand-secondary">Inclus dans toutes nos solutions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {[
               { title: "Matériel Certifié", icon: ShieldCheck, desc: "Équipements garantis" },
               { title: "Suivi App Mobile", icon: TrendingUp, desc: "Monitoring en temps réel" },
               { title: "Support 24/7", icon: Clock, desc: "Assistance Bangui" },
               { title: "Assurance Inclus", icon: CheckCircle2, desc: "Protection totale" }
             ].map((f, i) => (
               <div key={i} className="text-center p-8 bg-brand-neutral/50 rounded-3xl border border-transparent hover:border-brand-primary/20 hover:bg-white hover:shadow-xl transition-all">
                 <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-accent shadow-sm">
                   <f.icon className="h-8 w-8" aria-hidden="true" />
                 </div>
                 <h4 className="font-bold text-brand-secondary mb-1">{f.title}</h4>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{f.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
}
