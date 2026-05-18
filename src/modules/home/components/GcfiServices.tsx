import React from 'react';
import { motion } from 'motion/react';
import { 
  Network, 
  Video, 
  TrafficCone, 
  ShieldCheck, 
  KeySquare, 
  Construction, 
  Wifi, 
  Radio,
  ChevronRight,
  Globe,
  Lock,
  Zap,
  HardDrive,
  Truck,
  Gamepad2,
  LineChart,
  Megaphone,
  Palette,
  Play,
  Tv,
  Scissors,
  Clapperboard,
  Image as ImageIcon,
  Film,
  X,
  Maximize2,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { AnimatePresence } from 'motion/react';

const services = [
  {
    title: "Network (LAN, WAN, WIFI)",
    description: "Conception et mise en œuvre d'infrastructures réseaux robustes pour une connectivité optimale.",
    icon: Network,
    color: "blue",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/net1/800/600', title: 'Installation Baie de Brassage' },
      { type: 'image', url: 'https://picsum.photos/seed/net2/800/600', title: 'Audit Réseau' }
    ]
  },
  {
    title: "Services Hotspot & WiFi Zone",
    description: "WiFi communautaire, universitaire, hôtels, bar... Portail captif personnalisé et gestion de tickets.",
    icon: Wifi,
    color: "sky",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/wifi1/800/600', title: 'WiFi Zone Bangui' },
      { type: 'image', url: 'https://picsum.photos/seed/wifi2/800/600', title: 'Portail Captif' }
    ]
  },
  {
    title: "Déploiement Fibres Optiques",
    description: "Installation et raccordement de fibre optique pour des liaisons ultra-rapides.",
    icon: Zap,
    color: "emerald",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/fiber1/800/600', title: 'Soudure Optique' },
      { type: 'image', url: 'https://picsum.photos/seed/fiber2/800/600', title: 'Tirage de Câble' }
    ]
  },
  {
    title: "Vidéosurveillance (CCTV)",
    description: "Systèmes de surveillance intelligente et protection de vos locaux 24h/24.",
    icon: Video,
    color: "red",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/cctv1/800/600', title: 'Caméras IP' },
      { type: 'image', url: 'https://picsum.photos/seed/cctv2/800/600', title: 'Centre de Monitoring' }
    ]
  },
  {
    title: "Installation Starlink",
    description: "Accès internet par satellite haute performance pour les zones même les plus reculées.",
    icon: Globe,
    color: "indigo",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/starlink1/800/600', title: 'Antenne Starlink' },
      { type: 'image', url: 'https://picsum.photos/seed/starlink2/800/600', title: 'Débit 200 Mbps' }
    ]
  },
  {
    title: "Sécurité & Cyber-sécurité",
    description: "Protection contre les cybermenaces et audit de vulnérabilité de vos systèmes.",
    icon: Lock,
    color: "slate",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/cyber1/800/600', title: 'Audit SOC' }
    ]
  },
  {
    title: "Feux Tricolores & Signalisation",
    description: "Installation et maintenance de systèmes de signalisation routière intelligente.",
    icon: TrafficCone,
    color: "orange",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/traffic1/800/600', title: 'Feux Solaires' },
      { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', title: 'Test Système' }
    ]
  },
  {
    title: "Barrières Levantes & Accès",
    description: "Automatisation du contrôle des accès véhicules pour sites sensibles et parkings.",
    icon: Construction,
    color: "amber",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/barrier1/800/600', title: 'Barrière RFID' }
    ]
  },
  {
    title: "Poste de Pesage & Péage",
    description: "Systèmes automatisés de gestion de trafic, pesage et péage routier.",
    icon: Truck,
    color: "pink",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/toll1/800/600', title: 'Station de Pesage' }
    ]
  },
  {
    title: "Vente d'Équipements Telecoms",
    description: "Vente de matériel certifié : routeurs, antennes, câblage et serveurs.",
    icon: HardDrive,
    color: "rose"
  },
  {
    title: "Liaisons Hertziennes P2P",
    description: "Expertise sur Ubiquiti, Mikrotik et TP-link pour liaisons point-à-point.",
    icon: Radio,
    color: "purple",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/radio1/800/600', title: 'Liaison 50km' }
    ]
  }
];

