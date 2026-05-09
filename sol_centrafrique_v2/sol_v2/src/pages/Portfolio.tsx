import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Info, ChevronLeft, ChevronRight, Maximize2, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchProjects } from '../services/adminService';
import { Project } from '../types';
import OptimizedImage from '../components/OptimizedImage';

const categories = [
  { id: 'all', name: 'Tous les projets' },
  { id: 'residential', name: 'Résidentiel' },
  { id: 'commercial', name: 'Commercial' },
  { id: 'institutional', name: 'Institutionnel' },
];

export default function Portfolio() {
  const [filter, setFilter] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  // User auth removed
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const paginate = (newDirection: number) => {
    if (!selectedProject?.images) return;
    setDirection(newDirection);
    setActiveImageIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = selectedProject.images!.length - 1;
      if (nextIndex >= selectedProject.images!.length) nextIndex = 0;
      return nextIndex;
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedProject && selectedProject.images && selectedProject.images.length > 1 && autoplay && !isZoomed) {
      interval = setInterval(() => {
        paginate(1);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [selectedProject, selectedProject?.images, autoplay, isZoomed]);

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.category === filter);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setActiveImageIndex(0);
    setIsZoomed(false);
    setDirection(0);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-brand-accent font-bold uppercase tracking-widest text-sm mb-2" aria-hidden="true">Notre Impact</p>
          <h1 className="text-4xl md:text-5xl font-bold text-brand-secondary mb-6">Des réalisations au service de la Centrafrique</h1>
          <p className="text-gray-600 mb-12">
            Découvrez comment nous aidons les foyers et les entreprises à Bangui et en province à atteindre l'autonomie énergétique.
          </p>
        </div>

        {/* Filters */}
        <nav aria-label="Filtrer les projets par catégorie" className="flex flex-wrap gap-4 mb-16">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setFilter(cat.id);
              }}
              aria-pressed={filter === cat.id}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${
                filter === cat.id 
                  ? 'bg-brand-primary text-brand-secondary shadow-lg shadow-brand-primary/20' 
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-brand-primary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-4" />
            <p className="text-gray-500 font-bold">Chargement des réalisations...</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode='popLayout'>
              {filteredProjects.map((project, idx) => (
                <motion.div
                  layout
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ 
                    duration: 0.4,
                    delay: idx * 0.05,
                    layout: { duration: 0.3 }
                  }}
                  onClick={() => handleProjectSelect(project)}
                  className="group cursor-pointer relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-100 focus-within:ring-4 focus-within:ring-brand-primary/20 outline-none"
                  role="button"
                  aria-label={`Voir les détails du projet: ${project.title}`}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleProjectSelect(project)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <OptimizedImage 
                      src={project.image} 
                      alt={`Installation solaire: ${project.title}`} 
                      className="w-full h-full"
                      imgClassName="group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-brand-secondary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white text-brand-secondary px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                        <Info className="h-4 w-4" /> Détails
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-brand-accent text-xs font-bold uppercase tracking-wider">
                        {categories.find(c => c.id === project.category)?.name}
                      </span>
                      <span className="text-brand-primary font-bold text-xs">{project.roi}</span>
                    </div>
                    <h3 className="text-xl font-bold text-brand-secondary mb-4">{project.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{project.description}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        
        {!isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-24 text-gray-400" role="status">
            Aucun projet dans cette catégorie pour le moment.
          </div>
        )}
      </div>

      {/* Project Modal */}
      <AnimatePresence>
        {selectedProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="fixed inset-0 bg-brand-secondary/90 backdrop-blur-md z-[60]"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 md:inset-4 md:inset-x-auto md:top-[10vh] md:bottom-[10vh] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-5xl bg-white md:rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] z-[70] overflow-hidden flex flex-col lg:flex-row"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-brand-primary text-white hover:text-brand-secondary rounded-2xl transition-all z-[80] shadow-xl backdrop-blur-md"
                aria-label="Fermer le modal"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Gallery Section */}
              <div className="flex-1 h-2/5 lg:h-auto overflow-hidden relative group bg-brand-neutral">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={activeImageIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500;
                      if (swipe) {
                        paginate(offset.x > 0 ? -1 : 1);
                      }
                    }}
                    className="absolute inset-0 cursor-zoom-in"
                    onClick={() => setIsZoomed(!isZoomed)}
                  >
                    <motion.div
                      animate={{ scale: isZoomed ? 1.5 : 1 }}
                      transition={{ type: 'spring', damping: 25 }}
                      className="w-full h-full"
                    >
                      <OptimizedImage 
                        src={selectedProject.images ? selectedProject.images[activeImageIndex] : selectedProject.image} 
                        alt={`${selectedProject.title} view ${activeImageIndex + 1}`}
                        className={`w-full h-full ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                      />
                    </motion.div>
                  </motion.div>
                </AnimatePresence>

                {!isZoomed && (
                  <>
                    {selectedProject.images && selectedProject.images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            paginate(-1);
                          }}
                          className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur-xl p-3 md:p-5 rounded-2xl md:rounded-3xl text-brand-secondary hover:bg-brand-primary hover:scale-110 active:scale-95 transition-all shadow-2xl z-[75] border border-white/20 hidden md:block"
                        >
                          <ChevronLeft className="h-8 w-8" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            paginate(1);
                          }}
                          className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur-xl p-3 md:p-5 rounded-2xl md:rounded-3xl text-brand-secondary hover:bg-brand-primary hover:scale-110 active:scale-95 transition-all shadow-2xl z-[75] border border-white/20 hidden md:block"
                        >
                          <ChevronRight className="h-8 w-8" />
                        </button>
                      </>
                    )}

                    {/* Thumbnail strips / Indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {selectedProject.images?.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i); }}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            i === activeImageIndex 
                              ? 'w-8 bg-brand-primary shadow-[0_0_10px_rgba(253,185,19,0.5)]' 
                              : 'w-2 bg-white/50 hover:bg-white'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="absolute top-8 left-8 bg-brand-secondary/60 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10 pointer-events-none">
                      <Maximize2 className="h-4 w-4" /> {isZoomed ? 'Zoom Activé' : 'Swipe/Cliquez pour Zoomer'}
                    </div>
                    
                    {selectedProject.images && selectedProject.images.length > 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setAutoplay(!autoplay); }}
                        className="absolute top-8 right-20 md:right-24 bg-brand-secondary/60 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10 hover:bg-brand-primary hover:text-brand-secondary transition-all"
                      >
                        {autoplay ? 'Pause' : 'Lecture'}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Details Section */}
              <div className="flex-1 p-10 md:p-14 overflow-y-auto bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-brand-primary text-brand-secondary px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20">
                    {categories.find(c => c.id === selectedProject.category)?.name}
                  </span>
                </div>
                <h2 id="modal-title" className="text-4xl md:text-5xl font-black text-brand-secondary mb-8 leading-tight tracking-tight">
                  {selectedProject.title}
                </h2>
                
                <div className="bg-brand-neutral p-8 rounded-[2rem] mb-10 flex items-center gap-6 border border-gray-100">
                  <div className="bg-brand-primary p-4 rounded-2xl shadow-xl shadow-brand-primary/20">
                    <TrendingUp className="h-8 w-8 text-brand-secondary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Impact & Économies</p>
                    <p className="text-brand-secondary font-black text-xl">{selectedProject.roi}</p>
                  </div>
                </div>

                <div className="prose prose-lg mb-10">
                  <h3 className="text-brand-secondary font-black text-2xl mb-4 tracking-tight">À propos de ce projet</h3>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    {selectedProject.description} 
                  </p>
                  <p className="text-gray-500 mt-4 italic">
                    SOL! Centrafrique a déployé son expertise technique pour garantir une fiabilité maximale. Chaque composant a été testé pour résister aux conditions climatiques de Bangui et des provinces.
                  </p>
                </div>

                <div className="space-y-6">
                  <h4 className="font-black text-brand-secondary uppercase text-sm tracking-widest">Équipements Installés :</h4>
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: 'Panneaux Tier 1', detail: 'Haute Efficacité' },
                      { label: 'Onduleur Hybride', detail: 'Intelligent' },
                      { label: 'Batteries Lithium', detail: 'Longue Durée' },
                      { label: 'Cloud Monitoring', detail: 'Suivi 24/7' }
                    ].map((spec, i) => (
                      <div key={i} className="flex flex-col p-4 rounded-2xl bg-brand-neutral border border-gray-100">
                        <span className="text-brand-secondary font-black text-sm">{spec.label}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{spec.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      if (false) {
                        navigate('/contact');
                        return;
                      }
                      // In a real app, this would open a lead form
                      alert('Votre demande a été envoyée ! Un expert SOL! vous contactera sous 24h.');
                    }}
                    className="w-full bg-brand-secondary text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-brand-secondary transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 group"
                  >
                    
                    'Demander une étude similaire'
                  </button>
                  {false && (
                    <p className="text-center text-xs text-gray-400 mt-4 font-bold">
                      Identifiez-vous pour accéder à nos services professionnels.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
