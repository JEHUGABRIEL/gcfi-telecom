import React from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Order } from '@/shared/types';
import { Package, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useLang } from '@/shared/context/LanguageContext';
import Pagination from '@/shared/components/ui/Pagination';
import AdminTable from '@/shared/components/ui/AdminTable';

const PAGE_SIZE = 10;

const STATUS_COLORS: Record<Order['status'], string> = {
  'En préparation': 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  'Expédiée':       'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  'Livrée':         'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  'Annulée':        'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  'completed':      'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
};

export default function OrdersTab() {
  const { t } = useLang();
  const ap = t.admin_page;
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin', 'orders', page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) { logError('OrdersTab/fetch', error); return { orders: [], total: 0 }; }
      return { orders: (data || []) as Order[], total: count ?? 0 };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  const orders     = data?.orders ?? [];
  const totalItems = data?.total  ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {ap.order_title}
          {totalItems > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400">({totalItems} {ap.order_total})</span>
          )}
        </h3>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'orders', page] })}
          className="text-xs text-slate-500 hover:text-[#C1272D] flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} /> {ap.header_refresh}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{ap.order_empty}</p>
        </div>
      ) : (
        <>
          <AdminTable
            columns={[
              { header: 'ID', cell: (order) => <span className="font-bold text-slate-900 dark:text-white">#{order.id.slice(0, 8)}</span> },
              { header: ap.table_client, cell: (order) => <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{order.customer_email}</p> },
              {
                header: ap.table_date,
                cell: (order) => <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>,
              },
              { header: ap.order_total, align: 'right' as const, cell: (order) => <span className="font-bold text-[#C1272D] whitespace-nowrap">{order.total?.toLocaleString('fr-FR')} FCFA</span> },
              {
                header: ap.users_label_status,
                cell: (order) => (
                  <span className={cn('inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full whitespace-nowrap', STATUS_COLORS[order.status])}>
                    {order.status}
                  </span>
                ),
              },
            ]}
            data={orders}
            getKey={(order) => order.id}
            minWidth="720px"
          />

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