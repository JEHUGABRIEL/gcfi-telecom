import React from 'react';
import Image from 'next/image';
import { supabase } from '@/shared/lib/supabase';
import { useNotifications } from '@/shared/context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Minus, 
  RefreshCw, 
  AlertTriangle, 
  Package,
  Info
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useLang } from '@/shared/context/LanguageContext';

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  image: string;
}

export default function ProductStockManager() {
  const { t } = useLang();
  const ap = t.admin_page;
  const { addNotification } = useNotifications();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [stockInputs, setStockInputs] = React.useState<Record<string, string>>({});

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
      
      const inputs: Record<string, string> = {};
      data?.forEach(p => {
        inputs[p.id] = p.stock.toString();
      });
      setStockInputs(inputs);
    } catch (err) {
      addNotification({
        title: ap.stock_notif_load_error,
        message: ap.stock_notif_load_error_msg,
        type: 'info'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  React.useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('public:products:stock')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          const updatedProduct = payload.new as Product;
          setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
          setStockInputs(prev => ({ ...prev, [updatedProduct.id]: updatedProduct.stock.toString() }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  const handleStockUpdate = async (productId: string, newStock: number) => {
    const finalStock = Math.max(0, newStock);
    setUpdatingId(productId);
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: finalStock })
        .eq('id', productId);
      
      if (error) throw error;

      addNotification({
        title: ap.stock_notif_loaded,
        message: ap.stock_notif_loaded_msg,
        type: 'info'
      });

      if (finalStock < 5) {
        const product = products.find(p => p.id === productId);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from('notifications').insert([{
            user_id: session.user.id,
            title: finalStock === 0 ? ap.stock_alert_title_empty : ap.stock_alert_title_low,
            message: (finalStock === 0 ? ap.stock_alert_msg_empty : ap.stock_alert_msg_low).replace('{name}', product?.name || '').replace('{stock}', String(finalStock)),
            type: finalStock === 0 ? 'error' : 'warning',
            read: false
          }]);
        }
      }

    } catch (err: unknown) {
      addNotification({
        title: ap.stock_notif_update_error,
        message: err instanceof Error ? err.message : ap.stock_notif_update_error_msg,
        type: 'info'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const adjustStock = (productId: string, delta: number) => {
    const currentVal = parseInt(stockInputs[productId] || '0');
    const newVal = Math.max(0, currentVal + delta);
    setStockInputs(prev => ({ ...prev, [productId]: newVal.toString() }));
    handleStockUpdate(productId, newVal);
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: ap.stock_out, color: 'text-red-600 bg-red-50 dark:bg-red-900/30' };
    if (stock <= 5) return { label: ap.stock_low, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' };
    return { label: ap.stock_in, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' };
  };

  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    const status = getStockStatus(p.stock).label.toLowerCase();
    return (
      p.name?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      status.includes(query)
    );
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="p-8 border-b border-slate-50 dark:border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{ap.stock_manager_title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{ap.stock_manager_desc}</p>
          </div>
          <button 
            onClick={() => fetchProducts()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {ap.header_refresh}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder={ap.stock_search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-[#C1272D] text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50">
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{ap.stock_header_product}</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{ap.stock_header_status}</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{ap.stock_header_current}</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">{ap.stock_header_adjust}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-[#C1272D] animate-spin" />
                    <span className="text-sm font-bold text-slate-400">{ap.stock_inventory_loading}</span>
                  </div>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  {ap.stock_empty_search}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const status = getStockStatus(product.stock);
                const isUpdating = updatingId === product.id;
                
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 relative">
                          <Image src={product.image} alt="" fill className="object-cover" sizes="48px" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#C1272D] transition-colors">{product.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center w-fit gap-1.5",
                        status.color
                      )}>
                        {product.stock <= 5 && <AlertTriangle className="w-3 h-3" />}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-xl font-black",
                          product.stock <= 5 ? "text-red-500" : "text-slate-900 dark:text-white"
                        )}>
                          {product.stock}
                        </span>
                        {product.stock <= 5 && (
                          <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">{ap.stock_restock_needed}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-1 border border-slate-100 dark:border-slate-700">
                          <button 
                            onClick={() => adjustStock(product.id, -1)}
                            disabled={isUpdating || product.stock <= 0}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <input 
                            type="number"
                            value={stockInputs[product.id] || '0'}
                            onChange={(e) => setStockInputs(prev => ({ ...prev, [product.id]: e.target.value }))}
                            onBlur={(e) => handleStockUpdate(product.id, parseInt(e.target.value || '0'))}
                            disabled={isUpdating}
                            className="w-12 bg-transparent text-center text-sm font-black focus:outline-none dark:text-white"
                          />
                          
                          <button 
                            onClick={() => adjustStock(product.id, 1)}
                            disabled={isUpdating}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button 
                          onClick={() => handleStockUpdate(product.id, parseInt(stockInputs[product.id] || '0'))}
                          disabled={isUpdating || parseInt(stockInputs[product.id]) === product.stock}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-lg",
                            isUpdating 
                              ? "bg-slate-100 text-slate-400" 
                              : parseInt(stockInputs[product.id]) === product.stock
                                ? "bg-slate-50 text-slate-200"
                                : "bg-[#C1272D] text-white hover:bg-opacity-90 shadow-red-500/10"
                          )}
                        >
                          {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Info className="w-4 h-4" />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <strong>{ap.stock_tip_label}</strong> {ap.stock_tip}
        </p>
      </div>
    </div>
  );
}