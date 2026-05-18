import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ShoppingBag, GraduationCap, Newspaper, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/shared/lib/utils';
import { supabase } from '@/shared/lib/supabase';
import type { Product, Course, AppModule } from '@/shared/types';


const MODULE_ROUTES: Record<string, string> = { store: '/boutique', training: '/formation', home: '/', admin: '/admin', profile: '/profil' };

interface SearchResult {
  id: string;
  title: string;
  type: 'product' | 'course' | 'news';
  module?: AppModule;
  url?: string;
  image?: string;
}

interface GlobalSearchProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function GlobalSearch({ isOpen: externalIsOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  const setIsOpen = (val: boolean) => {
    if (onClose && !val) onClose();
    setInternalIsOpen(val);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [allCourses, setAllCourses] = React.useState<Course[]>([]);

  React.useEffect(() => {
    Promise.all([
      supabase.from('products').select('id, name, description, category, price, image'),
      // ✅ select('*') → évite 400 si colonnes image/tags absentes dans la table trainings
      supabase.from('trainings').select('*')
    ]).then(([{ data: prods }, { data: trains }]) => {
      setAllProducts((prods || []) as Product[]);
      setAllCourses((trains || []) as Course[]);
    });
  }, []);

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);

  React.useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [
      ...allProducts
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase()))
        .map(p => ({ id: p.id, title: p.name, type: 'product' as const, module: 'store' as AppModule, image: p.image })),
      ...allCourses
        .filter(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase()))
        .map(c => ({ id: c.id, title: c.title, type: 'course' as const, module: 'training' as AppModule, image: c.image })),
    ];

    setResults(searchResults.slice(0, 5));
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.module) {
      // ✅ Passer l'ID pour permettre le scroll/highlight côté destination
      const base = MODULE_ROUTES[result.module] ?? '/';
      navigate(`${base}?item=${result.id}`);
    } else if (result.url) {
      window.open(result.url, '_blank');
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative">
      {externalIsOpen === undefined && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 hover:border-[#C1272D]/50 transition-all group lg:min-w-[300px] shadow-sm"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-[#C1272D] transition-colors" />
          <span className="text-xs text-slate-400 font-medium">Rechercher...</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded ml-auto uppercase">
            Ctrl K
          </kbd>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <Search className="w-6 h-6 text-[#C1272D]" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Que cherchez-vous ?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4">
                {results.length > 0 ? (
                  <div className="space-y-2">
                    {results.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSelect(result)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-white dark:hover:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all text-left group shadow-sm hover:shadow-md"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                          <img 
                            src={result.image || 'https://picsum.photos/seed/search/100/100'} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {result.type === 'product' && <ShoppingBag className="w-3 h-3 text-blue-500" />}
                            {result.type === 'course' && <GraduationCap className="w-3 h-3 text-green-500" />}
                            {result.type === 'news' && <Newspaper className="w-3 h-3 text-[#C1272D]" />}
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {result.type === 'product' ? 'Boutique' : result.type === 'course' ? 'Formation' : 'Actualité'}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">
                            {result.title}
                          </h4>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#C1272D] group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                ) : query.length >= 2 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-50 dark:border-transparent shadow-sm">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">Aucun résultat pour "{query}"</p>
                  </div>
                ) : (
                  <div className="py-8 px-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Suggestions</p>
                    <div className="grid grid-cols-2 gap-3">
                      {['MikroTik', 'Wifi Zone', 'Cybersécurité', 'Formation IT'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setQuery(tag)}
                          className="px-4 py-3 bg-white dark:bg-slate-800 text-left rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-[#C1272D]/10 hover:text-[#C1272D] border border-slate-100 dark:border-transparent hover:border-[#C1272D]/20 transition-all shadow-sm"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Firme Gaveaux Christian Centrafrique
                </p>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                    <span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">Enter</span>
                    Sélectionner
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                    <span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">Esc</span>
                    Fermer
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
