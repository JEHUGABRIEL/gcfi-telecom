import React from 'react';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Order } from '@/shared/types';
import { Package, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Pagination from '@/shared/components/ui/Pagination';

const PAGE_SIZE = 10;

const STATUS_COLORS: Record<Order['status'], string> = {
  'En préparation': 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  'Expédiée':       'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  'Livrée':         'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  'Annulée':        'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

export default function OrdersTab() {
  const [orders, setOrders]         = React.useState<Order[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [page, setPage]             = React.useState(1);
  const [loading, setLoading]       = React.useState(true);

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const fetchOrders = React.useCallback(async (p: number) => {
    setLoading(true);
    const from = (p - 1) * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      logError('OrdersTab/fetch', error);
    } else {
      setOrders((data || []) as Order[]);
      setTotalItems(count ?? 0);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => { fetchOrders(page); }, [page, fetchOrders]);

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Commandes
          {totalItems > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400">({totalItems} au total)</span>
          )}
        </h3>
        <button
          onClick={() => fetchOrders(page)}
          className="text-xs text-slate-500 hover:text-[#C1272D] flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune commande pour le moment.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4 hover:border-[#C1272D]/30 transition-all">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">#{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{order.customer_email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-[#C1272D]">
                      {order.total?.toLocaleString('fr-FR')} FCFA
                    </p>
                    <span className={cn('inline-block mt-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full', STATUS_COLORS[order.status])}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
