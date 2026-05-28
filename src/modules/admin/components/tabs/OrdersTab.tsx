import React from 'react';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Order } from '@/shared/types';
import { Package, Eye } from 'lucide-react';

export default function OrdersTab() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) logError('OrdersTab/fetch', error);
    else setOrders(data || []);
    setLoading(false);
  };

  React.useEffect(() => { fetchOrders(); }, []);

  if (loading) return <div className="p-8 text-center">Chargement des commandes...</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Commandes</h3>
      {orders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune commande pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">#{order.id.slice(0,8)}</p>
                  <p className="text-sm text-slate-500">{order.customer_email}</p>
                  <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#C1272D]">{order.total?.toLocaleString()} FCFA</p>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}