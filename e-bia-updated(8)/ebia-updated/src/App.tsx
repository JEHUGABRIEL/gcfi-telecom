import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Menu,
  X,
  Play,
  ChevronRight,
  Facebook,
  Twitter,
  Instagram
} from 'lucide-react';
import React, { useState } from 'react';

// Import pages
import ArtistDirectory from './pages/ArtistDirectory';
import ArtistDashboard from './pages/Dashboard';
import Events from './pages/Events';
import ArtistDetail from './pages/ArtistDetail';
import Login from './pages/Login';
import ListenerDashboard from './pages/ListenerDashboard';
import Forum from './pages/Forum';
import ForumThreadDetail from './pages/ForumThreadDetail';
import VirtualConcerts from './pages/VirtualConcerts';
import ConcertLive from './pages/ConcertLive';
import Achievements from './pages/Achievements';
import { AudioPlayer } from './components/AudioComponents';
import { useAppState } from './context/AppStateContext';
import { User as UserIcon, Bell, Sun, Moon, Users, Video, Award } from 'lucide-react';
import { ThemeToggle, NotificationCenter } from './components/NavigationComponents';

// Landing Section defined here for now
const Landing = () => (
  <div className="flex flex-col min-h-screen transition-colors">
    {/* Hero Section */}
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-[#080808]">
      <div className="absolute inset-0 z-0 opacity-50">
        <div className="absolute inset-0 bg-radial-[circle_at_50%_50%] from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <div className="container mx-auto px-6 relative z-10 pt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center"
        >
          <span className="inline-block py-2 px-6 rounded-2xl bg-primary/5 text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-8 border border-primary/20 shadow-sm shadow-primary/5">
            E-Bia - La Pulsation Musicale de la RCA
          </span>
          <h1 className="text-6xl md:text-9xl font-display uppercase leading-[0.85] tracking-tighter mb-10 bg-gradient-to-b from-zinc-900 dark:from-white via-zinc-800 dark:via-zinc-200 to-zinc-400 dark:to-zinc-500 bg-clip-text text-transparent italic">
            Propulser la Musique <br /> Centrafricaine au <br /> 
            <span className="text-primary not-italic">Sommet Mondial</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto mb-16 leading-relaxed font-light">
            E-Bia est la plateforme digitale n°1 de la RCA. 
            Découvrez une culture riche, soutenez nos talents et vibrez au son de l'Afrique Centrale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16">
            <Link to="/explore" className="w-full sm:w-auto px-10 py-5 bg-primary text-white font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 rounded-2xl shadow-xl shadow-primary/25">
              Découvrir les Artistes <ChevronRight size={18} />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 rounded-2xl text-zinc-900 dark:text-white shadow-lg">
              Rejoindre E-Bia
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-0 left-0 w-full border-t border-zinc-100 dark:border-zinc-900 bg-white/40 dark:bg-black/40 backdrop-blur-2xl">
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="text-center md:text-left group cursor-default">
              <div className="text-4xl font-display text-primary transition-transform group-hover:-translate-y-1">19</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold mt-1">Artistes</div>
            </div>
            <div className="text-center md:text-left group cursor-default">
              <div className="text-4xl font-display text-secondary dark:text-blue-300 transition-transform group-hover:-translate-y-1">54</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold mt-1">Titres</div>
            </div>
            <div className="text-center md:text-left group cursor-default">
              <div className="text-4xl font-display text-accent transition-transform group-hover:-translate-y-1">2026</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold mt-1">Année de lancement</div>
            </div>
            <div className="text-center md:text-left group cursor-default">
              <div className="text-4xl font-display text-zinc-900 dark:text-white transition-transform group-hover:-translate-y-1">RCA</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold mt-1">Pays d'origine</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Section: Mission */}
    <section className="py-32 bg-white dark:bg-[#080808] text-zinc-900 dark:text-white transition-colors relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-zinc-50 dark:bg-white/[0.02] transform skew-x-12 translate-x-1/2" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-6 block">NOTRE ENGAGEMENT</span>
            <h2 className="text-6xl md:text-7xl font-display uppercase leading-[0.9] mb-10 italic">
              Une Nouvelle Ère <br /> pour notre <br /> <span className="text-primary">Culture</span>
            </h2>
            <div className="space-y-8 text-xl text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">
              <p>
                E-Bia digitalise l'industrie musicale centrafricaine pour offrir aux artistes les outils nécessaires à leur succès. 
                De Bangui au reste du monde, nous brisons les frontières physiques par la technologie.
              </p>
              <ul className="space-y-6">
                {[
                  "Distribution sur Spotify, Apple Music & YouTube",
                  "Gestion automatisée des droits d'auteur en RCA",
                  "Analytics en temps réel par chanson et région",
                  "Paiements Mobile Money directs et sécurisés"
                ].map((item, idx) => (
                  <motion.li 
                    key={idx} 
                    whileHover={{ x: 10 }}
                    className="flex items-center gap-4 group cursor-default"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 transition-colors group-hover:bg-primary group-hover:text-white">
                      <ChevronRight size={16} className="text-primary group-hover:text-white" />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative aspect-square md:aspect-video bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 overflow-hidden group rounded-[48px] shadow-2xl">
            <img 
              src="/artists/veyzo.png" 
              alt="Music Performance" 
              className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:scale-105 group-hover:brightness-100 transition-all duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileActive={{ scale: 0.9 }}
                className="w-24 h-24 rounded-full bg-white text-primary flex items-center justify-center shadow-2xl transition-transform"
              >
                <Play fill="currentColor" size={32} className="ml-1" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, authReady, unreadMessagesCount } = useAppState();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900 transition-colors">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:bg-primary/90 transition-colors shadow-lg shadow-primary/10">
            <Music className="text-white" size={20} />
          </div>
          <div className="text-zinc-900 dark:text-white transition-colors">
            <span className="block font-display text-2xl leading-none tracking-tighter uppercase italic">E-BIA</span>
            <span className="block text-[8px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold">RCA Music</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-6 mr-4 pr-8 border-r border-zinc-100 dark:border-zinc-900">
            <Link to="/explore" className="text-[10px] font-bold uppercase tracking-[0.15em] hover:text-primary transition-colors">Explorer</Link>
            <Link to="/events" className="text-[10px] font-bold uppercase tracking-[0.15em] hover:text-primary transition-colors">Événements</Link>
            <Link to="/forum" className="text-[10px] font-bold uppercase tracking-[0.15em] hover:text-primary transition-colors">Communauté</Link>
            <Link to="/virtual-concerts" className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary transition-opacity hover:opacity-80 flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" /> Concerts LIVE
            </Link>
          </div>

          <div className="flex items-center gap-3 mr-4">
             <ThemeToggle />
             {user && <NotificationCenter />}
          </div>

          <Link to="/dashboard" className="px-6 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white dark:hover:bg-zinc-800 transition-colors rounded-xl shadow-sm relative group">
            Artiste Portal
            {user && (unreadMessagesCount ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#0A0A0A] group-hover:scale-125 transition-transform" />
            )}
          </Link>
          
          {authReady && user ? (
            <Link to="/me" className="flex items-center gap-3 p-1 pr-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-primary transition-all shadow-sm">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300">Mon Espace</span>
            </Link>
          ) : (
            <Link to="/login" className="px-6 py-2.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all rounded-xl shadow-lg shadow-primary/10">
              Connexion
            </Link>
          )}
        </div>

        {/* Mobile/Tablet Menu Toggle */}
        <div className="flex items-center gap-4 lg:hidden">
          <ThemeToggle />
          <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-20 left-0 w-full bg-white dark:bg-black border-b border-zinc-100 dark:border-zinc-900 p-8 flex flex-col gap-8 shadow-2xl overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-6">
              <Link onClick={() => setIsOpen(false)} to="/explore" className="text-3xl font-display uppercase italic tracking-tighter text-zinc-900 dark:text-white">Explorer</Link>
              <Link onClick={() => setIsOpen(false)} to="/events" className="text-3xl font-display uppercase italic tracking-tighter text-zinc-900 dark:text-white">Événements</Link>
              <Link onClick={() => setIsOpen(false)} to="/forum" className="text-3xl font-display uppercase italic tracking-tighter text-zinc-900 dark:text-white">Communauté</Link>
              <Link onClick={() => setIsOpen(false)} to="/virtual-concerts" className="text-3xl font-display uppercase italic tracking-tighter text-primary">Live Concerts</Link>
            </div>
            
            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-4">
              <Link onClick={() => setIsOpen(false)} to="/dashboard" className="w-full py-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl text-center text-xs font-bold uppercase tracking-widest relative">
                Artiste Portal
                {user && (unreadMessagesCount ?? 0) > 0 && <span className="absolute top-4 right-8 w-2 h-2 bg-rose-500 rounded-full" />}
              </Link>
              {user ? (
                 <Link onClick={() => setIsOpen(false)} to="/me" className="w-full py-4 bg-primary text-white rounded-2xl text-center text-xs font-bold uppercase tracking-widest">Mon Espace</Link>
              ) : (
                 <Link onClick={() => setIsOpen(false)} to="/login" className="w-full py-4 bg-primary text-white rounded-2xl text-center text-xs font-bold uppercase tracking-widest">Connexion</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, authReady } = useAppState();
  const location = useLocation();

  if (!authReady) return <div className="min-h-screen bg-black flex items-center justify-center font-display uppercase tracking-widest text-zinc-500">Chargement...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="bg-white dark:bg-[#080808] min-h-screen text-zinc-900 dark:text-zinc-100 selection:bg-[#D4A83C] selection:text-white transition-colors relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-50 dark:opacity-20">
         <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <Routes>
        <Route path="/" element={<><Navbar /><main className="pt-20"><Landing /></main></>} />
        <Route path="/explore" element={<><Navbar /><main className="pt-20"><ArtistDirectory /></main></>} />
        <Route path="/artist/:id" element={<><Navbar /><main className="pt-20"><ArtistDetail /></main></>} />
        <Route path="/events" element={<><Navbar /><main className="pt-20"><Events /></main></>} />
        <Route path="/forum" element={<><Navbar /><main className="pt-20"><Forum /></main></>} />
        <Route path="/forum/thread/:threadId" element={<><Navbar /><main className="pt-20"><ForumThreadDetail /></main></>} />
        <Route path="/virtual-concerts" element={<><Navbar /><main className="pt-20"><VirtualConcerts /></main></>} />
        <Route path="/concert/live/:concertId" element={<ProtectedRoute><Navbar /><main className="pt-20"><ConcertLive /></main></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Navbar /><main className="pt-20"><Achievements /></main></ProtectedRoute>} />
        <Route path="/blog" element={<><Navbar /><main className="pt-20"><div className="container mx-auto p-20 text-center font-display text-4xl text-zinc-400 uppercase tracking-widest">Actualités (À venir)</div></main></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/me" element={<ProtectedRoute><Navbar /><ListenerDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/*" element={<ProtectedRoute><ArtistDashboard /></ProtectedRoute>} />
      </Routes>
      
      {!isDashboard && (
        <footer className="bg-white dark:bg-[#080808] border-t border-zinc-100 dark:border-zinc-900 py-20 pb-32 md:pb-24 transition-colors relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
              <div className="col-span-1 md:col-span-2">
                <Link to="/" className="flex items-center gap-3 mb-8 group">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-xl shadow-primary/10">
                    <Music className="text-white" size={24} />
                  </div>
                  <span className="font-display text-3xl tracking-tighter uppercase text-zinc-900 dark:text-white italic">E-BIA</span>
                </Link>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-10 leading-relaxed font-light text-lg">
                  E-Bia œuvre pour l'excellence artistique
                  et le rayonnement de la culture centrafricaine à travers le monde.
                </p>
                <div className="flex gap-4">
                  {[Facebook, Twitter, Instagram].map((Icon, i) => (
                    <div key={i} className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer shadow-sm group">
                      <Icon size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-400 dark:text-zinc-500 mb-8 flex items-center gap-2">
                  <div className="w-4 h-[2px] bg-primary" /> Plateforme
                </h4>
                <ul className="space-y-5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <li><Link to="/explore" className="hover:text-primary transition-colors">Artistes</Link></li>
                  <li><Link to="/events" className="hover:text-primary transition-colors">Événements</Link></li>
                  <li><Link to="/about" className="hover:text-primary transition-colors">Notre Mission</Link></li>
                  <li><Link to="/support" className="hover:text-primary transition-colors">Aide & Support</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-400 dark:text-zinc-500 mb-8 flex items-center gap-2">
                  <div className="w-4 h-[2px] bg-secondary" /> Contact
                </h4>
                <ul className="space-y-5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <li className="flex flex-col gap-1">
                    <span className="text-[8px] text-zinc-400">Siège Social</span>
                    Bangui, RCA
                  </li>
                  <li className="flex flex-col gap-1 text-primary">
                    <span className="text-[8px] text-zinc-400 italic">Email Support</span>
                    contact@e-bia.rca
                  </li>
                  <li className="flex flex-col gap-1">
                    <span className="text-[8px] text-zinc-400">Presse</span>
                    media@e-bia.rca
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-20 pt-10 border-t border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">© 2026 E-Bia - La Pulsation Musicale. <br className="md:hidden"/> Fait avec passion en RCA.</p>
              <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">
                <span className="hover:text-primary cursor-pointer transition-colors">Confidentialité</span>
                <span className="hover:text-primary cursor-pointer transition-colors">Conditions</span>
              </div>
            </div>
          </div>
        </footer>
      )}
      {!isDashboard && <AudioPlayer />}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
