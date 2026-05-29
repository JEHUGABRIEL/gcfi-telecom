import React from 'react';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, Percent, RefreshCw, Search, ShoppingBag, GraduationCap, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type PromoSection = 'produits' | 'formations';

interface Item {
  id: string;
  name?: string;
  title?: string;
  category: string;
  price: number;
  discount: number;
  is_promo: boolean;
  image?: string;
}

/* ── Modal confirmation ──────────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center z-10">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirmer</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700">Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-[#C1272D] text-white">Confirmer</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Composant de ligne d'article ────────────────────────────── */
function ItemRow({ item, label, onUpdate }: { item: Item; label: string; onUpdate: (id: string, discount: number, is_promo: boolean) => void }) {
  const [discount, setDiscount] = React.useState(item.discount ?? 0);
  const [isPromo, setIsPromo] = React.useState(item.is_promo ?? false);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const discountedPrice = Math.round(item.price * (1 - discount / 100));

  const save = async () => {
    setSaving(true);
    await onUpdate(item.id, discount, isPromo);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const changed = discount !== (item.discount ?? 0) || isPromo !== (item.is_promo ?? false);

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-2xl border transition-all",
      isPromo ? "border-[#C1272D]/30 bg-red-50/50 dark:bg-red-900/10" : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
    )}>
      {/* Image */}
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 relative">
        {item.image ? <Image src={item.image} alt={label} fill className="object-cover" sizes="48px" /> : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ShoppingBag className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{item.category}</span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.price.toLocaleString()} FCFA</span>
          {discount > 0 && (
            <span className="text-xs font-black text-[#C1272D]">→ {discountedPrice.toLocaleString()} FCFA</span>
          )}
        </div>
      </div>

      {/* Toggle Promo */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button type="button"
          onClick={() => setIsPromo(v => !v)}
          className={cn('relative w-10 h-5 rounded-full transition-colors', isPromo ? 'bg-[#C1272D]' : 'bg-slate-200 dark:bg-slate-600')}>
          <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', isPromo ? 'translate-x-5' : 'translate-x-0.5')} />
        </button>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Promo</span>
      </div>

      {/* Discount */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="relative w-20">
          <input
            type="number" min="0" max="90" value={discount}
            onChange={e => { setDiscount(Math.min(90, Math.max(0, Number(e.target.value)))); }}
            className="w-full pl-3 pr-7 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#C1272D] text-slate-900 dark:text-white"
          />
          <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={save} disabled={saving || !changed}
        className={cn(
          "shrink-0 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
          saved ? "bg-green-100 text-green-700"
          : changed ? "bg-[#C1272D] text-white hover:opacity-90"
          : "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
        )}
      >
        {saving ? "..." : saved ? "✓" : "OK"}
      </button>
    </div>
  );
}

/* ── PromoTab principal ──────────────────────────────────────── */
export default function PromoTab() {
  const queryClient = useQueryClient();
  const [section, setSection] = React.useState<PromoSection>('produits');
  const [search, setSearch] = React.useState('');
  const [filterPromo, setFilterPromo] = React.useState(false);
  const [resetTarget, setResetTarget] = React.useState<'all' | null>(null);

  const table = section === 'produits' ? 'products' : 'trainings';
  const queryKey = ['admin', 'promo', section];

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase.from(table).select('id, name, title, category, price, discount, is_promo, image').order('name', { ascending: true });
      return (data || []) as Item[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const updateItem = async (id: string, discount: number, is_promo: boolean) => {
    await supabase.from(table).update({ discount, is_promo }).eq('id', id);
    invalidate();
  };

  const resetAll = async () => {
    await supabase.from(table).update({ discount: 0, is_promo: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    setResetTarget(null);
    invalidate();
  };

  const filtered = items.filter(i => {
    const label = (i.name || i.title || '').toLowerCase();
    const matchSearch = label.includes(search.toLowerCase()) || (i.category || '').toLowerCase().includes(search.toLowerCase());
    const matchPromo = !filterPromo || i.is_promo;
    return matchSearch && matchPromo;
  });

  const promoCount = items.filter(i => i.is_promo).length;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {resetTarget && (
          <ConfirmModal
            message={`Réinitialiser toutes les promotions sur les ${section} ? Les réductions seront remises à 0.`}
            onConfirm={resetAll}
            onCancel={() => setResetTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#C1272D]" /> Gestion des Promotions
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">{promoCount} article{promoCount > 1 ? 's' : ''} en promotion actuellement</p>
        </div>
        <div className="flex gap-2">
          <button onClick={invalidate} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setResetTarget('all')}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors">
            <X className="w-3.5 h-3.5" /> Tout réinitialiser
          </button>
        </div>
      </div>

      {/* Onglets sous-section */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
        {([['produits', ShoppingBag, 'Produits'], ['formations', GraduationCap, 'Formations']] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setSection(key as PromoSection)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
              section === key ? 'bg-white dark:bg-slate-700 text-[#C1272D] shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: items.length, color: 'slate' },
          { label: 'En promo', value: items.filter(i => i.is_promo).length, color: 'red' },
          { label: 'Avec réduction', value: items.filter(i => (i.discount ?? 0) > 0).length, color: 'amber' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 text-center">
            <p className={cn('text-2xl font-black', stat.color === 'red' ? 'text-[#C1272D]' : stat.color === 'amber' ? 'text-amber-500' : 'text-slate-900 dark:text-white')}>
              {stat.value}
            </p>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#C1272D]" />
        </div>
        <button onClick={() => setFilterPromo(v => !v)}
          className={cn('px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border',
            filterPromo ? 'bg-[#C1272D] text-white border-[#C1272D]' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-[#C1272D]')}>
          🔥 Promo seules
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun article trouvé.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              label={item.name || item.title || ''}
              onUpdate={updateItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}