const digitalServices = [
  {
    title: "Gestion de Contenu Web",
    description: "Administration de plateformes CMS, création d'articles et mise à jour de vos actifs numériques.",
    icon: Palette,
    color: "pink",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/web1/800/600', title: 'Port Folio Client' }
    ]
  },
  {
    title: "SEO & Référencement",
    description: "Optimisation pour les moteurs de recherche afin d'accroître votre visibilité organique sur le web.",
    icon: LineChart,
    color: "amber"
  },
  {
    title: "Campagnes Marketing Digital",
    description: "Gestion de publicités Google Ads, Social Ads et stratégies d'acquisition ciblées.",
    icon: Megaphone,
    color: "emerald"
  }
];

const videoServices = [
  {
    title: "Production Vidéo",
    description: "Réalisation de spots publicitaires, documentaires et clips institutionnels en haute résolution.",
    icon: Clapperboard,
    color: "red",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/video1/800/600', title: 'Tournage Pub' },
      { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', title: 'Showreel' }
    ]
  },
  {
    title: "Streaming & Live",
    description: "Diffusion en direct d'événements, captation multi-caméras et régie mobile.",
    icon: Tv,
    color: "blue",
    gallery: [
      { type: 'image', url: 'https://picsum.photos/seed/live1/800/600', title: 'Direct TV' }
    ]
  },
  {
    title: "Montage & Post-prod",
    description: "Édition vidéo avancée, étalonnage, effets visuels et sound design pour vos contenus.",
    icon: Scissors,
    color: "purple"
  }
];

const colorClasses: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  slate: "bg-white text-slate-600 dark:bg-slate-900/20 dark:text-slate-400 border border-slate-50 dark:border-transparent",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
  pink: "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 font-bold",
  indigo_alt: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
};

