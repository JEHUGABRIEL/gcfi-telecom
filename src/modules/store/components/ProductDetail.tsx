import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, Shield, Truck, RefreshCw, Package, Tag } from 'lucide-react';
import { useProducts } from '@/shared/lib/queries';
import { useAuth } from '@/shared/context/AuthContext';
import { setStructuredData, productSchema } from '@/shared/lib/structured-data';
import type { Product } from '@/shared/types';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const { user, setShowAuthModal } = useAuth();
  const [added, setAdded] = React.useState(false);
  const [wishlisted, setWishlisted] = React.useState(false);

  const product = products.find((p: Product) => p.id === id);

  // ✅ NOUVEAU : Structured data + LazyImage
  React.useEffect(() => {
    if (product) {
      setStructuredData(productSchema(product));
    }
  }, [product]);

  React.useEffect(() => {
    if (!isLoading && !product) navigate('/boutique', { replace: true });
  }, [product, isLoading, navigate]);

  const handleAddToCart = () => {
    if (!user) { setShowAuthModal(true); return; }
    window.dispatchEvent(new CustomEvent('gcfi:add-to-cart', { detail: product }));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = () => {
    navigator.share?.({ title: product?.name, url: window.location.href })
      .catch(() => navigator.clipboard.writeText(window.location.href));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#C1272D] rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#C1272D] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la boutique
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="aspect-square bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-slate-200" />
                </div>
              )}
            </div>
            <span className="absolute top-4 left-4 bg-[#C1272D] text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
              {product.category}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col justify-center"
          >
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
              {product.name}
            </h1>

            {product.rating && (
              <div className="flex items-center gap-2 mb-5">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating!) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <span className="text-sm text-slate-500 font-medium">
                  {product.rating.toFixed(1)} ({product.reviewsCount ?? product.reviews_count ?? 0} avis)
                </span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-black text-[#C1272D]">
                {product.price.toLocaleString('fr-FR')}
              </span>
              <span className="text-lg font-bold text-slate-500">FCFA</span>
            </div>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 text-base">
              {product.description}
            </p>

            {product.stock !== undefined && (
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className={`text-sm font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
                </span>
              </div>
            )}

            <div className="flex gap-3 mb-8">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                  added
                    ? 'bg-green-500 text-white'
                    : product.stock === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#C1272D] hover:bg-[#1E4D8C] text-white shadow-lg shadow-[#C1272D]/20'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {added ? 'Ajouté !' : 'Ajouter au panier'}
              </motion.button>

              <button
                onClick={() => setWishlisted(v => !v)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  wishlisted
                    ? 'border-red-200 bg-red-50 text-red-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-red-200 hover:text-red-400'
                }`}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-red-500' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-[#C1272D] hover:text-[#C1272D] transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Shield, label: 'Garantie', sub: '12 mois' },
                { icon: Truck, label: 'Livraison', sub: 'Bangui & provinces' },
                { icon: RefreshCw, label: 'Retour', sub: '7 jours' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Icon className="w-5 h-5 text-[#C1272D] mb-2" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">{label}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{sub}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {product.category && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 flex items-center gap-3"
          >
            <Tag className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Catégorie</span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold px-4 py-1.5 rounded-full">
              {product.category}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}