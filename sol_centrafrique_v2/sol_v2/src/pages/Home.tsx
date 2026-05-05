import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, ShieldCheck, Leaf, Star, Phone, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { SERVICES, PROJECTS, TESTIMONIALS } from '../constants';
import { Link } from 'react-router-dom';
import OptimizedImage from '../components/OptimizedImage';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?auto=format&fit=crop&q=65&w=1600",
    title: "L'énergie solaire pour tous",
    subtitle: "Économisez, écologisez, profitez. Installation et maintenance experte en Centrafrique."
  },
  {
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=65&w=1600",
    title: "Illuminez votre Avenir avec SOL!",
    subtitle: "Villas, commerces, ou centres de santé : nous électrifions vos projets avec excellence."
  },
  {
    image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&q=65&w=1600",
    title: "Expertise Solaire à Bangui",
    subtitle: "Une maintenance garantie et des composants premium pour une sérénité sur le long terme."
  }
];

function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) setItemsPerPage(3);
      else if (window.innerWidth >= 768) setItemsPerPage(2);
      else setItemsPerPage(1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.ceil(TESTIMONIALS.length / itemsPerPage);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalPages]);

  const visibleTestimonials = TESTIMONIALS.slice(
    currentIndex * itemsPerPage,
    (currentIndex * itemsPerPage) + itemsPerPage
  );

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="wait">
          {visibleTestimonials.map((t, idx) => (
            <motion.div
              key={`${currentIndex}-${t.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white p-10 rounded-[3rem] shadow-xl shadow-brand-secondary/5 border border-gray-100 flex flex-col items-center text-center relative"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${i < t.rating ? 'text-brand-primary fill-brand-primary' : 'text-gray-200'}`} 
                  />
                ))}
              </div>
              
              <Quote className="h-10 w-10 text-brand-primary/10 absolute top-8 left-8" />
              
              <blockquote className="text-lg font-medium text-brand-secondary italic mb-10 leading-relaxed flex-1">
                "{t.text}"
              </blockquote>

              <div className="flex items-center gap-4 mt-auto">
                <div className="w-14 h-14 bg-brand-neutral rounded-full flex items-center justify-center font-black text-brand-secondary text-xl border-4 border-white shadow-md">
                  {t.name.charAt(0)}
                </div>
                <div className="text-left">
                  <cite className="not-italic font-black text-brand-secondary text-lg">{t.name}</cite>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Client SOL!</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center items-center gap-6 mt-12">
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)}
          className="w-12 h-12 rounded-2xl bg-white shadow-xl text-brand-secondary flex items-center justify-center hover:bg-brand-primary transition-all active:scale-90"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-8 bg-brand-primary' : 'w-2 bg-gray-200 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % totalPages)}
          className="w-12 h-12 rounded-2xl bg-white shadow-xl text-brand-secondary flex items-center justify-center hover:bg-brand-primary transition-all active:scale-90"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <div className="pt-20">
      {/* Hero Section with Carousel */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-brand-secondary/60 backdrop-blur-[2px] z-[1]" />
              <img 
                src={HERO_SLIDES[currentSlide].image} 
                className="w-full h-full object-cover"
                style={{ filter: 'brightness(0.7)' }}
                alt="Installation SOL!"
              />
          </motion.div>
        </AnimatePresence>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`content-${currentSlide}`}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl"
            >
              <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] mb-8 tracking-tighter">
                {HERO_SLIDES[currentSlide].title}<span className="text-brand-primary">!</span>
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl font-light">
                {HERO_SLIDES[currentSlide].subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/contact" 
                  className="bg-brand-primary text-brand-secondary px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  Obtenir mon devis gratuit
                </Link>
                <Link 
                  to="/portfolio" 
                  className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  Nos réalisations
                </Link>
              </div>
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={() => {
                  const el = document.getElementById('latest-news');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-8 text-white/60 hover:text-white font-bold flex items-center gap-2 group transition-colors"
              >
                Dernières Nouvelles <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Controls */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 z-20">
          <div className="flex gap-2">
            <button 
              onClick={prevSlide}
              className="p-3 rounded-full bg-white/10 hover:bg-brand-primary hover:text-brand-secondary text-white backdrop-blur-md transition-all border border-white/10"
              aria-label="Slide précédente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={nextSlide}
              className="p-3 rounded-full bg-white/10 hover:bg-brand-primary hover:text-brand-secondary text-white backdrop-blur-md transition-all border border-white/10"
              aria-label="Slide suivante"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-8 bg-brand-primary" : "w-2 bg-white/30"
                }`}
                aria-label={`Aller à la slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Why Solar? */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-brand-primary font-bold uppercase tracking-[0.3em] text-sm mb-4"
            >
              Énergie Infinie
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-brand-secondary tracking-tighter"
            >
              Pourquoi passer au solaire<span className="text-brand-primary"> ?</span>
            </motion.h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Zap, 
                title: 'Économies Réelles', 
                desc: 'Réduisez vos factures d\'électricité jusqu\'à 80% dès le premier mois d\'installation.',
                color: 'bg-brand-primary/10 text-brand-primary'
              },
              { 
                icon: ShieldCheck, 
                title: 'Fiabilité Totale', 
                desc: 'Fini les coupures de courant. Profitez d\'une énergie stable 24h/24, même la nuit.',
                color: 'bg-brand-accent/10 text-brand-accent'
              },
              { 
                icon: Leaf, 
                title: 'Engagement Nature', 
                desc: 'Utilisez une énergie 100% propre pour protéger la biodiversité de notre pays.',
                color: 'bg-brand-secondary/10 text-brand-secondary'
              }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                whileHover={{ y: -10 }}
                className="bg-brand-neutral/40 p-10 rounded-[3rem] border border-transparent hover:border-brand-primary/20 hover:bg-white hover:shadow-2xl transition-all group"
              >
                <div className={`inline-flex p-5 rounded-2xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform ${item.color}`}>
                  <item.icon className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-black text-brand-secondary mb-4 tracking-tight">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-brand-neutral/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl -ml-48 -mb-48" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-brand-primary font-bold uppercase tracking-[0.3em] text-sm mb-4"
            >
              Témoignages
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-brand-secondary tracking-tighter"
            >
              Ils nous font confiance<span className="text-brand-primary">.</span>
            </motion.h2>
          </div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* Latest News */}
      <section id="latest-news" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-2">Le Blog</p>
              <h2 className="text-3xl md:text-5xl font-black text-brand-secondary tracking-tighter">Dernières Nouvelles</h2>
            </div>
            <Link to="/blog" className="text-brand-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
              Toutes les actualités <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Le solaire en RCA : Quel avenir ?",
                date: "05 Avril 2026",
                image: "https://images.unsplash.com/photo-1466611653911-95282ee36567?auto=format&fit=crop&q=60&w=800",
                cat: "Actualités"
              },
              {
                title: "Choisir sa puissance solaire",
                date: "12 Avril 2026",
                image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=60&w=800",
                cat: "Guides"
              },
              {
                title: "Maintenance préventive à Bangui",
                date: "28 Mars 2026",
                image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=60&w=800",
                cat: "Entretien"
              }
            ].map((post, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
              >
                <Link to="/blog">
                  <div className="relative h-64 rounded-3xl overflow-hidden mb-6">
                    <OptimizedImage 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full" 
                      imgClassName="group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black text-brand-secondary uppercase tracking-widest">{post.cat}</div>
                  </div>
                  <p className="text-xs font-bold text-gray-400 mb-2">{post.date}</p>
                  <h3 className="text-xl font-black text-brand-secondary group-hover:text-brand-primary transition-colors leading-tight">{post.title}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-primary rounded-[3rem] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            <h2 className="text-4xl md:text-5xl font-bold text-brand-secondary mb-6">Prêt à passer au solaire ?</h2>
            <p className="text-lg text-brand-secondary/80 mb-10 max-w-2xl mx-auto">
              Contactez-nous aujourd'hui pour une étude de faisabilité gratuite et découvrez comment vous pouvez devenir autonome.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/contact" 
                className="bg-brand-secondary text-white px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-xl"
              >
                Demander mon devis
              </Link>
              <a 
                href="tel:+23670000000" 
                className="bg-white text-brand-secondary px-10 py-5 rounded-full font-bold text-xl hover:bg-brand-neutral transition-all flex items-center justify-center gap-2"
              >
                <Phone className="h-6 w-6" /> Appeler SOL!
              </a>
            </div>
            <p className="mt-8 text-brand-secondary font-semibold">+236 XX XX XX XX</p>
          </div>
        </div>
      </section>
    </div>
  );
}
