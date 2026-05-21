import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Fuse from 'fuse.js';
import {
  ShoppingCart, Search, Filter, Star, ShoppingBag, X,
  Plus, Minus, Trash2, ArrowUpDown, TrendingUp, MessageSquare,
  AlertCircle, ChevronRight, Heart
} from 'lucide-react';
import { Product, CartItem } from '@/shared/types';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/context/AuthContext';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { useProducts, useSaveCart } from '@/shared/lib/queries';

const sortOptions = [
  { label: 'Popularité', value: 'popularity' },
  { label: 'Prix croissant', value: 'price-asc' },
  { label: 'Prix décroissant', value: 'price-desc' },
  { label: 'Note client', value: 'rating' }
];

export default function StoreModule() {
  const { user, profile, requireAuth } = useAuth();

  // ✅ Produits chargés depuis Supabase — plus de fichier statique
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(true);

  React.useEffect(() => {
    // Timeout de sécurité — afficher la boutique même si Supabase est lent
    const timeout = setTimeout(() => setProductsLoading(false), 8000);
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('popularity', { ascending: false });
        if (error) throw error;
        setAllProducts((data || []) as Product[]);
      } catch (err) {
        logError('StoreModule/fetchProducts', err);
      } finally {
        clearTimeout(timeout);
        setProductsLoading(false);
      }
    }
    fetchProducts();
    return () => clearTimeout(timeout);
  }, []);

  const categories = React.useMemo(() =>
    ['Tous', ...Array.from(new Set(allProducts.map(p => p.category).filter(Boolean)))],
    [allProducts]
  );

  const [visibleCount, setVisibleCount] = React.useState(8);
  const [showPromoBanner, setShowPromoBanner] = React.useState(true);
  const promoProducts = React.useMemo(
    () => allProducts.filter(p => (p as any).is_promo || (p as any).discount > 0).slice(0, 4),
    [allProducts]
  );
  const [wishlist, setWishlist] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch { return []; }
  });
  React.useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const fuse = React.useMemo(() => new Fuse(allProducts, {
    keys: ['name', 'description', 'category'],
    threshold: 0.35,
    minMatchCharLength: 2,
  }), [allProducts]);

  const suggestions = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    return fuse.search(searchQuery).map(r => r.item).slice(0, 5);
  }, [searchQuery, fuse]);

  const [minPrice, setMinPrice] = React.useState(0);
  const [maxPrice, setMaxPrice] = React.useState(500000);
  const [selectedCategory, setSelectedCategory] = React.useState('Tous');
  const [sortBy, setSortBy] = React.useState('popularity');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [cart, setCart] = React.useState<CartItem[]>([]);

  // ✅ Charger le panier depuis Supabase si connecté
  React.useEffect(() => {
    if (!user) return;
    supabase.from('carts').select('items').eq('user_id', user.id).single()
      .then(({ data }) => { if (data?.items?.length) setCart(data.items as CartItem[]); })
      .catch(() => {});
  }, [user?.id]);

  // ✅ Sauvegarder le panier dans Supabase (upsert direct sur la table carts)
  const saveCart = React.useCallback(async (items: CartItem[]) => {
    if (!user) return;
    try {
      await supabase.from('carts').upsert(
        { user_id: user.id, items, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    } catch { /* silencieux */ }
  }, [user?.id]);

  // ✅ Vider le panier en base après commande
  const clearCartInDB = React.useCallback(async () => {
    if (!user) return;
    try {
      await supabase.from('carts').upsert(
        { user_id: user.id, items: [], updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    } catch { /* silencieux */ }
  }, [user?.id]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{ name: string; type: 'add' | 'remove' } | null>(null);
  const [cartBump, setCartBump] = React.useState(false);
  const loaderRef = React.useRef<HTMLDivElement>(null);

  const filteredProducts = React.useMemo(() => {
    let result = allProducts;
    if (searchQuery.trim()) result = fuse.search(searchQuery).map(r => r.item);
    result = result.filter(p =>
      p.price >= minPrice && p.price <= maxPrice &&
      (selectedCategory === 'Tous' || p.category === selectedCategory)
    );
    return [...result].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.popularity || 0) - (a.popularity || 0);
    });
  }, [allProducts, searchQuery, minPrice, maxPrice, selectedCategory, sortBy, fuse]);

  const hasMore = visibleCount < filteredProducts.length;

  React.useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setVisibleCount(prev => Math.min(prev + 4, filteredProducts.length));
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, filteredProducts.length]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      const next = ex ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
                      : [...prev, { ...product, quantity: 1 }];
      saveCart(next);
      return next;
    });
    setToast({ name: product.name, type: 'add' });
    setCartBump(true);
    setTimeout(() => setCartBump(false), 300);
    setTimeout(() => setToast(null), 3000);
  };

  const removeFromCart = (productId: string) => {
    const item = cart.find(i => i.id === productId);
    if (item) { setToast({ name: item.name, type: 'remove' }); setTimeout(() => setToast(null), 3000); }
    setCart(prev => {
      const next = prev.filter(i => i.id !== productId);
      saveCart(next);
      return next;
    });
    setCartBump(true); setTimeout(() => setCartBump(false), 300);
    setItemToDelete(null);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    requireAuth(async () => {
      const itemsList = cart.map(i => `- ${i.name} (x${i.quantity}) : ${(i.price * i.quantity).toLocaleString()} FCFA`).join('\n');
      const total = cartTotal.toLocaleString();
      const userName = profile?.full_name || 'Client';
      const message = `Bonjour GCFI, je suis ${userName}. Commande :\n\n${itemsList}\n\n*Total : ${total} FCFA*`;
      try {
        if (user) {
          await supabase.from('orders').insert([{
            customer_id: user.id,
            customer_email: user.email,
            total: cartTotal,
            items: cart,
            status: 'En préparation'
          }]);
        }
      } catch (err) { logError('StoreModule/checkout', err); }
      window.open(`https://wa.me/237681371449?text=${encodeURIComponent(message)}`, '_blank');
      setCart([]); setIsCartOpen(false); clearCartInDB();
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const next = prev.map(item =>
        item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      );
      saveCart(next);
      return next;
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-16 bg-white dark:bg-slate-900 transition-colors">
      {/* ── Bannière Produits en Promotion ──────────────────── */}
      <AnimatePresence>
        {showPromoBanner && promoProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 250, damping: 28 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[90] w-[95vw] max-w-3xl"
          >
            <div className="bg-gradient-to-r from-[var(--accent)] to-slate-900 rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {/* Images produits */}
                <div className="hidden sm:flex gap-2 shrink-0">
                  {promoProducts.slice(0, 3).map(p => (
                    <div key={p.id} className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 shrink-0">
                      {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}
                    </div>
                  ))}
                </div>
                {/* Texte */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm uppercase tracking-widest">
                    🔥 Promotions en cours
                  </p>
                  <p className="text-white/70 text-xs mt-0.5">
                    {promoProducts.length} produit{promoProducts.length > 1 ? 's' : ''} à prix réduit
                  </p>
                </div>
                {/* CTA */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setShowPromoBanner(false); document.getElementById('promo-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="bg-white text-[var(--accent)] text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-2xl hover:bg-red-50 transition-colors whitespace-nowrap"
                  >
                    Voir les offres
                  </button>
                  <button onClick={() => setShowPromoBanner(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Boutique GCFI</h2>
            <p className="text-slate-500 dark:text-slate-400">Équipements réseaux et terminaux mobiles certifiés.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <Filter className="w-4 h-4" /> Filtres
            </button>
            <motion.button onClick={() => setIsCartOpen(true)}
              animate={cartBump ? { scale: [1, 1.2, 1] } : {}}
              className="relative flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] rounded-2xl text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 hover:bg-[var(--accent-hover)] transition-colors">
              <ShoppingCart className="w-4 h-4" />
              Panier
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[10px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input type="text" placeholder="Rechercher un produit..."
            value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all" />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-20 overflow-hidden">
              {suggestions.map(s => (
                <button key={s.id} onMouseDown={() => { setSearchQuery(s.name); setShowSuggestions(false); }}
                  className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <img src={s.image} alt={s.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-[var(--accent)] font-bold">{s.price.toLocaleString()} FCFA</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Catégorie</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                          selectedCategory === cat ? "bg-[var(--accent)] text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100")}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Prix max : {maxPrice.toLocaleString()} FCFA</label>
                  <input type="range" min="0" max="500000" step="5000" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Trier par</label>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map(opt => (
                      <button key={opt.value} onClick={() => setSortBy(opt.value)}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all",
                          sortBy === opt.value ? "bg-[var(--accent)] text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300")}>
                        <ArrowUpDown className="w-3 h-3" /> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-bold">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.slice(0, visibleCount).map((product) => (
              <motion.div key={product.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 hover:shadow-2xl transition-all shadow-sm flex flex-col cursor-pointer"
                onClick={() => setSelectedProduct(product)}>
                <div className="relative h-48 overflow-hidden">
                  <img src={product.image} alt={product.name} loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <button onClick={e => toggleWishlist(product.id, e)}
                    className={cn("absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg",
                      wishlist.includes(product.id) ? "bg-[var(--accent)] text-white" : "bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-[var(--accent)]")}>
                    <Heart className={cn("w-4 h-4", wishlist.includes(product.id) && "fill-current")} />
                  </button>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-1">{product.category}</p>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[var(--accent)] transition-colors">{product.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{product.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {(product as any).discount > 0 ? (
                        <>
                          <p className="text-lg font-black text-[var(--accent)]">
                            {Math.round(product.price * (1 - (product as any).discount / 100)).toLocaleString()}
                            <span className="text-xs font-bold ml-1">FCFA</span>
                          </p>
                          <p className="text-xs text-slate-400 line-through">{product.price.toLocaleString()}</p>
                          <span className="text-[10px] font-black bg-[var(--accent)] text-white px-1.5 py-0.5 rounded-full">-{(product as any).discount}%</span>
                        </>
                      ) : (
                        <p className="text-lg font-black text-[var(--accent)]">{product.price.toLocaleString()} <span className="text-xs font-bold">FCFA</span></p>
                      )}
                    </div>
                    <button onClick={e => { e.stopPropagation(); addToCart(product); }}
                      className="flex items-center gap-1.5 bg-[var(--accent)] text-white px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all">
                      <Plus className="w-3.5 h-3.5" /> Ajouter
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {hasMore && <div ref={loaderRef} className="flex justify-center mt-10">
          <div className="w-8 h-8 border-4 border-slate-100 dark:border-slate-800 border-t-[var(--accent)] rounded-full animate-spin" />
        </div>}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 p-2 bg-white/20 backdrop-blur-md rounded-full text-white md:text-slate-900 dark:md:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="md:w-5/12 h-64 md:h-auto">
                <img src={selectedProduct.image} alt={selectedProduct.name} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="p-8 md:w-7/12">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--accent)] mb-2">{selectedProduct.category}</p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{selectedProduct.name}</h2>
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-4 h-4", i < Math.floor(selectedProduct.rating || 0) ? "text-yellow-400 fill-current" : "text-slate-300")} />)}
                  <span className="text-xs text-slate-500 dark:text-slate-400">({selectedProduct.reviewsCount || 0} avis)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">{selectedProduct.description}</p>
                <div className="flex items-baseline gap-3 mb-6">
                  {(selectedProduct as any).discount > 0 ? (
                    <>
                      <p className="text-3xl font-black text-[var(--accent)]">
                        {Math.round(selectedProduct.price * (1 - (selectedProduct as any).discount / 100)).toLocaleString()}
                        <span className="text-sm font-bold ml-1">FCFA</span>
                      </p>
                      <p className="text-lg text-slate-400 line-through">{selectedProduct.price.toLocaleString()}</p>
                      <span className="bg-[var(--accent)] text-white text-xs font-black px-2 py-1 rounded-full">-{(selectedProduct as any).discount}%</span>
                    </>
                  ) : (
                    <p className="text-3xl font-black text-[var(--accent)]">{selectedProduct.price.toLocaleString()} <span className="text-sm font-bold">FCFA</span></p>
                  )}
                </div>
                <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                  className="w-full bg-[var(--accent)] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[var(--accent)]/20 hover:bg-[var(--accent-hover)] flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Ajouter au panier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="relative w-full max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Mon Panier <span className="text-[var(--accent)]">({cartCount})</span></h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingBag className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
                    <p className="text-slate-500 font-bold">Votre panier est vide</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <img src={item.image} alt={item.name} loading="lazy" className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-[var(--accent)] font-black text-sm">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => setItemToDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between mb-4">
                    <span className="font-bold text-slate-900 dark:text-white">Total</span>
                    <span className="font-black text-[var(--accent)]">{cartTotal.toLocaleString()} FCFA</span>
                  </div>
                  <button onClick={handleCheckout} className="w-full bg-[var(--accent)] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[var(--accent)]/20 flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)]">
                    <MessageSquare className="w-4 h-4" /> Commander via WhatsApp
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full">
              <AlertCircle className="w-12 h-12 text-[var(--accent)] mx-auto mb-4" />
              <h3 className="font-black text-slate-900 dark:text-white mb-2">Retirer du panier ?</h3>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setItemToDelete(null)} className="flex-1 py-3 rounded-2xl font-black text-xs uppercase bg-slate-100 dark:bg-slate-700">Annuler</button>
                <button onClick={() => removeFromCart(itemToDelete)} className="flex-1 py-3 rounded-2xl font-black text-xs uppercase bg-[var(--accent)] text-white">Retirer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className={cn("fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border",
              toast.type === 'add' ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-700 dark:border-slate-200"
                                   : "bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800")}>
            {toast.type === 'add' ? <ChevronRight className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            <span className="text-sm font-bold">{toast.type === 'add' ? `${toast.name} ajouté` : `${toast.name} retiré`}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}