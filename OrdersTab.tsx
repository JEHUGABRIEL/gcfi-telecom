import React from 'react';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { RefreshCw, ShoppingBag } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  'En préparation': 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  'Expédiée':       'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  'Livrée':         'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  'Annulée':        'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

export default function OrdersTab() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) logError('OrdersTab', error);
    else setOrders(data || []);
    setLoading(false);
  };

  React.useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Commandes</h3>
        <button onClick={fetch} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune commande.</p></div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-700">
          {orders.map(order => (
            <div key={order.id} className="p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{order.customer_email}</p>
                <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString('fr-FR')} · {order.items?.length ?? 0} article(s)</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-black text-[#C1272D]">{order.total?.toLocaleString()} FCFA</p>
                <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                  className={cn('text-xs font-bold px-3 py-1.5 rounded-full border-0 outline-none cursor-pointer', STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600')}>
                  {['En préparation', 'Expédiée', 'Livrée', 'Annulée'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