export default function GcfiServices() {
  const [selectedGallery, setSelectedGallery] = React.useState<any[] | null>(null);
  const [activeMedia, setActiveMedia] = React.useState<any>(null);
  const [selectedService, setSelectedService] = React.useState<any | null>(null);

  const GalleryModal = () => (
    <AnimatePresence>
      {selectedService && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl"
          onClick={() => setSelectedService(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl p-10 relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute top-8 right-8 p-3 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className={cn(
              "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8",
              colorClasses[selectedService.color] || colorClasses.blue
            )}>
              <selectedService.icon className="w-10 h-10" />
            </div>

            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{selectedService.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8">
              {selectedService.description}
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 mb-8 border border-slate-100 dark:border-slate-700">
              <h4 className="font-black uppercase tracking-widest text-xs text-slate-400 mb-4">Pourquoi choisir GCFI ?</h4>
              <ul className="space-y-3">
                {[
                  "Expertise technique certifiée",
                  "Support client local 24h/7j",
                  "Infrastructures de haute disponibilité",
                  "Solution sur mesure adaptée à votre budget"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-[#C1272D]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => setSelectedService(null)}
              className="w-full bg-[#C1272D] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              Demander un devis
            </button>
          </motion.div>
        </motion.div>
      )}

      {selectedGallery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl"
          onClick={() => setSelectedGallery(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 w-full max-w-6xl rounded-[2.5rem] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Galerie de Réalisations</h3>
                <p className="text-slate-500 text-sm">Découvrez nos projets concrets et notre savoir-faire en action.</p>
              </div>
              <button 
                onClick={() => setSelectedGallery(null)}
                className="p-3 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedGallery.map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer border border-slate-200 dark:border-slate-700"
                    onClick={() => setActiveMedia(item)}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <Film className="w-12 h-12 text-white/50" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-12 h-12 text-white fill-current" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs font-black uppercase tracking-widest">{item.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeMedia && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/95"
          onClick={() => setActiveMedia(null)}
        >
          <button className="absolute top-8 right-8 text-white p-4">
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            {activeMedia.type === 'image' ? (
              <img src={activeMedia.url} alt="" className="w-full rounded-3xl" referrerPolicy="no-referrer" />
            ) : (
              <video src={activeMedia.url} controls autoPlay className="w-full rounded-3xl" />
            )}
            <p className="text-white text-center mt-6 text-xl font-bold">{activeMedia.title}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <section className="py-24 bg-white dark:bg-slate-900 transition-colors">
      <GalleryModal />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#C1272D] font-black uppercase tracking-[0.3em] text-xs mb-4 block">Expertise GCFI</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
            Un Large Éventail de <span className="text-[#C1272D]">Services</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            Nous combinons technologie de pointe et savoir-faire local pour répondre aux défis informatiques les plus complexes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-50 dark:border-transparent hover:border-[#C1272D]/20 hover:shadow-2xl hover:shadow-red-500/5 transition-all group shadow-sm"
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110",
                colorClasses[service.color] || colorClasses.blue
              )}>
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <service.icon className="w-7 h-7" />
                </motion.div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#C1272D] transition-colors line-clamp-1">
                {service.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2 italic">
                {service.description}
              </p>
              
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setSelectedService(service)}
                  className="flex items-center text-[10px] font-black uppercase tracking-widest text-[#C1272D] hover:gap-2 transition-all"
                >
                  En savoir plus <ChevronRight className="w-4 h-4 ml-1" />
                </button>
                {service.gallery && (
                  <button 
                    onClick={() => setSelectedGallery(service.gallery || null)}
                    className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-[#C1272D] hover:bg-red-50 transition-colors flex items-center gap-2 group/btn"
                    title="Voir la galerie"
                  >
                    <Maximize2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Réalisations</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* New Digital Services Section */}
        <div className="pt-20 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center mb-16">
            <span className="text-blue-500 font-black uppercase tracking-[0.3em] text-xs mb-4 block">Communication Digitale</span>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">
              Information & <span className="text-blue-500">Communication</span> Numérique
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              Boostez votre présence en ligne et engagez votre audience avec nos solutions de marketing et de contenu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {digitalServices.map((service, index) => (
              <motion.div
                key={`digital-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-50 dark:border-transparent hover:border-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group shadow-sm"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110",
                  colorClasses[service.color] || colorClasses.blue
                )}>
                  <div className="flex items-center justify-center">
                    <service.icon className="w-7 h-7" />
                  </div>
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-500 transition-colors">
                  {service.title}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 italic">
                  {service.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedService(service)}
                    className="flex items-center text-[10px] font-black uppercase tracking-widest text-blue-500 hover:gap-2 transition-all"
                  >
                    Explorer <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                  {service.gallery && (
                    <button 
                      onClick={() => setSelectedGallery(service.gallery || null)}
                      className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors group/btn"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* New Video Services Section */}
        <div className="pt-20 mt-20 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center mb-16">
            <span className="text-red-500 font-black uppercase tracking-[0.3em] text-xs mb-4 block">GCFI Studios</span>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">
              Services <span className="text-[#C1272D]">Vidéo</span> & Contenu
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              De la captation à la diffusion, nous donnons vie à vos projets audiovisuels avec une expertise technique inégalée.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {videoServices.map((service, index) => (
              <motion.div
                key={`video-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-50 dark:border-transparent hover:border-red-500/20 hover:shadow-2xl hover:shadow-red-500/5 transition-all group shadow-sm"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110",
                  colorClasses[service.color] || colorClasses.blue
                )}>
                  <div className="flex items-center justify-center">
                    <service.icon className="w-7 h-7" />
                  </div>
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-red-500 transition-colors">
                  {service.title}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 italic">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedService(service)}
                    className="flex items-center text-[10px] font-black uppercase tracking-widest text-red-500 hover:gap-2 transition-all"
                  >
                    Voir plus <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                  {service.gallery && (
                    <button 
                      onClick={() => setSelectedGallery(service.gallery || null)}
                      className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors group/btn"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
