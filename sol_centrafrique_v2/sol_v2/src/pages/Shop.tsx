import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCTS } from '../constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShoppingCart, Check, Filter, Search, ShoppingBag, MessageSquare, Heart, HeartOff, Loader2, Lock, Clock as ClockIcon, Star, X, Info, FileText } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';
import { fetchPosts } from '../services/adminService';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  category: string;
}

const Countdown = ({ expiryDate }: { expiryDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(expiryDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [expiryDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-black text-white/90 bg-brand-primary/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
      <ClockIcon className="h-3 w-3 animate-pulse" />
      <span>
        {timeLeft.days}j {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    </div>
  );
};

const StarRating = ({ productId, initialRating = 0, interactive = true }: { productId: string, initialRating?: number, interactive?: boolean }) => {
  const { ratings, addRating } = useCart();
  const currentRating = ratings[productId] || initialRating;
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={(e) => {
            e.stopPropagation();
            if (interactive) addRating(productId, star);
          }}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`transition-all ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
        >
          <Star 
            className={`h-4 w-4 ${
              star <= (hover || currentRating) 
                ? 'fill-brand-primary text-brand-primary' 
                : 'text-gray-200'
            }`} 
          />
        </button>
      ))}
      <span className="text-[10px] font-black text-gray-400 ml-1">
        ({currentRating > 0 ? (currentRating + Math.floor(Math.random() * 10)).toFixed(1) : 'S/N'})
      </span>
    </div>
  );
};

const ProductSkeleton = () => (
  <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 flex flex-col animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-8 space-y-4">
      <div className="h-6 bg-gray-200 rounded-full w-3/4" />
      <div className="h-4 bg-gray-200 rounded-full w-full" />
      <div className="h-4 bg-gray-200 rounded-full w-5/6" />
      <div className="pt-6 flex justify-between">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded-full w-12" />
          <div className="h-6 bg-gray-200 rounded-full w-24" />
        </div>
        <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  </div>
);

const CATEGORIES = ['Tous', 'Panneaux', 'Stockage', 'Onduleurs', 'Kits'];

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);
  const { addToCart, cart, favorites, toggleFavorite } = useCart();
  // User auth removed
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    loadPosts();
    return () => clearTimeout(timer);
  }, []);

  const loadPosts = async () => {
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      console.error("Error loading posts for shop", err);
    }
  };

  const usefulArticles = useMemo(() => {
    if (!selectedProduct) return [];
    // Match posts by product category or keywords
    return posts.filter(post => 
      post.category.toLowerCase().includes(selectedProduct.category.toLowerCase()) ||
      selectedProduct.title.toLowerCase().split(' ').some(word => 
        word.length > 3 && post.title.toLowerCase().includes(word)
      )
    ).slice(0, 2);
  }, [selectedProduct, posts]);

  const filteredProducts = PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'Tous' || p.category === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const similarProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return PRODUCTS.filter(p => 
      p.id !== selectedProduct.id && 
      (p.category === selectedProduct.category)
    ).slice(0, 3);
  }, [selectedProduct]);

  const isInCart = (id: string) => cart.some(item => item.id === id);

  const handleProductClick = (product: typeof PRODUCTS[0]) => {
    if (!favorites.includes(product.id)) {
      setSelectedProduct(product);
    } else {
      showToast(`${product.title} est dans vos favoris !`, 'info');
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-brand-neutral">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-brand-primary/20 text-brand-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          >
            <ShoppingBag className="h-4 w-4" /> Boutique Officielle SOL!
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-brand-secondary mb-6 tracking-tighter">
            Equipements Haute Performance
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light">
            Découvrez notre sélection de matériel certifié Tier 1 pour vos installations solaires en Centrafrique.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto w-full md:w-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-brand-primary text-brand-secondary shadow-md' 
                    : 'text-gray-400 hover:text-brand-secondary hover:bg-brand-neutral'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white pl-12 pr-6 py-4 rounded-2xl border border-gray-100 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, idx) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-gray-100 flex flex-col group relative cursor-pointer"
                >
                  <div className="aspect-square relative overflow-hidden bg-brand-neutral">
                    <OptimizedImage 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-full"
                      imgClassName="group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                      <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold uppercase text-brand-primary shadow-sm self-start">
                        {product.category}
                      </div>
                      {product.promoExpiry && (
                        <div className="flex flex-col gap-1">
                          <div className="bg-brand-secondary/90 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black uppercase text-white shadow-sm flex items-center gap-1.5 self-start">
                            <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-ping" /> Offre Spéciale
                          </div>
                          <Countdown expiryDate={product.promoExpiry} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const isFavorite = favorites.includes(product.id);
                        toggleFavorite(product.id);
                        showToast(
                          isFavorite ? `${product.title} retiré des favoris` : `${product.title} ajouté aux favoris`, 
                          isFavorite ? 'info' : 'success'
                        );
                      }}
                      className={`absolute top-4 right-4 p-3 rounded-xl backdrop-blur-md transition-all z-10 hover:scale-110 active:scale-95 ${
                        favorites.includes(product.id)
                          ? 'bg-brand-primary text-brand-secondary shadow-lg'
                          : 'bg-white/50 text-brand-secondary hover:bg-brand-primary hover:text-brand-secondary'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <div className="mb-4">
                      <StarRating productId={product.id} initialRating={4} />
                    </div>
                    <h3 className="text-xl font-bold text-brand-secondary mb-2 group-hover:text-brand-primary transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                    
                    <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Prix Estimé</p>
                        <p className="text-xl font-black text-brand-secondary">{product.price} FCFA</p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (false) {
                            // user auth removed
                            return;
                          }
                          addToCart({ 
                            id: product.id, 
                            title: product.title, 
                            price: product.price, 
                            image: product.image,
                            type: 'product',
                            category: product.category
                          });
                          showToast(`${product.title} ajouté au panier !`, 'success');
                        }}
                        disabled={isInCart(product.id)}
                        className={`p-4 rounded-2xl transition-all relative group ${
                          isInCart(product.id)
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                            : 'bg-brand-neutral text-brand-secondary hover:bg-brand-primary shadow-sm hover:shadow-brand-primary/20'
                        }`}
                      >
                        {false ? (
                          <div className="flex items-center gap-2">
                             <Lock className="h-5 w-5 opacity-50" />
                             <ShoppingCart className="h-6 w-6" />
                          </div>
                        ) : (
                          isInCart(product.id) ? <Check className="h-6 w-6" /> : <ShoppingCart className="h-6 w-6" />
                        )}
                        
                        {false && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-brand-secondary text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Connectez-vous pour commander
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {filteredProducts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 shadow-sm">
              <Search className="h-8 w-8" />
            </div>
            <p className="text-gray-400 font-medium italic">Aucun produit ne correspond à votre recherche.</p>
          </motion.div>
        )}

        <AnimatePresence>
          {selectedProduct && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setSelectedProduct(null)} 
                className="absolute inset-0 bg-brand-secondary/60 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] overflow-y-auto md:overflow-hidden"
              >
                <button 
                  onClick={() => setSelectedProduct(null)} 
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-brand-secondary z-20"
                >
                  <X className="h-8 w-8" />
                </button>

                <div className="md:w-1/2 bg-brand-neutral flex items-center justify-center relative">
                  <OptimizedImage src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-full" />
                </div>

                <div className="md:w-1/2 p-12 flex flex-col h-full overflow-y-auto">
                  <div className="mb-6">
                    <StarRating productId={selectedProduct.id} initialRating={4} />
                    <h2 className="text-3xl font-black text-brand-secondary mt-2">{selectedProduct.title}</h2>
                  </div>

                  <p className="text-gray-500 mb-8 leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  <div className="bg-brand-neutral p-6 rounded-3xl mb-8 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Prix de base</span>
                      <span className="text-3xl font-black text-brand-secondary">{selectedProduct.price} FCFA</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-green-500 uppercase tracking-widest block mb-1">Disponibilité</span>
                      <span className="text-sm font-bold text-brand-secondary">En Stock</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-12">
                    <button
                      onClick={() => {
                        if (false) {
                          // user auth removed
                          return;
                        }
                        addToCart({ 
                          id: selectedProduct.id, 
                          title: selectedProduct.title, 
                          price: selectedProduct.price, 
                          image: selectedProduct.image,
                          type: 'product',
                          category: selectedProduct.category
                        });
                        showToast("Produit ajouté !", 'success');
                      }}
                      className="flex-1 bg-brand-primary text-brand-secondary px-8 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3"
                    >
                      <ShoppingCart className="h-6 w-6" /> Panier
                    </button>
                    <button
                      onClick={() => {
                        const isFavorite = favorites.includes(selectedProduct.id);
                        toggleFavorite(selectedProduct.id);
                        showToast(
                          isFavorite ? `${selectedProduct.title} retiré des favoris` : `${selectedProduct.title} ajouté aux favoris`, 
                          isFavorite ? 'info' : 'success'
                        );
                      }}
                      className={`px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${
                        favorites.includes(selectedProduct.id)
                          ? 'bg-red-50 border-red-200 text-red-500'
                          : 'bg-white border-brand-neutral text-brand-secondary hover:bg-brand-neutral'
                      }`}
                    >
                      <Heart className={`h-6 w-6 ${favorites.includes(selectedProduct.id) ? 'fill-current' : ''}`} />
                      Favoris
                    </button>
                  </div>

                  <div className="mb-12">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Articles Utiles
                    </h4>
                    {usefulArticles.length > 0 ? (
                      <div className="space-y-3">
                        {usefulArticles.map(article => (
                          <Link 
                            key={article.id} 
                            to="/blog" 
                            className="flex items-center gap-4 p-4 bg-brand-neutral/50 rounded-2xl hover:bg-brand-primary/10 transition-all border border-transparent hover:border-brand-primary/20 group"
                          >
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                              <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-0.5">{article.category}</p>
                              <h5 className="text-sm font-bold text-brand-secondary line-clamp-1 group-hover:text-brand-primary transition-colors">{article.title}</h5>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic">Aucun article disponible pour ce produit.</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Info className="h-4 w-4" /> Produits Similaires
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {similarProducts.map(p => (
                        <button key={p.id} onClick={() => setSelectedProduct(p)} className="group flex flex-col text-left">
                          <div className="aspect-square rounded-2xl overflow-hidden bg-brand-neutral mb-2">
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <span className="text-[10px] font-bold text-brand-secondary line-clamp-1">{p.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* WhatsApp Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 bg-brand-secondary rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <ShoppingCart className="h-48 w-48" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">Besoin d'un conseil technique ?</h2>
            <p className="text-white/70 text-lg mb-10 leading-relaxed">
              Nos experts vous accompagnent dans le choix du matériel adapté à votre projet. Commandez directement via WhatsApp pour un service ultra-rapide.
            </p>
            <a 
              href="https://wa.me/23675000000" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-primary text-brand-secondary px-10 py-5 rounded-2xl font-bold inline-flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-brand-primary/20"
            >
              <MessageSquare className="h-6 w-6" /> WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
