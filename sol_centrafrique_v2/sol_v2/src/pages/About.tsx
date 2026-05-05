import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Target, Users, BookOpen, Award, Star, Quote, ShieldCheck, Globe, Rocket, ArrowRight } from 'lucide-react';
import { TESTIMONIALS } from '../constants';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function About() {
  const statsRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: statsRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 50]);

  const stats = [
    { label: "Projets Réalisés", value: "250+", icon: Target },
    { label: "Économisés / an", value: "85M FCFA", icon: Award },
    { label: "Années d'Expérience", value: "10 Ans", icon: BookOpen },
    { label: "Clients Heureux", value: "98%", icon: Users },
  ];

  return (
    <div className="pt-20">
      <Helmet>
        <title>À Propos | SOL! Centrafrique - Énergie Solaire</title>
        <meta name="description" content="Découvrez SOL!, le leader de l'énergie solaire en Centrafrique. Installations photovoltaïques et solutions énergétiques durables." />
        <meta name="keywords" content="énergie solaire Centrafrique, installation photovoltaïque, solutions énergétiques durables, SOL! RCA, kits solaires Bangui" />
      </Helmet>

      {/* Hero Banner */}
      <section className="relative h-[60vh] overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=2000" 
            alt="Centrafrique Solar Energy" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-secondary/60 backdrop-blur-[2px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tighter">
              Une vision durable pour la <span className="text-brand-primary">Centrafrique</span>
            </h1>
            <p className="text-xl text-gray-200 font-medium leading-relaxed">
              Nous construisons l'autonomie énergétique de demain, étape par étape, foyer par foyer.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-4">Notre Histoire</p>
              <h1 className="text-4xl md:text-6xl font-bold text-brand-secondary mb-8 leading-tight">
                Pionnier du solaire en République Centrafrique
              </h1>
              <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                <p>
                  Fondée avec la mission de démocratiser l'énergie en RCA, SOL! est devenue en quelques années l'acteur de référence pour les solutions énergétiques autonomes.
                </p>
                <p>
                  Dans un pays où l'accès à l'électricité reste un défi majeur, nous croyons fermement que le soleil centrafricain est notre plus grande richesse. Nous transformons cette ressource naturelle en confort pour les familles et en productivité pour les entreprises.
                </p>
                <p>
                  Nos équipes sont composées d'ingénieurs et de techniciens locaux hautement qualifiés, formés aux dernières technologies photovoltaïques.
                </p>
              </div>
            </motion.div>
            
            <div className="relative">
              <div className="aspect-square bg-brand-primary/10 rounded-[4rem] absolute -bottom-10 -left-10 w-full h-full -z-10" />
              <img 
                src="https://images.unsplash.com/photo-1544725121-be3b54124cb2?auto=format&fit=crop&q=60&w=800" 
                alt="Our Team" 
                className="w-full h-full object-cover rounded-[4rem] shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-32 bg-brand-secondary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl -ml-48 -mb-48" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ y: i % 2 === 0 ? y1 : y2 }}
                className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm"
              >
                <div className="bg-brand-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-primary">
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-4xl font-black mb-2 tracking-tight">{stat.value}</div>
                <div className="text-gray-400 text-xs font-black uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-32 bg-brand-neutral/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <p className="text-brand-primary font-bold uppercase tracking-[0.3em] text-xs mb-4">Fondations</p>
            <h2 className="text-4xl font-black text-brand-secondary tracking-tighter">Nos Valeurs</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: "Excellence Technique", 
                desc: "Nous ne faisons aucun compromis sur la qualité du matériel et de l'installation.",
                icon: ShieldCheck
              },
              { 
                title: "Engagement Local", 
                desc: "Nous employons et formons des techniciens centrafricains pour un impact durable.",
                icon: Users
              },
              { 
                title: "Innovation Durable", 
                desc: "Nous apportons les dernières technologies solaires pour les défis de demain.",
                icon: Rocket
              }
            ].map((v, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-12 rounded-[3.5rem] shadow-xl shadow-brand-secondary/5 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-[4rem] group-hover:bg-brand-primary/10 transition-colors" />
                <motion.div 
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="w-16 h-16 bg-brand-neutral rounded-2xl flex items-center justify-center mb-8 text-brand-primary"
                >
                  <v.icon className="h-8 w-8" />
                </motion.div>
                <h4 className="text-2xl font-black text-brand-secondary mb-4 tracking-tight">{v.title}</h4>
                <p className="text-gray-500 leading-relaxed font-medium">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-4">Témoignages</p>
            <h2 className="text-3xl font-bold text-brand-secondary">Ils nous font confiance</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-brand-neutral p-10 rounded-[3rem] relative overflow-hidden"
              >
                <Quote className="absolute top-10 right-10 h-16 w-16 text-brand-primary/10 -rotate-12" />
                <div className="flex gap-1 mb-6 text-brand-primary">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-xl text-brand-secondary/80 italic leading-relaxed mb-8 relative z-10">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center font-bold text-brand-secondary">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-secondary">{testimonial.name}</h4>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Client Vérifié</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-brand-secondary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 border-8 border-brand-primary rounded-full -ml-32 -mt-32" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-8 border-brand-primary rounded-full -mr-48 -mb-48" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter">
              Prêt à passer à l'énergie <span className="text-brand-primary">propre ?</span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 font-medium">
              Obtenez une étude personnalisée et gratuite pour votre domicile ou votre entreprise.
            </p>
            <Link 
              to="/contact"
              className="inline-flex items-center gap-4 bg-brand-primary text-brand-secondary px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-brand-primary/20"
            >
              Demander un devis gratuit <ArrowRight className="h-6 w-6" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
